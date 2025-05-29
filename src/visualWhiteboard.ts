// ---------------- whiteboard.ts ----------------
/**
 * Expanded Whiteboard Library – May 2025 (visual refresh)
 * ------------------------------------------------------
 *  • Core data model unchanged (see previous version)
 *  • Visual layer rewritten for richer, modern UI:
 *      – Neon‑soft palette, rounded corners, drop shadows
 *      – Hover / selection effects, animated transitions
 *      – In‑place editing for *all* textual items (double‑click)
 *      – Resize handles (SE corner for now) with live preview
 *      – Global CSS injected automatically (scoped by .wb‑container)
 */

export * from "./whiteboard"; // <–– unchanged core model

// ---------------- visualWhiteboard.ts ----------------
import { Whiteboard, WhiteboardItem } from "./whiteboard";
import { createWhiteboardToolbar } from "./ToolbarWhiteboard";
import { showInputModal } from "./Modal";
import { createContextMenu } from "./ContextMenuWhiteboard";

export interface VisualOptions {
  gridSize?: number;
  snap?: boolean;
  background?: string;
  accentColor?: string; // new – theming
}

export class VisualWhiteboard {
  public readonly board: Whiteboard;
  public readonly container: HTMLElement;
  private readonly canvas: HTMLDivElement;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private options: Required<VisualOptions>;

  // selection
  private selected: Set<number> = new Set();
  private selectionBox: HTMLDivElement | null = null;

  // drawing state
  public drawType: 'arrow' | 'rect' | 'circle' | 'line' | 'pen' | null = null;
  private drawing = false;
  private startX = 0;
  private startY = 0;
  private tempEl: SVGElement | null = null;
  private penPoints: { x: number; y: number }[] = [];
  private svgOverlay: SVGSVGElement;

  // ---------------------------------------------------------------------
  // ✨  Constructor
  // ---------------------------------------------------------------------
  constructor(container: HTMLElement, board: Whiteboard, opts: VisualOptions = {}) {
    // merge opts with defaults
    this.options = {
      gridSize: 12,
      snap: true,
      background: "var(--wb-bg, #f9fafb)",
      accentColor: "var(--wb-accent, #3b82f6)",
      ...opts,
    };

    this.container = container;
    this.board = board;

    // Inject global style rules once per document
    VisualWhiteboard.injectStyles(this.options.accentColor);

    // Container styling (rounded, shadow, resize)
    if (!this.container.style.width) this.container.style.width = "100%";
    if (!this.container.style.height) this.container.style.height = "800px";
    Object.assign(this.container.style, {
      border: "1px solid var(--wb-border, #d1d5db)",
      borderRadius: "14px",
      resize: "both",
      overflow: "hidden",
      cursor: "grab",
      position: "relative",
      userSelect: "none",
      touchAction: "none",
      background: this.options.background,
      boxShadow: "0 6px 20px rgba(0,0,0,.06)",
    });
    this.container.classList.add("wb-container");

    // 🛠️  Toolbar
    const toolbar = createWhiteboardToolbar(this);
    this.container.appendChild(toolbar);

    // Main canvas for items
    this.canvas = document.createElement("div");
    this.canvas.classList.add("wb-canvas");
    Object.assign(this.canvas.style, {
      position: "absolute",
      top: "48px", // toolbar height
      left: "0",
      width: "100%",
      height: "calc(100% - 48px)",
      transformOrigin: "0 0",
    });
    this.container.appendChild(this.canvas);

    // Wire board events → DOM
    board.on("item:add", (i: WhiteboardItem) => this.renderItem(i));
    board.on("item:update", (i: WhiteboardItem) => this.updateItemElement(i));
    board.on("item:delete", (i: WhiteboardItem) => this.removeItemElement(i.id));
    board.on("board:load", () => this.fullRender());

    // Interaction layer
    this.bindInteractions();

    // First paint
    this.fullRender();

    // Context menu
    const ctxMenu = createContextMenu(this);
    this.container.appendChild(ctxMenu);
    // Setup drawing overlay
    this.svgOverlay = document.createElementNS('http://www.w3.org/2000/svg','svg');
    Object.assign(this.svgOverlay.style, { position:'absolute', top:'0', left:'0', width:'100%', height:'100%', pointerEvents:'none' });
    this.canvas.appendChild(this.svgOverlay);
    // Arrow marker definition for proper arrowheads
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    defs.innerHTML = `<marker id="wb-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${this.options.accentColor}"/></marker>`;
    this.svgOverlay.appendChild(defs);
    this.setupDrawing();
  }

  private setupDrawing() {
    // pointer down starts shape
    const ns = 'http://www.w3.org/2000/svg';
    // down: start drawing
    this.canvas.addEventListener('pointerdown', e => {
      if (!this.drawType) return;
      this.drawing = true;
      const { x: cx, y: cy } = this.toCanvasCoords(e);
      this.startX = cx; this.startY = cy;
      switch (this.drawType) {
        case 'rect':
          this.tempEl = document.createElementNS(ns, 'rect'); break;
        case 'circle':
          this.tempEl = document.createElementNS(ns, 'ellipse'); break;
        case 'line':
        case 'arrow':
          this.tempEl = document.createElementNS(ns, 'line'); break;
        case 'pen':
          this.tempEl = document.createElementNS(ns, 'path');
          this.penPoints = [{ x: cx, y: cy }];
          (this.tempEl as SVGPathElement).setAttribute('d', `M ${cx} ${cy}`);
          break;
      }
      if (!this.tempEl) return;
      this.tempEl.setAttribute('stroke', this.options.accentColor);
      this.tempEl.setAttribute('stroke-width', '2');
      this.tempEl.setAttribute('fill', 'none');
      this.tempEl.setAttribute('stroke-linecap', 'round');
      this.tempEl.setAttribute('stroke-linejoin', 'round');
      if (this.drawType === 'arrow') this.tempEl.setAttribute('marker-end', 'url(#wb-arrow)');
      this.svgOverlay.appendChild(this.tempEl);
      this.svgOverlay.style.pointerEvents = 'auto';
    });
    // move: update shape
    this.canvas.addEventListener('pointermove', e => {
      if (!this.drawing || !this.tempEl) return;
      const { x: cx, y: cy } = this.toCanvasCoords(e);
      const dx = cx - this.startX; const dy = cy - this.startY;
      switch (this.drawType) {
        case 'rect': {
          const x = dx < 0 ? cx : this.startX;
          const y = dy < 0 ? cy : this.startY;
          const w = Math.abs(dx); const h = Math.abs(dy);
          (this.tempEl as SVGRectElement).setAttribute('x', String(x));
          (this.tempEl as SVGRectElement).setAttribute('y', String(y));
          (this.tempEl as SVGRectElement).setAttribute('width', String(w));
          (this.tempEl as SVGRectElement).setAttribute('height', String(h));
          break;
        }
        case 'circle': {
          const rx = Math.abs(dx)/2; const ry = Math.abs(dy)/2;
          const cxE = this.startX + dx/2; const cyE = this.startY + dy/2;
          const ell = this.tempEl as SVGEllipseElement;
          ell.setAttribute('cx', String(cxE)); ell.setAttribute('cy', String(cyE));
          ell.setAttribute('rx', String(rx)); ell.setAttribute('ry', String(ry));
          break;
        }
        case 'line':
        case 'arrow':
          this.tempEl.setAttribute('x2', String(cx));
          this.tempEl.setAttribute('y2', String(cy));
          break;
        case 'pen': {
          const last = this.penPoints[this.penPoints.length-1];
          if (Math.hypot(cx-last.x, cy-last.y) > 2) {
            this.penPoints.push({ x: cx, y: cy });
            (this.tempEl as SVGPathElement).setAttribute('d', this.buildSmoothPath(this.penPoints));
          }
          break;
        }
      }
    });
    // up: finalize
    window.addEventListener('pointerup', e => {
      if (!this.drawing || !this.tempEl) return;
      this.drawing = false;
      const { x: ex, y: ey } = this.toCanvasCoords(e);
      const x1 = Math.min(this.startX, ex), y1 = Math.min(this.startY, ey);
      const x2 = Math.max(this.startX, ex), y2 = Math.max(this.startY, ey);
      const w = x2 - x1 || 2, h = y2 - y1 || 2;
      let d = '';
      switch (this.drawType) {
        case 'rect': d = `M0 0 H${w} V${h} H0 Z`; break;
        case 'circle': d = `M ${w/2} 0 A ${w/2} ${h/2} 0 1 0 ${w/2} ${h} A ${w/2} ${h/2} 0 1 0 ${w/2} 0`; break;
        case 'line':
        case 'arrow': {
          const dx = ex - this.startX, dy = ey - this.startY;
          d = `M0 0 L${dx} ${dy}`; break;
        }
        case 'pen': d = this.buildSmoothPath(this.relativePoints(this.penPoints)); break;
      }
      this.board.addItem({ type:'shape', x:x1, y:y1, width:w, height:h, content:d });
      this.svgOverlay.removeChild(this.tempEl);
      this.tempEl = null; this.penPoints = []; this.drawType = null;
      this.container.style.cursor = 'grab';
      this.svgOverlay.style.pointerEvents = 'none';
    });
 }

 /**
  * Begin drawing a shape on canvas
  */
 public startDraw(type: 'arrow'|'rect'|'circle'|'line') {
   this.drawType = type;
   this.container.style.cursor = 'crosshair';
 }

  // ---------------------------------------------------------------------
  // 🖼️  Rendering helpers
  // ---------------------------------------------------------------------
  private fullRender() {
    this.canvas.innerHTML = "";
    // stable order by z
    this.board.items.sort((a, b) => (a.z ?? 0) - (b.z ?? 0)).forEach(i => this.renderItem(i));
    this.drawGrid();
  }

  private drawGrid() {
    const s = this.options.gridSize;
    const style = this.canvas.style;
    style.backgroundImage = `linear-gradient(to right, rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.04) 1px, transparent 1px)`;
    style.backgroundSize = `${s}px ${s}px`;
  }

  // map id → element
  private elementMap = new Map<number, HTMLDivElement>();

  private renderItem(item: WhiteboardItem) {
    const el = document.createElement("div");
    this.elementMap.set(item.id, el);
    el.dataset.id = String(item.id);
    el.classList.add("wb-item");

    this.applyItemStyles(item, el);

    // Content
    switch (item.type) {
      case "text":
      case "sticky": {
        el.textContent = String(item.content);
        el.style.padding = "6px";
        el.style.font = "14px/1.4 Inter, sans-serif";
        if (item.type === "sticky") el.style.background = "#fff9c4";
        break;
      }
      case "image": {
        const img = document.createElement("img");
        img.src = String(item.content);
        img.draggable = false;
        Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
        el.appendChild(img);
        break;
      }
      case "graph": {
        el.textContent = "GRAPH";
        break;
      }
      case "shape": {
        // Render SVG path for shape content
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${item.width} ${item.height}`);
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", String(item.content));
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", this.options.accentColor);
        path.setAttribute("stroke-width", "2");
        svg.appendChild(path);
        el.appendChild(svg);
        break;
      }
    }

    // ↔️  Resize handle – bottom‑right corner
    const handle = document.createElement("div");
    handle.classList.add("wb-resize");
    el.appendChild(handle);
    this.bindResize(handle, item.id);

    // Append & activate
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
      borderRadius: "10px",
      border: "1px solid rgba(0,0,0,.08)",
      background: "var(--wb-item-bg, #fff)",
      boxSizing: "border-box",
      overflow: "hidden",
      cursor: item.locked ? "not-allowed" : "grab",
      boxShadow: "0 2px 6px rgba(0,0,0,.08)",
      transition: "box-shadow .15s ease",
    });
  }

  // ---------------------------------------------------------------------
  // 🎮  Interaction: pan, zoom, select, drag, resize, edit
  // ---------------------------------------------------------------------
  private bindInteractions() {
    // 🌍 Pan (middle‑mouse or space‑drag)
    let isPanning = false;
    let lastX = 0,
      lastY = 0;

    this.container.addEventListener("pointerdown", e => {
      if (e.button === 1 || (e.button === 0 && (e as any).spaceKey)) {
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    });
    this.container.addEventListener("pointermove", e => {
      if (!isPanning) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      this.panX += dx;
      this.panY += dy;
      this.updateViewportTransform();
    });
    this.container.addEventListener("pointerup", e => {
      if (isPanning) {
        isPanning = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
    });

    // 🔍 Zoom with wheel + Ctrl / Cmd
    this.container.addEventListener("wheel", e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const scale = e.deltaY < 0 ? 1.15 : 0.87;
      this.zoom = Math.max(0.25, Math.min(6, this.zoom * scale));
      this.updateViewportTransform();
    });

    // ⌨️  Shortcuts
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

    // 🖐️ Drag + select
    el.addEventListener("pointerdown", e => {
      if ((e.target as HTMLElement).classList.contains("wb-resize")) return; // handled by resize
      if (e.button !== 0) return;
      const item = this.board.find(id);
      if (!item || item.locked) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      itemStartX = item.x;
      itemStartY = item.y;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      // Selection
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

    // ✏️  In‑place edit (double‑click)
    el.addEventListener("dblclick", async () => {
      const item = this.board.find(id);
      if (!item) return;

      // For text / sticky – inline contentEditable
      if ((item.type === "text" || item.type === "sticky") && typeof item.content === "string") {
        el.contentEditable = "true";
        el.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        sel?.removeAllRanges();
        sel?.addRange(range);

        const endEdit = () => {
          el.contentEditable = "false";
          this.board.updateItem(id, { content: el.textContent });
          el.removeEventListener("blur", endEdit);
        };
        el.addEventListener("blur", endEdit);
      }
      // For image – prompt URL change via modal
      else if (item.type === "image") {
        const url = await showInputModal("Change image", "Image URL", String(item.content));
        if (url !== null) this.board.updateItem(id, { content: url });
      }
    });
  }

  // ---------------------------------------------------------------------
  // 🔧 Resize handle logic (bottom‑right)
  // ---------------------------------------------------------------------
  private bindResize(handle: HTMLDivElement, id: number) {
    let resizing = false;
    let startW = 0,
      startH = 0,
      startX = 0,
      startY = 0;
    handle.addEventListener("pointerdown", e => {
      e.stopPropagation();
      resizing = true;
      const item = this.board.find(id);
      if (!item) return;
      startW = item.width;
      startH = item.height;
      startX = e.clientX;
      startY = e.clientY;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", e => {
      if (!resizing) return;
      const item = this.board.find(id);
      if (!item) return;
      const dw = (e.clientX - startX) / this.zoom;
      const dh = (e.clientY - startY) / this.zoom;
      const nw = Math.max(40, startW + dw);
      const nh = Math.max(40, startH + dh);
      this.board.updateItem(id, { width: nw, height: nh });
    });
    handle.addEventListener("pointerup", () => {
      if (resizing) resizing = false;
    });
  }

  private updateViewportTransform() {
    const t = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    this.canvas.style.transform = t;
    this.svgOverlay.style.transform = t;
     // update selection overlay transform as well
     if (this.selectionBox) {
      this.selectionBox.style.transform = t;
     }
     // adjust resize handles to remain constant size regardless of zoom
     this.canvas.querySelectorAll('.wb-resize').forEach(h => {
       (h as HTMLElement).style.transform = `scale(${1/this.zoom})`;
     });
   }

  // Convert event coords to canvas coordinates accounting for pan & zoom
  private toCanvasCoords(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left - this.panX)/this.zoom, y: (e.clientY - rect.top - this.panY)/this.zoom };
  }

  // Shift points to origin for smoothing
  private relativePoints(pts: { x: number; y: number }[]) {
    const minX = Math.min(...pts.map(p=>p.x));
    const minY = Math.min(...pts.map(p=>p.y));
    return pts.map(p=>({ x: p.x-minX, y: p.y-minY }));
  }

  // Build smooth Cardinal spline path
  private buildSmoothPath(pts: { x: number; y: number }[]) {
    if (pts.length < 3) return `M ${pts[0].x} ${pts[0].y}`;
    const tension = 0.5;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i=0;i<pts.length-1;i++) {
      const p0 = pts[i===0?i:i-1], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
      const cp1x = p1.x + ((p2.x-p0.x)/6)*tension;
      const cp1y = p1.y + ((p2.y-p0.y)/6)*tension;
      const cp2x = p2.x - ((p3.x-p1.x)/6)*tension;
      const cp2y = p2.y - ((p3.y-p1.y)/6)*tension;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
    }
    return d;
  }

  // ---------------------------------------------------------------------
  // 🔲  Selection outline
  // ---------------------------------------------------------------------
  private updateSelectionOutline() {
    this.selectionBox?.remove();
    if (this.selected.size === 0) return;

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
      border: `2px dashed ${this.options.accentColor}`,
      pointerEvents: "none",
      transform: `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`,
      transformOrigin: "0 0",
      borderRadius: "8px",
    });
    this.canvas.appendChild(box);
  }

  // ---------------------------------------------------------------------
  // 📸 Snapshot → PNG (unchanged)
  // ---------------------------------------------------------------------
  async exportPNG(): Promise<Blob> {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const serialized = new XMLSerializer().serializeToString(this.canvas);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.width = width;
    img.height = height;
    return new Promise(resolve => {
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        c.toBlob(b => {
          resolve(b!);
          URL.revokeObjectURL(url);
        }, "image/png");
      };
      img.src = url;
    });
  }

  // ---------------------------------------------------------------------
  // 📜 StyleSheet injection (static)
  // ---------------------------------------------------------------------
  private static styleInjected = false;
  private static injectStyles(accent: string) {
    if (VisualWhiteboard.styleInjected) return;
    const style = document.createElement("style");
    style.textContent = `
      .wb-item:hover { box-shadow:0 4px 14px rgba(0,0,0,.12); }
      .wb-item.selected { outline:3px solid ${accent}; }
      .wb-resize { position:absolute; right:-8px; bottom:-8px; width:16px; height:16px; background:${accent}; border-radius:50%; cursor:nwse-resize; transform-origin: bottom right; }
      .wb-toolbar-btn { display:inline-flex; align-items:center; gap:4px; padding:4px 8px; font-size:14px; border-radius:6px; background:#fff; border:1px solid #e5e7eb; transition:background .2s; }
      .wb-toolbar-btn:hover { background:#f3f4f6; }
    `;
    document.head.appendChild(style);
    VisualWhiteboard.styleInjected = true;
  }

  /**
   * Delete an item by id
   */
  public deleteItem(id: number): void {
    this.board.deleteItem(id);
    this.selected.delete(id);
    this.updateSelectionOutline();
  }
}

// ---------------- styles (global helpers) ----------------
/**
 * Tailwind / utility frameworks are optional – this file ships zero‑dep CSS.
 */
