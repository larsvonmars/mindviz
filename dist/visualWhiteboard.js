"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualWhiteboard = void 0;
const ToolbarWhiteboard_1 = require("./ToolbarWhiteboard");
class VisualWhiteboard {
    constructor(container, board, opts = {}) {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        // selection
        this.selected = new Set();
        this.selectionBox = null;
        this.elementMap = new Map();
        // merge opts
        this.options = {
            gridSize: 10,
            snap: true,
            background: "var(--wb-bg, #fdfdfd)",
            ...opts,
        };
        this.container = container;
        this.board = board;
        // Set default size, border, and resizability to match mindmap canvas
        if (!this.container.style.width)
            this.container.style.width = "100%";
        if (!this.container.style.height)
            this.container.style.height = "800px";
        this.container.classList.add("wb-container");
        Object.assign(this.container.style, {
            border: "1px solid var(--mm-border-color, rgb(214, 214, 214))",
            borderRadius: "12px",
            resize: "both",
            overflow: "hidden",
            cursor: "grab",
            position: "relative",
            userSelect: "none",
            touchAction: "none",
            background: this.options.background,
        });
        // Integrate toolbar
        const toolbar = (0, ToolbarWhiteboard_1.createWhiteboardToolbar)(this);
        this.container.appendChild(toolbar);
        // Create canvas
        this.canvas = document.createElement("div");
        this.canvas.classList.add("wb-canvas");
        Object.assign(this.canvas.style, {
            position: "absolute",
            top: "50px", // leave space for toolbar
            left: "0",
            width: "100%",
            height: "calc(100% - 50px)",
            transformOrigin: "0 0",
        });
        this.container.appendChild(this.canvas);
        // Bind board events to re-render incremental changes
        board.on("item:add", (item) => this.renderItem(item));
        board.on("item:update", (item) => this.updateItemElement(item));
        board.on("item:delete", (item) => this.removeItemElement(item.id));
        board.on("board:load", () => this.fullRender());
        // Global event listeners
        this.bindInteractions();
        // initial render
        this.fullRender();
    }
    // -------------------------------------------------------------------------
    // Rendering helpers
    // -------------------------------------------------------------------------
    fullRender() {
        this.canvas.innerHTML = "";
        this.board.items.sort((a, b) => (a.z ?? 0) - (b.z ?? 0)).forEach(i => this.renderItem(i));
        this.drawGrid();
    }
    drawGrid() {
        const size = this.options.gridSize;
        const canvasStyle = this.canvas.style;
        canvasStyle.backgroundImage = `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`;
        canvasStyle.backgroundSize = `${size}px ${size}px`;
    }
    renderItem(item) {
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
    updateItemElement(item) {
        const el = this.elementMap.get(item.id);
        if (el)
            this.applyItemStyles(item, el);
    }
    removeItemElement(id) {
        const el = this.elementMap.get(id);
        if (el && el.parentElement)
            el.parentElement.removeChild(el);
        this.elementMap.delete(id);
    }
    applyItemStyles(item, el) {
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
    bindInteractions() {
        // Pan background – middle mouse / space drag
        let isPanning = false;
        let lastX = 0, lastY = 0;
        const onPointerDown = (e) => {
            if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
                isPanning = true;
                lastX = e.clientX;
                lastY = e.clientY;
                e.target.setPointerCapture(e.pointerId);
            }
        };
        const onPointerMove = (e) => {
            if (!isPanning)
                return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            this.panX += dx;
            this.panY += dy;
            this.updateViewportTransform();
        };
        const onPointerUp = (e) => {
            if (isPanning) {
                isPanning = false;
                e.target.releasePointerCapture(e.pointerId);
            }
        };
        this.container.addEventListener("pointerdown", onPointerDown);
        this.container.addEventListener("pointermove", onPointerMove);
        this.container.addEventListener("pointerup", onPointerUp);
        // Zoom with wheel + ctrl
        this.container.addEventListener("wheel", e => {
            if (!e.ctrlKey)
                return;
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
    makeInteractive(el, id) {
        let dragging = false;
        let startX = 0, startY = 0;
        let itemStartX = 0, itemStartY = 0;
        // Select on click
        el.addEventListener("pointerdown", e => {
            if (e.button !== 0)
                return;
            const item = this.board.find(id);
            if (!item || item.locked)
                return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            itemStartX = item.x;
            itemStartY = item.y;
            e.target.setPointerCapture(e.pointerId);
            // Selection logic
            if (!e.shiftKey)
                this.selected.clear();
            this.selected.add(id);
            this.updateSelectionOutline();
        });
        el.addEventListener("pointermove", e => {
            if (!dragging)
                return;
            const item = this.board.find(id);
            if (!item)
                return;
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
                e.target.releasePointerCapture(e.pointerId);
            }
        });
        // Double click to edit text
        el.addEventListener("dblclick", () => {
            const item = this.board.find(id);
            if (item?.type === "text" && typeof item.content === "string") {
                const newText = prompt("Edit text", item.content);
                if (newText !== null)
                    this.board.updateItem(id, { content: newText });
            }
        });
    }
    updateViewportTransform() {
        this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }
    // -------------------------------------------------------------------------
    // Selection rendering
    // -------------------------------------------------------------------------
    updateSelectionOutline() {
        if (this.selectionBox)
            this.selectionBox.remove();
        if (this.selected.size === 0)
            return;
        // Bounding rect
        const rects = [...this.selected]
            .map(id => this.board.find(id))
            .filter((i) => Boolean(i));
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
    async exportPNG() {
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
                const ctx = canvasEl.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvasEl.toBlob(blob => {
                    resolve(blob);
                    URL.revokeObjectURL(url);
                }, 'image/png');
            };
            img.src = url;
        });
    }
}
exports.VisualWhiteboard = VisualWhiteboard;
// ---------------- styles (optional) ----------------
/**
.wb-container::-webkit-scrollbar { display: none; }
.wb-item.selected { outline: 2px solidrgb(6, 6, 6); }
*/
