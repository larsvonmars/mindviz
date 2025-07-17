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
const ContextMenuWhiteboard_1 = require("./ContextMenuWhiteboard");
const ViewportController_1 = require("./ViewportController");
const InteractionLayer_1 = require("./InteractionLayer");
const path_1 = require("./utils/path");
const TextEditor_1 = require("./TextEditor");
class VisualWhiteboard {
    constructor(container, board, options = {}) {
        // Selection state
        this.selectedItemsSet = new Set();
        this.selectionBox = null;
        this.selectionRect = null;
        // Drawing state
        this.drawingMode = 'select';
        this.currentPath = null;
        this.drawingData = [];
        this.isDrawing = false;
        this.isErasing = false;
        this.drawStartPoint = null;
        this.eraserRadius = 12;
        // Interaction state
        this.isDragging = false;
        this.isPanning = false;
        this.isSelecting = false;
        this.dragStartPoint = null;
        this.draggedItems = new Map();
        // Element management
        this.itemElements = new Map();
        // Resize state
        this.activeResizeHandleType = null;
        this.activeResizeItemInitialState = null;
        this.isResizing = false;
        this.resizeStartPoint = null;
        this.resizeStartDimensions = null;
        // Add new state properties for performance and interaction improvements
        this.lastPointerPosition = null;
        this.isTextEditing = false;
        this.pendingRender = false;
        this.renderQueue = [];
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
        // initialize viewport for pan/zoom
        this.viewport = new ViewportController_1.ViewportController(this.canvas);
        this.createSVGOverlay();
        this.toolbar = (0, ToolbarWhiteboard_1.createWhiteboardToolbar)(this);
        this.contextMenu = (0, ContextMenuWhiteboard_1.createContextMenu)(this);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.contextMenu); // delegate interactions to InteractionLayer
        this.input = new InteractionLayer_1.InteractionLayer(this.canvas, this.board, this.viewport, this, this.options);
        this.injectStyles();
        // Add throttled render
        this.render = this.throttleRender.bind(this);
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
            height: '100%', // Changed from 600px
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
    handlePointerDown(e) {
        // Prevent interaction during text editing
        if (this.isTextEditing)
            return;
        e.preventDefault();
        const point = this.screenToCanvas(e.clientX, e.clientY);
        const target = e.target;
        // Check if clicking on a resize handle
        const resizeHandle = target.closest('.wb-resize-handle');
        if (resizeHandle) {
            const itemElement = resizeHandle.closest('.wb-item');
            if (itemElement) {
                const itemId = parseInt(itemElement.dataset.id);
                const item = this.board.find(itemId);
                if (item) {
                    this.startResize(e, item, resizeHandle.dataset.handleType, point);
                    this.canvas.setPointerCapture(e.pointerId);
                    return;
                }
            }
        }
        // Check if clicking on an item
        const itemElement = target.closest('.wb-item');
        if (this.drawingMode !== 'select') {
            if (this.drawingMode === 'eraser') {
                this.startErasing(point);
            }
            else {
                this.startDrawing(point);
            }
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
        // Skip if no meaningful movement
        if (this.lastPointerPosition &&
            Math.abs(e.clientX - this.lastPointerPosition.x) < 2 &&
            Math.abs(e.clientY - this.lastPointerPosition.y) < 2) {
            return;
        }
        this.lastPointerPosition = { x: e.clientX, y: e.clientY };
        const point = this.screenToCanvas(e.clientX, e.clientY);
        if (this.isResizing && this.activeResizeItemInitialState && this.resizeStartPoint) {
            this.updateResize(point);
        }
        else if (this.isErasing) {
            this.updateErasing(point);
        }
        else if (this.isDrawing && this.drawingMode !== 'select') {
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
        const point = this.screenToCanvas(e.clientX, e.clientY); // Capture final point
        if (this.isResizing) {
            this.finishResize();
        }
        else if (this.isErasing) {
            this.finishErasing();
        }
        else if (this.isDrawing && this.drawingMode !== 'select') {
            this.finishDrawing(point); // Pass final point to finishDrawing
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
        if (!this.selectedItemsSet.has(itemId) && !e.shiftKey) {
            this.clearSelection();
        }
        this.selectedItemsSet.add(itemId);
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
                if (this.currentPath) {
                    this.currentPath.setAttribute('d', `M ${point.x} ${point.y}`);
                    this.currentPath.setAttribute('stroke', this.options.accentColor);
                    this.currentPath.setAttribute('stroke-width', '2');
                    this.currentPath.setAttribute('fill', 'none');
                    this.currentPath.setAttribute('stroke-linecap', 'round');
                    svg.appendChild(this.currentPath);
                }
                break;
            case 'rect':
            case 'circle':
            case 'line':
            case 'arrow':
                this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                if (this.currentPath) {
                    this.currentPath.setAttribute('stroke', this.options.accentColor);
                    this.currentPath.setAttribute('stroke-width', '2');
                    this.currentPath.setAttribute('fill', 'none');
                    if (this.drawingMode === 'arrow') {
                        this.currentPath.setAttribute('marker-end', 'url(#wb-arrow)');
                    }
                    svg.appendChild(this.currentPath);
                }
                break;
        }
        this.svgOverlay.style.pointerEvents = 'auto';
    }
    updateDrawing(point) {
        if (!this.isDrawing || !this.currentPath || !this.drawStartPoint)
            return;
        if (this.drawingMode === 'pen') {
            this.drawingData.push(point);
            const path = this.buildSmoothPath(this.drawingData);
            this.currentPath.setAttribute('d', path);
        }
        else {
            const b = this.calculateShapeBounds(this.drawStartPoint, point);
            const path = this.buildShapePath(this.drawingMode, b.width, b.height);
            this.currentPath.setAttribute('d', path);
            this.currentPath.setAttribute('transform', `translate(${b.x}, ${b.y})`);

        }
    }
    finishDrawing(point) {
        if (!this.isDrawing)
            return;
        this.isDrawing = false;

        let pathData = '';
        let bounds;
        if (this.drawingMode === 'pen') {
            this.drawingData.push(point);
            pathData = this.buildSmoothPath(this.drawingData);
            bounds = this.calculatePenBounds();
        }
        else {
            bounds = this.calculateShapeBounds(this.drawStartPoint, point);
            pathData = this.buildShapePath(this.drawingMode, bounds.width, bounds.height);
        }
        this.board.addItem({
            type: 'shape',
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            content: pathData,
            metadata: {
                strokeColor: this.options.accentColor,
                strokeWidth: 2,
                fillColor: 'transparent',
                arrow: this.drawingMode === 'arrow'
            }
        });
        // Cleanup
        this.currentPath = null;
        this.drawingData = [];
        this.svgOverlay.style.pointerEvents = 'none';
        // Return to select mode
        this.setDrawingMode('select');
    }
    startErasing(point) {
        this.isErasing = true;
        this.eraseAt(point);
    }
    updateErasing(point) {
        if (!this.isErasing)
            return;
        this.eraseAt(point);
    }
    finishErasing() {
        this.isErasing = false;
    }
    eraseAt(point) {
        const targets = this.getShapesNearPoint(point.x, point.y, this.eraserRadius);
        for (const item of targets) {

            this.board.deleteItem(item.id);
        }
    }
    calculatePenBounds() {
        if (this.drawingData.length === 0)
            return { x: 0, y: 0, width: 0, height: 0 };
        // If only one point (a dot), position it there with zero width/height initially
        // The finishDrawing method will ensure a minimum visible size.
        if (this.drawingData.length === 1)
            return { x: this.drawingData[0].x, y: this.drawingData[0].y, width: 0, height: 0 };
        const xs = this.drawingData.map(p => p.x);
        const ys = this.drawingData.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    calculateShapeBounds(start, end) {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        return { x, y, width, height };
    }
    buildShapePath(type, width, height) {
        switch (type) {
            case 'rect':
                return (0, path_1.rectPath)(width, height);
            case 'circle':
                return (0, path_1.ellipsePath)(width, height);
            case 'line':
            case 'arrow':
                return (0, path_1.linePath)(width, height);
        }
    }

    buildSmoothPath(points) {
        return (0, path_1.catmullRomToBezier)(points);
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
        // Add data attribute for identification
        this.selectionRect.setAttribute('data-selection-rect', 'true');
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
        this.selectedItemsSet.clear();
        for (const item of this.board.items) {
            if (this.isItemInRect(item, { x, y, width, height })) {
                this.selectedItemsSet.add(item.id);
            }
        }
        this.updateSelectionDisplay();
    }
    finishSelection() {
        this.isSelecting = false;
        this.dragStartPoint = null;
        // Remove all selection rectangles
        document.querySelectorAll('[data-selection-rect]').forEach(el => el.remove());
        this.selectionRect = null;
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
        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        this.viewport.zoomAt(e.clientX, e.clientY, scaleFactor);
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
        return this.viewport.fromScreen(screenX, screenY);
    }
    screenToWorld(screenPoint) {
        return this.screenToCanvas(screenPoint.x, screenPoint.y);
    }
    getItemAt(x, y) {
        // Find item at position (iterate in reverse z-order)
        const items = [...this.board.items].sort((a, b) => (b.z || 0) - (a.z || 0));
        for (const item of items) {
            if (x >= item.x && x <= item.x + item.width &&
                y >= item.y && y <= item.y + item.height) {
                return item;
            }
        }
        return null;
    }
    getShapesNearPoint(x, y, radius) {
        const r2 = radius * radius;
        return this.board.items.filter(i => {
            if (i.type !== 'shape')
                return false;
            const dx = Math.max(i.x - x, 0, x - (i.x + i.width));
            const dy = Math.max(i.y - y, 0, y - (i.y + i.height));
            return dx * dx + dy * dy <= r2;
        });
    }
    resetView() {
        this.viewport.zoom = 1;
        this.viewport.panX = 0;
        this.viewport.panY = 0;
        this.viewport.applyToElement();
        this.updateViewport();
    }
    updateViewport() {
        // apply controller transform and maintain handles scale
        this.viewport.applyToElement();
        this.canvas.querySelectorAll('.wb-resize-handle').forEach(handle => {
            handle.style.transform = `scale(${1 / this.viewport.zoom})`;
        });
    }
    clearSelection() {
        this.selectedItemsSet.clear();
        this.updateSelectionDisplay();
    }
    selectAll() {
        this.selectedItemsSet.clear();
        for (const item of this.board.items) {
            this.selectedItemsSet.add(item.id);
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
        // Update item visual states and handle visibility
        for (const [id, element] of this.itemElements) {
            const item = this.board.find(id);
            if (!item)
                continue;
            const isNowSelected = this.selectedItemsSet.has(id);
            const wasSelected = element.classList.contains('wb-selected');
            const canHaveHandles = item.type === 'text' || item.type === 'image' || item.type === 'shape' || item.type === 'note';
            if (isNowSelected) {
                element.classList.add('wb-selected');
                if (!wasSelected && canHaveHandles) {
                    // Item just became selected, add handles
                    this.addResizeHandle(element, item);
                }
            }
            else { // Not selected now
                element.classList.remove('wb-selected');
                if (wasSelected && canHaveHandles) {
                    // Item just became deselected, remove handles
                    element.querySelectorAll('.wb-resize-handle').forEach(h => h.remove());
                }
            }
        }
        // Create selection box for multiple items
        if (this.selectedItemsSet.size > 1) {
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
        // Queue render instead of immediate update
        if (!this.renderQueue.includes(item.id)) {
            this.renderQueue.push(item.id);
            this.render();
        }
    }
    handleItemDelete(item) {
        const element = this.itemElements.get(item.id);
        if (element) {
            element.remove();
            this.itemElements.delete(item.id);
        }
        this.selectedItemsSet.delete(item.id);
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
        // Initial auto-resize for text-like items after they are fully setup
        if (item.type === 'text' || item.type === 'note') {
            const textContentDiv = element.querySelector('.wb-text-content');
            if (textContentDiv) {
                this.autoResizeTextItem(element, item, textContentDiv);
            }
        }
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
            backgroundColor: (() => {
                if (item.type === 'text')
                    return item.metadata?.backgroundColor || '#ffffa0';
                if (item.type === 'note')
                    return item.metadata?.backgroundColor || '#fefcbf';
                return item.metadata?.backgroundColor || '#ffffff';
            })(),
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            cursor: 'grab',
            transition: 'box-shadow 0.2s ease',
            zIndex: (item.z || 0).toString(),
            opacity: (item.opacity || 1).toString(),
            transform: `rotate(${item.rotation || 0}deg)`,
            display: 'flex', // For text item content alignment
            flexDirection: 'column', // For text item content alignment
        });
        // Clear content
        // const wasSelected = element.classList.contains('wb-selected'); // Check if it was selected before clearing // No longer needed
        element.innerHTML = ''; // Clear previous content and handles
        // Render content based on type
        switch (item.type) {
            case 'text':
                this.renderTextItem(element, item);
                break;
            case 'note':
                this.renderNoteItem(element, item);
                break;
            case 'image':
                this.renderImageItem(element, item);
                break;
            case 'shape':
                this.renderShapeItem(element, item);
                break;
            default:
                // Default rendering or placeholder
                const placeholder = document.createElement('div');
                placeholder.textContent = `Item ID: ${item.id} (type: ${item.type})`;
                placeholder.style.padding = '10px';
                element.appendChild(placeholder);
                break;
        }
        // Add resize handle if the item is selected and resizable
        if (this.selectedItemsSet.has(item.id) && (item.type === 'text' || item.type === 'image' || item.type === 'shape' || item.type === 'note')) {
            this.addResizeHandle(element, item);
        }
        // Removed the explicit 'else if (wasSelected...)' block for handle removal,
        // as element.innerHTML = '' and addResizeHandle's own cleanup should suffice.
    }
    renderTextItem(element, item) {
        const textContentDiv = document.createElement('div');
        textContentDiv.classList.add('wb-text-content');
        textContentDiv.contentEditable = 'true';
        textContentDiv.style.width = '100%';
        textContentDiv.style.height = '100%';
        textContentDiv.style.minHeight = '20px'; // Minimum height for usability
        textContentDiv.style.padding = '8px';
        textContentDiv.style.boxSizing = 'border-box';
        textContentDiv.style.outline = 'none';
        textContentDiv.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and newlines
        textContentDiv.style.wordBreak = 'break-word'; // Break words to prevent overflow
        textContentDiv.style.overflowY = 'auto'; // Allow vertical scrolling if content exceeds manually set height
        textContentDiv.textContent = String(item.content || '');
        element.appendChild(textContentDiv);
        textContentDiv.addEventListener('input', () => {
            const newContent = textContentDiv.textContent || '';
            // Update content immediately for responsiveness, but auto-resize might be better on blur or a slight delay
            // For now, let's update content and rely on explicit resize or a future auto-resize enhancement
            if (item.content !== newContent) {
                this.board.updateItem(item.id, { content: newContent });
            }
            this.autoResizeTextItem(element, item, textContentDiv);
        });
    }
    renderNoteItem(element, item) {
        const editor = new TextEditor_1.TextEditor({
            initialValue: String(item.content || ''),
            placeholder: 'Note...'
        });
        const wrapper = editor.getElement();
        const toolbar = wrapper.firstElementChild;
        toolbar.style.display = 'none';
        Object.assign(wrapper.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            boxShadow: 'none'
        });
        const noteDiv = wrapper.querySelector('div[contenteditable]');
        noteDiv.classList.add('wb-text-content');
        noteDiv.style.padding = '8px';
        noteDiv.style.height = '100%';
        noteDiv.setAttribute('contenteditable', 'false');

        element.style.border = `2px dashed ${this.options.accentColor}`;
        element.appendChild(wrapper);
        editor.onChange((content) => {
            if (item.content !== content) {
                this.board.updateItem(item.id, { content });
            }
            this.autoResizeTextItem(element, item, noteDiv);
        });
    }
    autoResizeTextItem(itemElement, item, textContentDiv) {
        // Temporarily remove fixed dimensions
        textContentDiv.style.height = 'auto';
        itemElement.style.height = 'auto';
        // Calculate new dimensions
        const padding = 16; // Account for padding
        const newHeight = Math.max(textContentDiv.scrollHeight + padding, 20);
        // Only update if significant change
        if (Math.abs(item.height - newHeight) > 5) {
            this.board.updateItem(item.id, { height: newHeight });
        }
        // Restore proper styling
        textContentDiv.style.height = '100%';
        itemElement.style.height = `${item.height}px`;
    }
    renderImageItem(element, item) {
        const img = document.createElement('img');
        img.src = String(item.content || ''); // Assuming content is the image URL
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain'; // Or 'cover', depending on desired behavior
        img.draggable = false; // Prevent native image dragging
        element.appendChild(img);
    }
    renderShapeItem(element, item) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        // Ensure viewBox dimensions are not zero to prevent rendering issues
        const viewBoxWidth = Math.max(item.width, 1);
        const viewBoxHeight = Math.max(item.height, 1);
        svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        svg.style.overflow = 'visible';
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', String(item.content || '')); // item.content is the SVG path data
        path.setAttribute('fill', item.metadata?.fillColor || 'transparent'); // Default to transparent if not specified
        path.setAttribute('stroke', item.metadata?.strokeColor || this.options.accentColor);
        path.setAttribute('stroke-width', String(item.metadata?.strokeWidth || 2));
        path.setAttribute('vector-effect', 'non-scaling-stroke'); // Prevent stroke scaling
        if (item.metadata?.arrow) {
            path.setAttribute('marker-end', 'url(#wb-arrow)');
        }
        svg.appendChild(path);
        element.appendChild(svg);
    }
    addResizeHandle(element, item) {
        // Remove existing handles to prevent duplicates on re-render
        element.querySelectorAll('.wb-resize-handle').forEach(h => h.remove());
        const handleSize = 10; // Visual size of the handle
        const handleOffset = -handleSize / 2; // Offset to center the handle on the border
        const handles = [
            { type: 'n', cursor: 'ns-resize', style: { top: `${handleOffset}px`, left: '50%', transform: `translate(-50%, -0%) scale(${1 / this.viewport.zoom})` } },
            { type: 's', cursor: 'ns-resize', style: { bottom: `${handleOffset}px`, left: '50%', transform: `translate(-50%, 0%) scale(${1 / this.viewport.zoom})` } },
            { type: 'e', cursor: 'ew-resize', style: { top: '50%', right: `${handleOffset}px`, transform: `translate(0%, -50%) scale(${1 / this.viewport.zoom})` } },
            { type: 'w', cursor: 'ew-resize', style: { top: '50%', left: `${handleOffset}px`, transform: `translate(0%, -50%) scale(${1 / this.viewport.zoom})` } },
            { type: 'ne', cursor: 'nesw-resize', style: { top: `${handleOffset}px`, right: `${handleOffset}px`, transform: `scale(${1 / this.viewport.zoom})` } },
            { type: 'nw', cursor: 'nwse-resize', style: { top: `${handleOffset}px`, left: `${handleOffset}px`, transform: `scale(${1 / this.viewport.zoom})` } },
            { type: 'se', cursor: 'nwse-resize', style: { bottom: `${handleOffset}px`, right: `${handleOffset}px`, transform: `scale(${1 / this.viewport.zoom})` } },
            { type: 'sw', cursor: 'nesw-resize', style: { bottom: `${handleOffset}px`, left: `${handleOffset}px`, transform: `scale(${1 / this.viewport.zoom})` } },
        ];
        handles.forEach(handleData => {
            const handleEl = document.createElement('div');
            handleEl.classList.add('wb-resize-handle', `wb-resize-${handleData.type}`);
            handleEl.dataset.handleType = handleData.type;
            Object.assign(handleEl.style, {
                position: 'absolute',
                width: `${handleSize}px`,
                height: `${handleSize}px`,
                backgroundColor: this.options.accentColor,
                border: '1px solid white',
                borderRadius: '50%',
                cursor: handleData.cursor,
                zIndex: '100',
                ...handleData.style,
            });
            element.appendChild(handleEl);
        });
    }
    enterTextEditMode(itemId, textContentDiv) {
        this.isTextEditing = true;
        this.canvas.style.cursor = 'text';
        this.clearSelection();
        this.selectedItemsSet.add(itemId);
        this.updateSelectionDisplay();
        textContentDiv.setAttribute('contenteditable', 'true');
        textContentDiv.focus();
        // Select all text for easier editing
        const range = document.createRange();
        range.selectNodeContents(textContentDiv);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    }
    setupItemInteractions(element, item) {
        if (item.type === 'text' || item.type === 'note') {
            const textContentDiv = element.querySelector('.wb-text-content');
            // Double-click to edit text/note
            element.addEventListener('dblclick', () => {
                if (textContentDiv) {
                    this.enterTextEditMode(item.id, textContentDiv);
                }
            });
            if (textContentDiv) {
                textContentDiv.addEventListener('focus', () => {
                    this.isTextEditing = true;
                    this.canvas.style.cursor = 'text';
                    this.clearSelection();
                    this.selectedItemsSet.add(item.id);
                    this.updateSelectionDisplay();
                });
                textContentDiv.addEventListener('blur', () => {
                    this.isTextEditing = false;
                    this.canvas.style.cursor = 'grab';
                    textContentDiv.removeAttribute('contenteditable');
                    const newContent = textContentDiv.textContent || '';
                    if (item.content !== newContent) {
                        this.board.updateItem(item.id, { content: newContent });
                    }
                });
            }
        }
    }
    startResize(event, item, handleType, startPoint) {
        this.isResizing = true;
        this.activeResizeItemInitialState = {
            id: item.id,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
        };
        // Store initial dimensions
        this.resizeStartDimensions = {
            width: item.width,
            height: item.height
        };
        this.resizeStartPoint = startPoint;
        this.activeResizeHandleType = handleType;
        this.canvas.style.cursor = `${handleType}-resize`; // e.g., 'se-resize'
        event.stopPropagation(); // Prevent dragging the item while resizing
    }
    updateResize(currentPoint) {
        if (!this.isResizing || !this.activeResizeItemInitialState || !this.resizeStartPoint || !this.activeResizeHandleType) {
            return;
        }
        const initial = this.activeResizeItemInitialState;
        const item = this.board.find(initial.id);
        if (!item)
            return;
        let dx = currentPoint.x - this.resizeStartPoint.x;
        let dy = currentPoint.y - this.resizeStartPoint.y;
        let newX = initial.x;
        let newY = initial.y;
        let newWidth = initial.width;
        let newHeight = initial.height;
        const minSize = 20; // Minimum size for an item
        // --- Refactored sign-based resize logic ---
        const HS = { w: -1, e: 1, n: -1, s: 1 };
        const handle = this.activeResizeHandleType;
        const signX = HS[handle[0]] ?? 0;
        const signY = HS[handle.slice(-1)] ?? 0;
        if (signX !== 0) {
            newWidth = Math.max(minSize, initial.width + dx * signX);
            if (signX < 0)
                newX = initial.x + (initial.width - newWidth);
        }
        if (signY !== 0) {
            newHeight = Math.max(minSize, initial.height + dy * signY);
            if (signY < 0)
                newY = initial.y + (initial.height - newHeight);
        }
        this.board.updateItem(initial.id, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
        });
    }
    finishResize() {
        if (!this.isResizing || !this.activeResizeItemInitialState)
            return;
        const item = this.board.find(this.activeResizeItemInitialState.id);
        if (item && (item.type === 'text' || item.type === 'note')) {
            const itemElement = this.itemElements.get(item.id);
            const textContentDiv = itemElement?.querySelector('.wb-text-content');
            if (itemElement && textContentDiv) {
                // If width was changed by handles 'e', 'w', 'ne', 'nw', 'se', 'sw', then auto-resize height.
                // Handles 'n', 's' directly control height, so no auto-resize is needed for them.
                const widthChangingHandles = ['e', 'w', 'ne', 'nw', 'se', 'sw'];
                if (this.activeResizeHandleType && widthChangingHandles.includes(this.activeResizeHandleType)) {
                    this.autoResizeTextItem(itemElement, item, textContentDiv);
                }
            }
        }
        this.isResizing = false;
        this.activeResizeItemInitialState = null;
        this.resizeStartPoint = null;
        this.activeResizeHandleType = null;
        this.canvas.style.cursor = 'grab';
        this.updateSelectionDisplay(); // Re-render selection which might update handles
    }
    setDrawingMode(mode) {
        this.drawingMode = mode;
        this.isErasing = false;
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
            case 'text':
                return 'New Text';
            case 'note':
                return 'Note';
            case 'image':
                return 'https://via.placeholder.com/100x50';
            case 'shape':
                return 'M0 0 L100 50'; // Default shape path
            default:
                return '';
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
    get selectedItemCount() { return this.selectedItemsSet.size; }
    get selectedItems() { return Array.from(this.selectedItemsSet); }
    // Add throttled rendering methods
    throttleRender() {
        if (!this.pendingRender) {
            this.pendingRender = true;
            requestAnimationFrame(() => {
                this.performRender();
                this.pendingRender = false;
            });
        }
    }
    performRender() {
        // Process render queue
        const itemsToUpdate = [...new Set(this.renderQueue)];
        this.renderQueue = [];
        for (const id of itemsToUpdate) {
            const item = this.board.find(id);
            const element = this.itemElements.get(id);
            if (item && element) {
                this.updateItemElement(element, item);
            }
        }
        // Update selection display
        this.updateSelectionDisplay();
    }
    // Add point normalization with grid snapping
    normalizePoint(point) {
        return {
            x: this.options.snap ? Math.round(point.x / this.options.gridSize) * this.options.gridSize : point.x,
            y: this.options.snap ? Math.round(point.y / this.options.gridSize) * this.options.gridSize : point.y
        };
    }
    // Add improved drawing cancellation
    cancelDrawing() {
        if (this.currentPath && this.svgOverlay.contains(this.currentPath)) {
            this.svgOverlay.removeChild(this.currentPath);
        }
        this.currentPath = null;
        this.drawingData = [];
        this.isDrawing = false;
        this.drawStartPoint = null;
        this.svgOverlay.style.pointerEvents = 'none';
    }
}
exports.VisualWhiteboard = VisualWhiteboard;
