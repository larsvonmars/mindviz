"use strict";
/**
 * Visual Whiteboard - Complete Overhaul 2025
 * ===========================================
 * A modern, fully-featured whiteboard implementation with:
 * • Smooth pan/zoom with proper coordinate transformation
 * • Multi-selection with selection rectangle
 * • Advanced drawing tools (pen, shapes, arrows)
 * • Proper event handling and state management
 * • Modern UI with animations and hover effects
 * • Undo/redo with command pattern
 * • Real-time collaboration ready
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
__exportStar(require("./whiteboard"), exports);
const ToolbarWhiteboard_1 = require("./ToolbarWhiteboard");
const Modal_1 = require("./Modal");
const ContextMenuWhiteboard_1 = require("./ContextMenuWhiteboard");
class VisualWhiteboard {
    constructor(container, board, options = {}) {
        // Viewport state
        this.viewport = { zoom: 1, panX: 0, panY: 0 };
        // Selection state
        this.selectedItems = new Set();
        this.selectionBox = null;
        this.selectionRect = null;
        // Drawing state
        this.drawingMode = 'select';
        this.currentPath = null;
        this.drawingData = [];
        this.isDrawing = false;
        this.drawStartPoint = null;
        // Interaction state
        this.isDragging = false;
        this.isPanning = false;
        this.isSelecting = false;
        this.dragStartPoint = null;
        this.draggedItems = new Map();
        // Element management
        this.itemElements = new Map();
        this.container = container;
        this.board = board;
        // Setup options with defaults
        this.options = {
            gridSize: options.gridSize ?? 20,
            snap: options.snap ?? true,
            background: options.background ?? '#fafafa',
            accentColor: options.accentColor ?? '#4f46e5',
            showGrid: options.showGrid ?? true,
            enablePanning: options.enablePanning ?? true,
            enableZooming: options.enableZooming ?? true,
        };
        this.initializeContainer();
        this.createCanvas();
        this.createSVGOverlay();
        this.toolbar = (0, ToolbarWhiteboard_1.createWhiteboardToolbar)(this);
        this.contextMenu = (0, ContextMenuWhiteboard_1.createContextMenu)(this);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.contextMenu);
        this.setupEventListeners();
        this.injectStyles();
        this.render();
        // Setup board event listeners
        this.board.on('item:add', (item) => this.handleItemAdd(item));
        this.board.on('item:update', (item) => this.handleItemUpdate(item));
        this.board.on('item:delete', (item) => this.handleItemDelete(item));
        this.board.on('board:load', () => this.render());
    }
    initializeContainer() {
        this.container.classList.add('wb-container');
        Object.assign(this.container.style, {
            position: 'relative',
            width: '100%',
            height: '600px',
            backgroundColor: this.options.background,
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            userSelect: 'none',
            touchAction: 'none',
        });
    }
    createCanvas() {
        this.canvas = document.createElement('div');
        this.canvas.classList.add('wb-canvas');
        Object.assign(this.canvas.style, {
            position: 'absolute',
            top: '60px', // toolbar height
            left: '0',
            right: '0',
            bottom: '0',
            transformOrigin: '0 0',
            cursor: 'grab',
        });
        if (this.options.showGrid) {
            this.drawGrid();
        }
    }
    createSVGOverlay() {
        this.svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        Object.assign(this.svgOverlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '1000',
        });
        // Add arrow marker definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
      <marker id="wb-arrow" viewBox="0 0 10 10" refX="10" refY="5" 
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="${this.options.accentColor}"/>
      </marker>
    `;
        this.svgOverlay.appendChild(defs);
        this.canvas.appendChild(this.svgOverlay);
    }
    drawGrid() {
        const size = this.options.gridSize;
        this.canvas.style.backgroundImage = `
      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
    `;
        this.canvas.style.backgroundSize = `${size}px ${size}px`;
    }
    setupEventListeners() {
        // Prevent context menu
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
        // Mouse events
        this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
        this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
        // Zoom with wheel
        if (this.options.enableZooming) {
            this.container.addEventListener('wheel', this.handleWheel.bind(this));
        }
        // Keyboard shortcuts
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        // Resize observer
        const resizeObserver = new ResizeObserver(() => this.updateViewport());
        resizeObserver.observe(this.container);
    }
    handlePointerDown(e) {
        e.preventDefault();
        const point = this.screenToCanvas(e.clientX, e.clientY);
        // Check if clicking on an item
        const target = e.target;
        const itemElement = target.closest('.wb-item');
        if (this.drawingMode !== 'select') {
            this.startDrawing(point);
            return;
        }
        if (itemElement) {
            this.handleItemPointerDown(e, itemElement, point);
        }
        else {
            this.handleCanvasPointerDown(e, point);
        }
        this.canvas.setPointerCapture(e.pointerId);
    }
    handlePointerMove(e) {
        const point = this.screenToCanvas(e.clientX, e.clientY);
        if (this.isDrawing && this.drawingMode !== 'select') {
            this.updateDrawing(point);
        }
        else if (this.isDragging) {
            this.updateDrag(point);
        }
        else if (this.isPanning) {
            this.updatePan(e.clientX, e.clientY);
        }
        else if (this.isSelecting) {
            this.updateSelection(point);
        }
    }
    handlePointerUp(e) {
        if (this.isDrawing && this.drawingMode !== 'select') {
            this.finishDrawing();
        }
        else if (this.isDragging) {
            this.finishDrag();
        }
        else if (this.isPanning) {
            this.finishPan();
        }
        else if (this.isSelecting) {
            this.finishSelection();
        }
        this.canvas.releasePointerCapture(e.pointerId);
    }
    handleItemPointerDown(e, itemElement, point) {
        const itemId = parseInt(itemElement.dataset.id);
        if (!this.selectedItems.has(itemId) && !e.shiftKey) {
            this.clearSelection();
        }
        this.selectedItems.add(itemId);
        this.updateSelectionDisplay();
        // Start dragging
        this.isDragging = true;
        this.dragStartPoint = point;
        // Store initial positions of all selected items
        this.draggedItems.clear();
        for (const id of this.selectedItems) {
            const item = this.board.find(id);
            if (item) {
                this.draggedItems.set(id, { x: item.x, y: item.y });
            }
        }
        this.canvas.style.cursor = 'grabbing';
    }
    handleCanvasPointerDown(e, point) {
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            // Middle mouse or Ctrl+click for panning
            this.isPanning = true;
            this.dragStartPoint = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        }
        else {
            // Start selection rectangle
            if (!e.shiftKey) {
                this.clearSelection();
            }
            this.isSelecting = true;
            this.dragStartPoint = point;
            this.createSelectionRect(point);
        }
    }
    startDrawing(point) {
        this.isDrawing = true;
        this.drawStartPoint = point;
        this.drawingData = [point];
        // Create temporary drawing element
        const svg = this.svgOverlay;
        switch (this.drawingMode) {
            case 'pen':
                this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                this.currentPath.setAttribute('d', `M ${point.x} ${point.y}`);
                this.currentPath.setAttribute('stroke', this.options.accentColor);
                this.currentPath.setAttribute('stroke-width', '2');
                this.currentPath.setAttribute('fill', 'none');
                this.currentPath.setAttribute('stroke-linecap', 'round');
                svg.appendChild(this.currentPath);
                break;
            case 'rect':
                this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                this.currentPath.setAttribute('stroke', this.options.accentColor);
                this.currentPath.setAttribute('stroke-width', '2');
                this.currentPath.setAttribute('fill', 'none');
                svg.appendChild(this.currentPath);
                break;
            case 'circle':
                this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                this.currentPath.setAttribute('stroke', this.options.accentColor);
                this.currentPath.setAttribute('stroke-width', '2');
                this.currentPath.setAttribute('fill', 'none');
                svg.appendChild(this.currentPath);
                break;
            case 'line':
            case 'arrow':
                this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                this.currentPath.setAttribute('stroke', this.options.accentColor);
                this.currentPath.setAttribute('stroke-width', '2');
                this.currentPath.setAttribute('x1', point.x.toString());
                this.currentPath.setAttribute('y1', point.y.toString());
                this.currentPath.setAttribute('x2', point.x.toString());
                this.currentPath.setAttribute('y2', point.y.toString());
                if (this.drawingMode === 'arrow') {
                    this.currentPath.setAttribute('marker-end', 'url(#wb-arrow)');
                }
                svg.appendChild(this.currentPath);
                break;
        }
        this.svgOverlay.style.pointerEvents = 'auto';
    }
    updateDrawing(point) {
        if (!this.currentPath || !this.drawStartPoint)
            return;
        switch (this.drawingMode) {
            case 'pen':
                this.drawingData.push(point);
                const path = this.buildSmoothPath(this.drawingData);
                this.currentPath.setAttribute('d', path);
                break;
            case 'rect':
                const rect = this.currentPath;
                const x = Math.min(this.drawStartPoint.x, point.x);
                const y = Math.min(this.drawStartPoint.y, point.y);
                const width = Math.abs(point.x - this.drawStartPoint.x);
                const height = Math.abs(point.y - this.drawStartPoint.y);
                rect.setAttribute('x', x.toString());
                rect.setAttribute('y', y.toString());
                rect.setAttribute('width', width.toString());
                rect.setAttribute('height', height.toString());
                break;
            case 'circle':
                const ellipse = this.currentPath;
                const cx = (this.drawStartPoint.x + point.x) / 2;
                const cy = (this.drawStartPoint.y + point.y) / 2;
                const rx = Math.abs(point.x - this.drawStartPoint.x) / 2;
                const ry = Math.abs(point.y - this.drawStartPoint.y) / 2;
                ellipse.setAttribute('cx', cx.toString());
                ellipse.setAttribute('cy', cy.toString());
                ellipse.setAttribute('rx', rx.toString());
                ellipse.setAttribute('ry', ry.toString());
                break;
            case 'line':
            case 'arrow':
                const line = this.currentPath;
                line.setAttribute('x2', point.x.toString());
                line.setAttribute('y2', point.y.toString());
                break;
        }
    }
    finishDrawing() {
        if (!this.currentPath || !this.drawStartPoint)
            return;
        // Convert SVG to path data and create whiteboard item
        let pathData = '';
        const bounds = this.calculateBounds();
        switch (this.drawingMode) {
            case 'pen':
                pathData = this.buildSmoothPath(this.relativePoints(this.drawingData, bounds));
                break;
            case 'rect':
                const w = bounds.width;
                const h = bounds.height;
                pathData = `M0 0 H${w} V${h} H0 Z`;
                break;
            case 'circle':
                const rx = bounds.width / 2;
                const ry = bounds.height / 2;
                pathData = `M ${rx} 0 A ${rx} ${ry} 0 1 0 ${rx} ${bounds.height} A ${rx} ${ry} 0 1 0 ${rx} 0`;
                break;
            case 'line':
            case 'arrow':
                pathData = `M0 0 L${bounds.width} ${bounds.height}`;
                break;
        }
        // Add item to whiteboard
        this.board.addItem({
            type: 'shape',
            x: bounds.x,
            y: bounds.y,
            width: Math.max(bounds.width, 10),
            height: Math.max(bounds.height, 10),
            content: pathData,
        });
        // Cleanup
        this.svgOverlay.removeChild(this.currentPath);
        this.currentPath = null;
        this.drawingData = [];
        this.isDrawing = false;
        this.drawStartPoint = null;
        this.svgOverlay.style.pointerEvents = 'none';
        // Return to select mode
        this.setDrawingMode('select');
    }
    calculateBounds() {
        if (this.drawingMode === 'pen') {
            const xs = this.drawingData.map(p => p.x);
            const ys = this.drawingData.map(p => p.y);
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
        else if (this.drawStartPoint) {
            const currentPoint = this.drawingData[this.drawingData.length - 1] || this.drawStartPoint;
            const minX = Math.min(this.drawStartPoint.x, currentPoint.x);
            const minY = Math.min(this.drawStartPoint.y, currentPoint.y);
            const maxX = Math.max(this.drawStartPoint.x, currentPoint.x);
            const maxY = Math.max(this.drawStartPoint.y, currentPoint.y);
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
        return { x: 0, y: 0, width: 100, height: 100 };
    }
    relativePoints(points, bounds) {
        return points.map(p => ({ x: p.x - bounds.x, y: p.y - bounds.y }));
    }
    buildSmoothPath(points) {
        if (points.length < 2)
            return '';
        if (points.length === 2)
            return `M${points[0].x} ${points[0].y} L${points[1].x} ${points[1].y}`;
        let path = `M${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            path += ` Q${points[i].x} ${points[i].y} ${xc} ${yc}`;
        }
        path += ` T${points[points.length - 1].x} ${points[points.length - 1].y}`;
        return path;
    }
    updateDrag(point) {
        if (!this.dragStartPoint)
            return;
        const dx = point.x - this.dragStartPoint.x;
        const dy = point.y - this.dragStartPoint.y;
        for (const [id, initialPos] of this.draggedItems) {
            const newX = initialPos.x + dx;
            const newY = initialPos.y + dy;
            // Apply snapping if enabled
            const finalX = this.options.snap
                ? Math.round(newX / this.options.gridSize) * this.options.gridSize
                : newX;
            const finalY = this.options.snap
                ? Math.round(newY / this.options.gridSize) * this.options.gridSize
                : newY;
            this.board.updateItem(id, { x: finalX, y: finalY });
        }
    }
    finishDrag() {
        this.isDragging = false;
        this.dragStartPoint = null;
        this.draggedItems.clear();
        this.canvas.style.cursor = 'grab';
    }
    updatePan(clientX, clientY) {
        if (!this.dragStartPoint)
            return;
        const dx = clientX - this.dragStartPoint.x;
        const dy = clientY - this.dragStartPoint.y;
        this.viewport.panX += dx;
        this.viewport.panY += dy;
        this.dragStartPoint = { x: clientX, y: clientY };
        this.updateViewport();
    }
    finishPan() {
        this.isPanning = false;
        this.dragStartPoint = null;
        this.canvas.style.cursor = 'grab';
    }
    createSelectionRect(startPoint) {
        this.selectionRect = document.createElement('div');
        Object.assign(this.selectionRect.style, {
            position: 'absolute',
            border: `2px dashed ${this.options.accentColor}`,
            backgroundColor: `${this.options.accentColor}20`,
            pointerEvents: 'none',
            zIndex: '999',
            left: `${startPoint.x}px`,
            top: `${startPoint.y}px`,
            width: '0px',
            height: '0px',
        });
        this.canvas.appendChild(this.selectionRect);
    }
    updateSelection(point) {
        if (!this.selectionRect || !this.dragStartPoint)
            return;
        const x = Math.min(this.dragStartPoint.x, point.x);
        const y = Math.min(this.dragStartPoint.y, point.y);
        const width = Math.abs(point.x - this.dragStartPoint.x);
        const height = Math.abs(point.y - this.dragStartPoint.y);
        Object.assign(this.selectionRect.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
        });
        // Update selected items
        this.selectedItems.clear();
        for (const item of this.board.items) {
            if (this.isItemInRect(item, { x, y, width, height })) {
                this.selectedItems.add(item.id);
            }
        }
        this.updateSelectionDisplay();
    }
    finishSelection() {
        this.isSelecting = false;
        this.dragStartPoint = null;
        if (this.selectionRect) {
            this.selectionRect.remove();
            this.selectionRect = null;
        }
    }
    isItemInRect(item, rect) {
        return item.x < rect.x + rect.width &&
            item.x + item.width > rect.x &&
            item.y < rect.y + rect.height &&
            item.y + item.height > rect.y;
    }
    handleWheel(e) {
        if (!e.ctrlKey && !e.metaKey)
            return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.1, Math.min(5, this.viewport.zoom * scaleFactor));
        // Zoom towards mouse position
        const zoomRatio = newZoom / this.viewport.zoom;
        this.viewport.panX = mouseX - (mouseX - this.viewport.panX) * zoomRatio;
        this.viewport.panY = mouseY - (mouseY - this.viewport.panY) * zoomRatio;
        this.viewport.zoom = newZoom;
        this.updateViewport();
    }
    handleKeyDown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                this.board.redo();
            }
            else {
                this.board.undo();
            }
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.deleteSelectedItems();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            this.clearSelection();
            this.setDrawingMode('select');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.selectAll();
        }
    }
    screenToCanvas(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (screenX - rect.left - this.viewport.panX) / this.viewport.zoom;
        const y = (screenY - rect.top - this.viewport.panY) / this.viewport.zoom;
        return { x, y };
    }
    updateViewport() {
        const transform = `translate(${this.viewport.panX}px, ${this.viewport.panY}px) scale(${this.viewport.zoom})`;
        this.canvas.style.transform = transform;
        // Update resize handles to maintain constant size
        this.canvas.querySelectorAll('.wb-resize').forEach(handle => {
            handle.style.transform = `scale(${1 / this.viewport.zoom})`;
        });
    }
    clearSelection() {
        this.selectedItems.clear();
        this.updateSelectionDisplay();
    }
    selectAll() {
        this.selectedItems.clear();
        for (const item of this.board.items) {
            this.selectedItems.add(item.id);
        }
        this.updateSelectionDisplay();
    }
    deleteSelectedItems() {
        for (const id of this.selectedItems) {
            this.board.deleteItem(id);
        }
        this.clearSelection();
    }
    updateSelectionDisplay() {
        // Remove old selection box
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        // Update item visual states
        for (const [id, element] of this.itemElements) {
            if (this.selectedItems.has(id)) {
                element.classList.add('wb-selected');
            }
            else {
                element.classList.remove('wb-selected');
            }
        }
        // Create selection box for multiple items
        if (this.selectedItems.size > 1) {
            const items = Array.from(this.selectedItems)
                .map(id => this.board.find(id))
                .filter(Boolean);
            if (items.length > 0) {
                const bounds = this.calculateSelectionBounds(items);
                this.createSelectionBox(bounds);
            }
        }
    }
    calculateSelectionBounds(items) {
        const xs = items.map(item => item.x);
        const ys = items.map(item => item.y);
        const x2s = items.map(item => item.x + item.width);
        const y2s = items.map(item => item.y + item.height);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...x2s);
        const maxY = Math.max(...y2s);
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }
    createSelectionBox(bounds) {
        this.selectionBox = document.createElement('div');
        Object.assign(this.selectionBox.style, {
            position: 'absolute',
            left: `${bounds.x}px`,
            top: `${bounds.y}px`,
            width: `${bounds.width}px`,
            height: `${bounds.height}px`,
            border: `2px dashed ${this.options.accentColor}`,
            pointerEvents: 'none',
            borderRadius: '4px',
            zIndex: '998',
        });
        this.canvas.appendChild(this.selectionBox);
    }
    // Item management
    handleItemAdd(item) {
        this.createItemElement(item);
    }
    handleItemUpdate(item) {
        const element = this.itemElements.get(item.id);
        if (element) {
            this.updateItemElement(element, item);
        }
    }
    handleItemDelete(item) {
        const element = this.itemElements.get(item.id);
        if (element) {
            element.remove();
            this.itemElements.delete(item.id);
        }
        this.selectedItems.delete(item.id);
        this.updateSelectionDisplay();
    }
    createItemElement(item) {
        const element = document.createElement('div');
        element.classList.add('wb-item');
        element.dataset.id = item.id.toString();
        this.updateItemElement(element, item);
        this.setupItemInteractions(element, item);
        this.canvas.appendChild(element);
        this.itemElements.set(item.id, element);
    }
    updateItemElement(element, item) {
        // Apply base styles
        Object.assign(element.style, {
            position: 'absolute',
            left: `${item.x}px`,
            top: `${item.y}px`,
            width: `${item.width}px`,
            height: `${item.height}px`,
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            cursor: 'grab',
            transition: 'box-shadow 0.2s ease',
            zIndex: (item.z || 0).toString(),
            opacity: (item.opacity || 1).toString(),
            transform: `rotate(${item.rotation || 0}deg)`,
        });
        // Clear content
        element.innerHTML = '';
        // Render content based on type
        switch (item.type) {
            case 'text':
            case 'sticky':
                this.renderTextItem(element, item);
                break;
            case 'image':
                this.renderImageItem(element, item);
                break;
            case 'shape':
                this.renderShapeItem(element, item);
                break;
            default:
                element.textContent = 'Unknown item type';
        }
        // Add resize handle
        this.addResizeHandle(element, item);
    }
    renderTextItem(element, item) {
        element.textContent = String(item.content || 'Text');
        Object.assign(element.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: item.type === 'sticky' ? '#fef3c7' : '#ffffff',
        });
    }
    renderImageItem(element, item) {
        const img = document.createElement('img');
        img.src = String(item.content);
        img.draggable = false;
        Object.assign(img.style, {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '6px',
        });
        img.onerror = () => {
            element.textContent = 'Image failed to load';
            element.style.display = 'flex';
            element.style.alignItems = 'center';
            element.style.justifyContent = 'center';
        };
        element.appendChild(img);
    }
    renderShapeItem(element, item) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${item.width} ${item.height}`);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', String(item.content));
        path.setAttribute('stroke', this.options.accentColor);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(path);
        element.appendChild(svg);
        element.style.backgroundColor = 'transparent';
        element.style.border = 'none';
    }
    addResizeHandle(element, item) {
        const handle = document.createElement('div');
        handle.classList.add('wb-resize');
        Object.assign(handle.style, {
            position: 'absolute',
            right: '-6px',
            bottom: '-6px',
            width: '12px',
            height: '12px',
            backgroundColor: this.options.accentColor,
            borderRadius: '50%',
            cursor: 'nw-resize',
            transformOrigin: 'center',
            opacity: '0',
            transition: 'opacity 0.2s ease',
        });
        // Show handle on hover
        element.addEventListener('mouseenter', () => {
            handle.style.opacity = '1';
        });
        element.addEventListener('mouseleave', () => {
            handle.style.opacity = '0';
        });
        this.setupResizeHandle(handle, item.id);
        element.appendChild(handle);
    }
    setupItemInteractions(element, item) {
        // Double-click to edit
        element.addEventListener('dblclick', async (e) => {
            e.stopPropagation();
            await this.editItem(item);
        });
        // Hover effects
        element.addEventListener('mouseenter', () => {
            element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        element.addEventListener('mouseleave', () => {
            element.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
    }
    setupResizeHandle(handle, itemId) {
        let isResizing = false;
        let startPoint = null;
        let startSize = null;
        handle.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            isResizing = true;
            startPoint = { x: e.clientX, y: e.clientY };
            const item = this.board.find(itemId);
            if (item) {
                startSize = { width: item.width, height: item.height };
            }
            handle.setPointerCapture(e.pointerId);
        });
        handle.addEventListener('pointermove', (e) => {
            if (!isResizing || !startPoint || !startSize)
                return;
            const dx = (e.clientX - startPoint.x) / this.viewport.zoom;
            const dy = (e.clientY - startPoint.y) / this.viewport.zoom;
            const newWidth = Math.max(20, startSize.width + dx);
            const newHeight = Math.max(20, startSize.height + dy);
            this.board.updateItem(itemId, {
                width: newWidth,
                height: newHeight
            });
        });
        handle.addEventListener('pointerup', (e) => {
            if (isResizing) {
                isResizing = false;
                startPoint = null;
                startSize = null;
                handle.releasePointerCapture(e.pointerId);
            }
        });
    }
    async editItem(item) {
        switch (item.type) {
            case 'text':
            case 'sticky':
                const newText = await (0, Modal_1.showInputModal)('Edit Text', 'Enter text:', String(item.content));
                if (newText !== null) {
                    this.board.updateItem(item.id, { content: newText });
                }
                break;
            case 'image':
                const newUrl = await (0, Modal_1.showInputModal)('Edit Image', 'Image URL:', String(item.content));
                if (newUrl !== null) {
                    this.board.updateItem(item.id, { content: newUrl });
                }
                break;
        }
    }
    // Public API
    setDrawingMode(mode) {
        this.drawingMode = mode;
        // Update cursor
        switch (mode) {
            case 'select':
                this.canvas.style.cursor = 'grab';
                break;
            default:
                this.canvas.style.cursor = 'crosshair';
        }
        // Update toolbar visual state if needed
        this.container.querySelectorAll('.wb-tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = this.container.querySelector(`[data-tool="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    addItem(type, x, y) {
        const centerX = x ?? (this.container.clientWidth / 2 - this.viewport.panX) / this.viewport.zoom;
        const centerY = y ?? (this.container.clientHeight / 2 - this.viewport.panY) / this.viewport.zoom;
        const item = {
            type,
            x: centerX - 50,
            y: centerY - 25,
            width: 100,
            height: 50,
            content: this.getDefaultContent(type),
        };
        this.board.addItem(item);
    }
    getDefaultContent(type) {
        switch (type) {
            case 'text': return 'New Text';
            case 'sticky': return 'Note';
            case 'image': return 'https://via.placeholder.com/100x50';
            case 'shape': return 'M0 0 L100 50';
            default: return '';
        }
    }
    render() {
        // Clear existing items
        this.canvas.querySelectorAll('.wb-item').forEach(el => el.remove());
        this.itemElements.clear();
        // Render all items
        for (const item of this.board.items) {
            this.createItemElement(item);
        }
        this.updateSelectionDisplay();
    }
    exportPNG() {
        return new Promise((resolve) => {
            // Create a temporary canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            // Set canvas size to match viewport
            const rect = this.canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            // Fill background
            ctx.fillStyle = this.options.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // For now, return a simple blob
            // In a real implementation, you'd render all items to the canvas
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    }
    resetView() {
        this.viewport = { zoom: 1, panX: 0, panY: 0 };
        this.updateViewport();
    }
    zoomToFit() {
        if (this.board.items.length === 0)
            return;
        const bounds = this.calculateSelectionBounds(this.board.items);
        const padding = 50;
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight - 60; // Account for toolbar
        const scaleX = (containerWidth - padding * 2) / bounds.width;
        const scaleY = (containerHeight - padding * 2) / bounds.height;
        const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
        this.viewport.zoom = scale;
        this.viewport.panX = (containerWidth / 2) - (bounds.x + bounds.width / 2) * scale;
        this.viewport.panY = (containerHeight / 2) - (bounds.y + bounds.height / 2) * scale + 30; // Account for toolbar
        this.updateViewport();
    }
    injectStyles() {
        if (document.querySelector('#wb-styles'))
            return;
        const style = document.createElement('style');
        style.id = 'wb-styles';
        style.textContent = `
      .wb-container {
        font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .wb-item {
        user-select: none;
      }
      
      .wb-item:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }
      
      .wb-selected {
        outline: 2px solid ${this.options.accentColor} !important;
        outline-offset: 2px;
      }
      
      .wb-resize {
        z-index: 1001;
      }
      
      .wb-tool-btn {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
      }
      
      .wb-tool-btn:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }
      
      .wb-tool-btn.active {
        background: ${this.options.accentColor};
        color: white;
        border-color: ${this.options.accentColor};
      }
      
      .wb-toolbar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 8px;
        z-index: 1100;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
    `;
        document.head.appendChild(style);
    }
    // Getter for accessing private members from toolbar
    get currentDrawingMode() { return this.drawingMode; }
    get currentViewport() { return { ...this.viewport }; }
    get selectedItemCount() { return this.selectedItems.size; }
}
exports.VisualWhiteboard = VisualWhiteboard;
