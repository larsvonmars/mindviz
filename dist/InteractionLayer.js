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
        // Pointer events
        canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
        canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
        canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
        // Wheel for zoom
        if (this.options.enableZooming) {
            canvas.addEventListener('wheel', this.visual.handleWheel.bind(this.visual), { passive: false });
        }
        // Keyboard shortcuts
        window.addEventListener('keydown', this.visual.handleKeyDown.bind(this.visual));
        // Resize observer
        const resizeObserver = new ResizeObserver(() => this.visual.updateViewport());
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
}
exports.InteractionLayer = InteractionLayer;
