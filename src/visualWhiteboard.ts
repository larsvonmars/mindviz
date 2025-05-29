import { Whiteboard, WhiteboardItem } from "./whiteboard";
import { createSVGIcon } from "./utils/dom";

export interface VisualOptions {
  gridSize?: number;
  snap?: boolean;
  background?: string;
}

export class VisualWhiteboard {
  public readonly board: Whiteboard;
  private readonly container: HTMLElement;
  private readonly canvas: HTMLDivElement;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private options: Required<VisualOptions>;

  // selection
  private selected: Set<number> = new Set();
  private selectionBox: HTMLDivElement | null = null;

  constructor(container: HTMLElement, board: Whiteboard, opts: VisualOptions = {}) {
    // merge opts
    this.options = {
      gridSize: 10,
      snap: true,
      background: "var(--wb-bg, #fdfdfd)",
      ...opts,
    };

    this.container = container;
    this.board = board;

    this.container.classList.add("wb-container");
    Object.assign(this.container.style, {
      position: "relative",
      overflow: "hidden",
      userSelect: "none",
      touchAction: "none",
      background: this.options.background,
    });

    // Create canvas
    this.canvas = document.createElement("div");
    this.canvas.classList.add("wb-canvas");
    Object.assign(this.canvas.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      transformOrigin: "0 0",
    });

    this.container.appendChild(this.canvas);

    // Bind board events to re-render incremental changes
    board.on("item:add", (item: WhiteboardItem) => this.renderItem(item));
    board.on("item:update", (item: WhiteboardItem) => this.updateItemElement(item));
    board.on("item:delete", (item: WhiteboardItem) => this.removeItemElement(item.id));
    board.on("board:load", () => this.fullRender());

    // Global event listeners
    this.bindInteractions();

    // initial render
    this.fullRender();
  }

  // -------------------------------------------------------------------------
  // Rendering helpers
  // -------------------------------------------------------------------------
  private fullRender() {
    this.canvas.innerHTML = "";
    this.board.items.sort((a, b) => (a.z ?? 0) - (b.z ?? 0)).forEach(i => this.renderItem(i));
    this.drawGrid();
  }

  private drawGrid() {
    const size = this.options.gridSize;
    const canvasStyle = this.canvas.style;
    canvasStyle.backgroundImage = `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`;
    canvasStyle.backgroundSize = `${size}px ${size}px`;
  }

  private elementMap = new Map<number, HTMLDivElement>();

  private renderItem(item: WhiteboardItem) {
    const el = document.createElement("div");
    this.elementMap.set(item.id, el);
    el.dataset.id = String(item.id);
    el.classList.add("wb-item");

    this.applyItemStyles(item, el);

    // Content injection
    switch (item.type) {
      case "text":
        el.textContent = String(item.content);
        el.style.font = "14px/1.4 sans-serif";
        el.style.padding = "4px";
        break;
      case "image":
        const img = document.createElement("img");
        img.src = item.content;
        img.draggable = false;
        Object.assign(img.style, { width: "100%", height: "100%", objectFit: "contain" });
        el.appendChild(img);
        break;
      case "graph":
        el.textContent = "GRAPH"; // placeholder – integrate chart.js / d3 later
        break;
      case "shape":
        el.textContent = "SHAPE";
        break;
      case "sticky":
        el.textContent = String(item.content);
        el.style.background = "#ffec3d";
        break;
    }

    // Append & make interactive
    this.canvas.appendChild(el);
    this.makeInteractive(el, item.id);
  }

  private updateItemElement(item: WhiteboardItem) {
    const el = this.elementMap.get(item.id);
    if (el) this.applyItemStyles(item, el);
  }

  private removeItemElement(id: number) {
    const el = this.elementMap.get(id);
    if (el && el.parentElement) el.parentElement.removeChild(el);
    this.elementMap.delete(id);
  }

  private applyItemStyles(item: WhiteboardItem, el: HTMLDivElement) {
    const { x, y, width, height, rotation = 0, opacity = 1, z = 0 } = item;
    Object.assign(el.style, {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      transform: `rotate(${rotation}deg)` + ` translateZ(0)`,
      opacity: String(opacity),
      zIndex: String(z),
      border: "1px solid var(--wb-item-border, #999)",
      background: "var(--wb-item-bg, #fff)",
      boxSizing: "border-box",
      overflow: "hidden",
      cursor: item.locked ? "not-allowed" : "move",
    });
  }

  // -------------------------------------------------------------------------
  // Interaction layer (pointer events)
  // -------------------------------------------------------------------------
  private bindInteractions() {
    // Pan background – middle mouse / space drag
    let isPanning = false;
    let lastX = 0,
      lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 1 || (e.button === 0 && (e as any).spaceKey)) {
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      this.panX += dx;
      this.panY += dy;
      this.updateViewportTransform();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (isPanning) {
        isPanning = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
    };

    this.container.addEventListener("pointerdown", onPointerDown);
    this.container.addEventListener("pointermove", onPointerMove);
    this.container.addEventListener("pointerup", onPointerUp);

    // Zoom with wheel + ctrl
    this.container.addEventListener("wheel", e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const scaleDelta = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoom = Math.max(0.1, Math.min(4, this.zoom * scaleDelta));
      this.updateViewportTransform();
    });

    // Keyboard shortcuts
    window.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.shiftKey ? this.board.redo() : this.board.undo();
      }
      if (e.key === "Delete") {
        [...this.selected].forEach(id => this.board.deleteItem(id));
        this.selected.clear();
      }
    });
  }

  private makeInteractive(el: HTMLDivElement, id: number) {
    let dragging = false;
    let startX = 0,
      startY = 0;
    let itemStartX = 0,
      itemStartY = 0;

    // Select on click
    el.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      const item = this.board.find(id);
      if (!item || item.locked) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      itemStartX = item.x;
      itemStartY = item.y;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      // Selection logic
      if (!e.shiftKey) this.selected.clear();
      this.selected.add(id);
      this.updateSelectionOutline();
    });

    el.addEventListener("pointermove", e => {
      if (!dragging) return;
      const item = this.board.find(id);
      if (!item) return;
      const dx = (e.clientX - startX) / this.zoom;
      const dy = (e.clientY - startY) / this.zoom;
      const nx = itemStartX + dx;
      const ny = itemStartY + dy;
      // Snap to grid
      const snappedX = this.options.snap ? Math.round(nx / this.options.gridSize) * this.options.gridSize : nx;
      const snappedY = this.options.snap ? Math.round(ny / this.options.gridSize) * this.options.gridSize : ny;
      this.board.updateItem(id, { x: snappedX, y: snappedY });
    });

    el.addEventListener("pointerup", e => {
      if (dragging) {
        dragging = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
    });

    // Double click to edit text
    el.addEventListener("dblclick", () => {
      const item = this.board.find(id);
      if (item?.type === "text" && typeof item.content === "string") {
        const newText = prompt("Edit text", item.content);
        if (newText !== null) this.board.updateItem(id, { content: newText });
      }
    });
  }

  private updateViewportTransform() {
    this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  // -------------------------------------------------------------------------
  // Selection rendering
  // -------------------------------------------------------------------------
  private updateSelectionOutline() {
    if (this.selectionBox) this.selectionBox.remove();
    if (this.selected.size === 0) return;

    // Bounding rect
    const rects = [...this.selected]
      .map(id => this.board.find(id))
      .filter((i): i is WhiteboardItem => Boolean(i));
    const minX = Math.min(...rects.map(r => r.x));
    const minY = Math.min(...rects.map(r => r.y));
    const maxX = Math.max(...rects.map(r => r.x + r.width));
    const maxY = Math.max(...rects.map(r => r.y + r.height));
    const box = document.createElement("div");
    this.selectionBox = box;
    Object.assign(box.style, {
      position: "absolute",
      left: `${minX}px`,
      top: `${minY}px`,
      width: `${maxX - minX}px`,
      height: `${maxY - minY}px`,
      border: "1px dashed #3b82f6",
      pointerEvents: "none",
      transform: `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`,
      transformOrigin: "0 0",
    });
    this.canvas.appendChild(box);
  }

  // -------------------------------------------------------------------------
  // Snapshot
  // -------------------------------------------------------------------------
  async exportPNG(): Promise<Blob> {
    // Render the whiteboard container as SVG with a foreignObject, then draw to canvas
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    // Serialize the DOM content of the canvas
    const serialized = new XMLSerializer().serializeToString(this.canvas);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject x="0" y="0" width="100%" height="100%">
    ${serialized}
  </foreignObject>
</svg>`;
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.width = width;
    img.height = height;
    return new Promise(resolve => {
      img.onload = () => {
        const canvasEl = document.createElement('canvas');
        canvasEl.width = width;
        canvasEl.height = height;
        const ctx = canvasEl.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        canvasEl.toBlob(blob => {
          resolve(blob!);
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.src = url;
    });
  }
}

// ---------------- styles (optional) ----------------
/**
.wb-container::-webkit-scrollbar { display: none; }
.wb-item.selected { outline: 2px solidrgb(6, 6, 6); }
*/
