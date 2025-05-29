"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualWhiteboard = void 0;
__exportStar(require("./whiteboard"), exports); // <–– unchanged core model
const ToolbarWhiteboard_1 = require("./ToolbarWhiteboard");
const Modal_1 = require("./Modal");
const ContextMenuWhiteboard_1 = require("./ContextMenuWhiteboard");
class VisualWhiteboard {
    // ---------------------------------------------------------------------
    // ✨  Constructor
    // ---------------------------------------------------------------------
    constructor(container, board, opts = {}) {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        // selection
        this.selected = new Set();
        this.selectionBox = null;
        // drawing state
        this.drawType = null;
        this.drawing = false;
        this.startX = 0;
        this.startY = 0;
        this.tempEl = null;
        // map id → element
        this.elementMap = new Map();
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
        if (!this.container.style.width)
            this.container.style.width = "100%";
        if (!this.container.style.height)
            this.container.style.height = "800px";
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
        const toolbar = (0, ToolbarWhiteboard_1.createWhiteboardToolbar)(this);
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
        board.on("item:add", (i) => this.renderItem(i));
        board.on("item:update", (i) => this.updateItemElement(i));
        board.on("item:delete", (i) => this.removeItemElement(i.id));
        board.on("board:load", () => this.fullRender());
        // Interaction layer
        this.bindInteractions();
        // First paint
        this.fullRender();
        // Context menu
        const ctxMenu = (0, ContextMenuWhiteboard_1.createContextMenu)(this);
        this.container.appendChild(ctxMenu);
        // Setup drawing overlay
        this.svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        Object.assign(this.svgOverlay.style, { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none' });
        this.canvas.appendChild(this.svgOverlay);
        this.setupDrawing();
    }
    setupDrawing() {
        // pointer down starts shape
        this.canvas.addEventListener('pointerdown', e => {
            if (!this.drawType)
                return;
            this.drawing = true;
            const rect = this.canvas.getBoundingClientRect();
            this.startX = (e.clientX - rect.left - this.panX) / this.zoom;
            this.startY = (e.clientY - rect.top - this.panY) / this.zoom;
            // create element
            const ns = 'http://www.w3.org/2000/svg';
            let el;
            switch (this.drawType) {
                case 'rect':
                    el = document.createElementNS(ns, 'rect');
                    el.setAttribute('x', '0');
                    el.setAttribute('y', '0');
                    break;
                case 'circle':
                    el = document.createElementNS(ns, 'ellipse');
                    el.setAttribute('cx', '0');
                    el.setAttribute('cy', '0');
                    break;
                case 'line':
                    el = document.createElementNS(ns, 'line');
                    el.setAttribute('x1', '0');
                    el.setAttribute('y1', '0');
                    break;
                case 'arrow':
                    el = document.createElementNS(ns, 'path');
                    break;
                default:
                    return;
            }
            el.setAttribute('stroke', this.options.accentColor);
            el.setAttribute('fill', this.drawType === 'rect' ? 'none' : 'none');
            el.setAttribute('stroke-width', '2');
            this.svgOverlay.appendChild(el);
            this.tempEl = el;
            this.svgOverlay.style.pointerEvents = 'auto';
        });
        this.canvas.addEventListener('pointermove', e => {
            if (!this.drawing || !this.tempEl)
                return;
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.panX) / this.zoom;
            const y = (e.clientY - rect.top - this.panY) / this.zoom;
            const dx = x - this.startX;
            const dy = y - this.startY;
            switch (this.drawType) {
                case 'rect':
                    this.tempEl.setAttribute('width', String(dx));
                    this.tempEl.setAttribute('height', String(dy));
                    break;
                case 'circle':
                    this.tempEl.setAttribute('cx', String(Math.abs(dx / 2)));
                    this.tempEl.setAttribute('cy', String(Math.abs(dy / 2)));
                    this.tempEl.setAttribute('rx', String(Math.abs(dx / 2)));
                    this.tempEl.setAttribute('ry', String(Math.abs(dy / 2)));
                    break;
                case 'line':
                    this.tempEl.setAttribute('x2', String(dx));
                    this.tempEl.setAttribute('y2', String(dy));
                    break;
                case 'arrow':
                    const path = `M0,0 L${dx},${dy}`;
                    this.tempEl.setAttribute('d', path);
                    break;
            }
        });
        window.addEventListener('pointerup', e => {
            if (!this.drawing || !this.tempEl || !this.drawType)
                return;
            const rectC = this.canvas.getBoundingClientRect();
            const endX = (e.clientX - rectC.left - this.panX) / this.zoom;
            const endY = (e.clientY - rectC.top - this.panY) / this.zoom;
            const w = Math.abs(endX - this.startX);
            const h = Math.abs(endY - this.startY);
            let content;
            switch (this.drawType) {
                case 'rect':
                    content = `M0,0 H${w} V${h} H0 Z`;
                    break;
                case 'circle':
                    content = `M${w / 2},0 A${w / 2},${h / 2} 0 1,0 ${w / 2},${h} A${w / 2},${h / 2} 0 1,0 ${w / 2},0`;
                    break;
                case 'line':
                    content = `M0,0 L${w * (endX >= this.startX ? 1 : -1)},${h * (endY >= this.startY ? 1 : -1)}`;
                    break;
                case 'arrow':
                    content = this.tempEl.getAttribute('d') || '';
                    break;
            }
            const x = this.startX + this.panX / this.zoom;
            const y = this.startY + this.panY / this.zoom;
            this.board.addItem({ type: 'shape', x: this.startX, y: this.startY, width: w, height: h, content });
            // cleanup
            this.svgOverlay.removeChild(this.tempEl);
            this.tempEl = null;
            this.drawing = false;
            this.drawType = null;
            this.svgOverlay.style.pointerEvents = 'none';
        });
    }
    /**
     * Begin drawing a shape on canvas
     */
    startDraw(type) {
        this.drawType = type;
        this.container.style.cursor = 'crosshair';
    }
    // ---------------------------------------------------------------------
    // 🖼️  Rendering helpers
    // ---------------------------------------------------------------------
    fullRender() {
        this.canvas.innerHTML = "";
        // stable order by z
        this.board.items.sort((a, b) => (a.z ?? 0) - (b.z ?? 0)).forEach(i => this.renderItem(i));
        this.drawGrid();
    }
    drawGrid() {
        const s = this.options.gridSize;
        const style = this.canvas.style;
        style.backgroundImage = `linear-gradient(to right, rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.04) 1px, transparent 1px)`;
        style.backgroundSize = `${s}px ${s}px`;
    }
    renderItem(item) {
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
                if (item.type === "sticky")
                    el.style.background = "#fff9c4";
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
    bindInteractions() {
        // 🌍 Pan (middle‑mouse or space‑drag)
        let isPanning = false;
        let lastX = 0, lastY = 0;
        this.container.addEventListener("pointerdown", e => {
            if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
                isPanning = true;
                lastX = e.clientX;
                lastY = e.clientY;
                e.target.setPointerCapture(e.pointerId);
            }
        });
        this.container.addEventListener("pointermove", e => {
            if (!isPanning)
                return;
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
                e.target.releasePointerCapture(e.pointerId);
            }
        });
        // 🔍 Zoom with wheel + Ctrl / Cmd
        this.container.addEventListener("wheel", e => {
            if (!e.ctrlKey)
                return;
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
    makeInteractive(el, id) {
        let dragging = false;
        let startX = 0, startY = 0;
        let itemStartX = 0, itemStartY = 0;
        // 🖐️ Drag + select
        el.addEventListener("pointerdown", e => {
            if (e.target.classList.contains("wb-resize"))
                return; // handled by resize
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
            // Selection
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
        // ✏️  In‑place edit (double‑click)
        el.addEventListener("dblclick", async () => {
            const item = this.board.find(id);
            if (!item)
                return;
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
                const url = await (0, Modal_1.showInputModal)("Change image", "Image URL", String(item.content));
                if (url !== null)
                    this.board.updateItem(id, { content: url });
            }
        });
    }
    // ---------------------------------------------------------------------
    // 🔧 Resize handle logic (bottom‑right)
    // ---------------------------------------------------------------------
    bindResize(handle, id) {
        let resizing = false;
        let startW = 0, startH = 0, startX = 0, startY = 0;
        handle.addEventListener("pointerdown", e => {
            e.stopPropagation();
            resizing = true;
            const item = this.board.find(id);
            if (!item)
                return;
            startW = item.width;
            startH = item.height;
            startX = e.clientX;
            startY = e.clientY;
            handle.setPointerCapture(e.pointerId);
        });
        handle.addEventListener("pointermove", e => {
            if (!resizing)
                return;
            const item = this.board.find(id);
            if (!item)
                return;
            const dw = (e.clientX - startX) / this.zoom;
            const dh = (e.clientY - startY) / this.zoom;
            const nw = Math.max(40, startW + dw);
            const nh = Math.max(40, startH + dh);
            this.board.updateItem(id, { width: nw, height: nh });
        });
        handle.addEventListener("pointerup", () => {
            if (resizing)
                resizing = false;
        });
    }
    updateViewportTransform() {
        this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        // update selection overlay transform as well
        if (this.selectionBox) {
            this.selectionBox.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        }
        // adjust resize handles to remain constant size regardless of zoom
        this.canvas.querySelectorAll('.wb-resize').forEach(h => {
            h.style.transform = `scale(${1 / this.zoom})`;
        });
    }
    // ---------------------------------------------------------------------
    // 🔲  Selection outline
    // ---------------------------------------------------------------------
    updateSelectionOutline() {
        this.selectionBox?.remove();
        if (this.selected.size === 0)
            return;
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
    async exportPNG() {
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
                const ctx = c.getContext("2d");
                ctx.drawImage(img, 0, 0);
                c.toBlob(b => {
                    resolve(b);
                    URL.revokeObjectURL(url);
                }, "image/png");
            };
            img.src = url;
        });
    }
    static injectStyles(accent) {
        if (VisualWhiteboard.styleInjected)
            return;
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
    deleteItem(id) {
        this.board.deleteItem(id);
        this.selected.delete(id);
        this.updateSelectionOutline();
    }
}
exports.VisualWhiteboard = VisualWhiteboard;
// ---------------------------------------------------------------------
// 📜 StyleSheet injection (static)
// ---------------------------------------------------------------------
VisualWhiteboard.styleInjected = false;
// ---------------- styles (global helpers) ----------------
/**
 * Tailwind / utility frameworks are optional – this file ships zero‑dep CSS.
 */
