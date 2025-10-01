"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionLayer = void 0;
class InteractionLayer {
    constructor(canvas, board, viewport, visual, options) {
        this.canvas = canvas;
        this.board = board;
        this.viewport = viewport;
        this.visual = visual;
        this.options = options;
        this.mode = 'idle';
        this.rafId = null;
        this.lastPointerMoveEvent = null;
        // Pinch-zoom state
        this.pinchStartDist = null;
        this.pinchStartZoom = 1;
        this.pinchStartCenter = { x: 0, y: 0 };
        this.pinchRafId = null;
        this.lastPinchEvent = null;
        // Pointer events - use passive where possible for better performance
        canvas.addEventListener('pointerdown', this.onPointerDown.bind(this), { passive: false });
        canvas.addEventListener('pointermove', this.onPointerMoveThrottled.bind(this), { passive: true });
        canvas.addEventListener('pointerup', this.onPointerUp.bind(this), { passive: false });
        canvas.addEventListener('pointercancel', this.onPointerUp.bind(this), { passive: false });
        // Touch-specific optimizations
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
        canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: true });
        // Wheel for zoom
        if (this.options.enableZooming) {
            canvas.addEventListener('wheel', this.visual.handleWheel.bind(this.visual), { passive: false });
        }
        // Keyboard shortcuts
        window.addEventListener('keydown', this.visual.handleKeyDown.bind(this.visual));
        // Resize observer with debounce
        const resizeObserver = new ResizeObserver(() => {
            if (this.rafId)
                return;
            this.rafId = requestAnimationFrame(() => {
                this.visual.updateViewport();
                this.rafId = null;
            });
        });
        resizeObserver.observe(this.canvas.parentElement);
    }
    /** Handle pointer down events with FSM */
    onPointerDown(e) {
        if (this.visual.isTextEditing)
            return;
        e.preventDefault();
        const pt = this.viewport.fromScreen(e.clientX, e.clientY);
        const target = e.target;
        // Resize handle
        const resizeHandle = target.closest('.wb-resize-handle');
        if (resizeHandle) {
            this.visual.handlePointerDown(e);
            this.mode = 'resize';
            this.canvas.setPointerCapture(e.pointerId);
            return;
        }
        // Drawing
        if (this.visual.drawingMode !== 'select') {
            this.visual.startDrawing(pt);
            this.mode = 'draw';
            return;
        }
        // Item drag
        const itemEl = target.closest('.wb-item');
        if (itemEl) {
            this.visual.handleItemPointerDown(e, itemEl, pt);
            this.mode = 'drag';
            this.canvas.setPointerCapture(e.pointerId);
            return;
        }
        // Canvas down: pan or select
        if (e.button === 1 || (this.options.enablePanning && e.button === 0 && e.ctrlKey)) {
            this.visual.handleCanvasPointerDown(e, pt);
            this.mode = 'pan';
            this.canvas.setPointerCapture(e.pointerId);
        }
        else {
            this.visual.handleCanvasPointerDown(e, pt);
            this.mode = 'select';
            this.mode = 'select';
            this.visual.clearSelection();
            this.visual.createSelectionRect(pt);
            this.canvas.setPointerCapture(e.pointerId);
        }
    }
    /** Throttle pointer move with requestAnimationFrame for better performance */
    onPointerMoveThrottled(e) {
        this.lastPointerMoveEvent = e;
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                if (this.lastPointerMoveEvent) {
                    this.onPointerMove(this.lastPointerMoveEvent);
                }
                this.rafId = null;
            });
        }
    }
    /** Handle pointer move events with FSM */
    onPointerMove(e) {
        const pt = this.viewport.fromScreen(e.clientX, e.clientY);
        switch (this.mode) {
            case 'pan':
                this.visual.updatePan(e.clientX, e.clientY);
                break;
            case 'select':
                this.visual.updateSelection(pt);
                break;
            case 'drag':
                this.visual.updateDrag(pt);
                break;
            case 'draw':
                this.visual.updateDrawing(pt);
                break;
            case 'resize':
                this.visual.updateResize(pt);
                break;
            default:
                break;
        }
    }
    /** Handle touch start events for better touch support */
    onTouchStart(e) {
        // Handle two-finger pinch-to-zoom
        if (e.touches.length === 2 && this.options.enableZooming) {
            e.preventDefault();
            this.pinchStartDist = this.getTouchesDistance(e.touches);
            this.pinchStartZoom = this.viewport.zoom;
            this.pinchStartCenter = this.getTouchesCenter(e.touches);
        }
        else if (e.touches.length > 1) {
            // Prevent default to avoid mouse event emulation
            e.preventDefault();
        }
    }
    /** Handle touch move events */
    onTouchMove(e) {
        // Handle two-finger pinch-to-zoom
        if (e.touches.length === 2 && this.pinchStartDist !== null && this.options.enableZooming) {
            e.preventDefault();
            this.lastPinchEvent = e;
            // Throttle pinch updates with requestAnimationFrame
            if (!this.pinchRafId) {
                this.pinchRafId = requestAnimationFrame(() => this.handlePinchMove());
            }
            return;
        }
        // Prevent scrolling when interacting with whiteboard
        if (this.mode !== 'idle') {
            e.preventDefault();
        }
    }
    /** Handle touch end events */
    onTouchEnd(e) {
        // Reset pinch state when fingers are lifted
        if (e.touches.length < 2) {
            this.pinchStartDist = null;
            this.lastPinchEvent = null;
            if (this.pinchRafId) {
                cancelAnimationFrame(this.pinchRafId);
                this.pinchRafId = null;
            }
        }
        // Clean up touch state if needed
        if (e.touches.length === 0) {
            this.lastPointerMoveEvent = null;
        }
    }
    /** Handle pointer up events with FSM */
    onPointerUp(e) {
        const pt = this.viewport.fromScreen(e.clientX, e.clientY);
        switch (this.mode) {
            case 'pan':
                this.visual.finishPan();
                break;
            case 'select':
                this.visual.finishSelection();
                break;
            case 'drag':
                this.visual.finishDrag();
                break;
            case 'draw':
                this.visual.finishDrawing(pt);
                break;
            case 'resize':
                this.visual.finishResize();
                break;
            default:
                break;
        }
        this.canvas.releasePointerCapture(e.pointerId);
        this.mode = 'idle';
    }
    /** Handle pinch-to-zoom gesture */
    handlePinchMove() {
        if (!this.lastPinchEvent || !this.pinchStartDist)
            return;
        const e = this.lastPinchEvent;
        const newDist = this.getTouchesDistance(e.touches);
        const scale = newDist / this.pinchStartDist;
        const newZoom = Math.max(0.1, Math.min(5, this.pinchStartZoom * scale));
        const newCenter = this.getTouchesCenter(e.touches);
        // Apply zoom at the center of the two fingers
        const rect = this.canvas.getBoundingClientRect();
        const screenX = newCenter.x;
        const screenY = newCenter.y;
        // Use ViewportController's zoomAt method for proper zoom behavior
        const oldZoom = this.viewport.zoom;
        this.viewport.zoom = newZoom;
        // Adjust pan to keep the pinch center point stable
        const mouseX = screenX - rect.left;
        const mouseY = screenY - rect.top;
        const zoomRatio = newZoom / oldZoom;
        this.viewport.panX = mouseX - (mouseX - this.viewport.panX) * zoomRatio;
        this.viewport.panY = mouseY - (mouseY - this.viewport.panY) * zoomRatio;
        this.viewport.applyToElement();
        this.visual.updateViewport();
        this.pinchRafId = null;
    }
    /** Calculate distance between two touch points */
    getTouchesDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }
    /** Calculate center point between two touches */
    getTouchesCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2,
        };
    }
}
exports.InteractionLayer = InteractionLayer;
