import { Whiteboard } from "./whiteboard";
import { ViewportController } from "./ViewportController";
import { VisualOptions, Point } from "./visualWhiteboard";
import { VisualWhiteboard } from "./visualWhiteboard";

/** Interaction modes */
type Mode = 'idle' | 'drag' | 'pan' | 'select' | 'draw' | 'resize';

export class InteractionLayer {
  private mode: Mode = 'idle';
  private rafId: number | null = null;
  private lastPointerMoveEvent: PointerEvent | null = null;

  constructor(
    private canvas: HTMLDivElement,
    private board: Whiteboard,
    private viewport: ViewportController,
    private visual: VisualWhiteboard,
    private options: Required<VisualOptions>
  ) {
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
      if (this.rafId) return;
      this.rafId = requestAnimationFrame(() => {
        this.visual.updateViewport();
        this.rafId = null;
      });
    });
    resizeObserver.observe(this.canvas.parentElement!);
  }
  /** Handle pointer down events with FSM */
  private onPointerDown(e: PointerEvent): void {
    if (this.visual.isTextEditing) return;
    e.preventDefault();
    const pt = this.viewport.fromScreen(e.clientX, e.clientY);
    const target = e.target as HTMLElement;
    // Resize handle
    const resizeHandle = target.closest('.wb-resize-handle') as HTMLElement;
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
    const itemEl = target.closest('.wb-item') as HTMLDivElement;
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
    } else {
      this.visual.handleCanvasPointerDown(e, pt);
      this.mode = 'select';
      this.mode = 'select';
      this.visual.clearSelection();
      this.visual.createSelectionRect(pt);
      this.canvas.setPointerCapture(e.pointerId);
    }
  }
  /** Throttle pointer move with requestAnimationFrame for better performance */
  private onPointerMoveThrottled(e: PointerEvent): void {
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
  private onPointerMove(e: PointerEvent): void {
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
  private onTouchStart(e: TouchEvent): void {
    // Prevent default to avoid mouse event emulation
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }
  
  /** Handle touch move events */
  private onTouchMove(e: TouchEvent): void {
    // Prevent scrolling when interacting with whiteboard
    if (this.mode !== 'idle') {
      e.preventDefault();
    }
  }
  
  /** Handle touch end events */
  private onTouchEnd(e: TouchEvent): void {
    // Clean up touch state if needed
    if (e.touches.length === 0) {
      this.lastPointerMoveEvent = null;
    }
  }
  /** Handle pointer up events with FSM */
  private onPointerUp(e: PointerEvent): void {
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
