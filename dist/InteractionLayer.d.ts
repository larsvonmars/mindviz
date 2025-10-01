import { Whiteboard } from "./whiteboard";
import { ViewportController } from "./ViewportController";
import { VisualOptions } from "./visualWhiteboard";
import { VisualWhiteboard } from "./visualWhiteboard";
export declare class InteractionLayer {
    private canvas;
    private board;
    private viewport;
    private visual;
    private options;
    private mode;
    private rafId;
    private lastPointerMoveEvent;
    private pinchStartDist;
    private pinchStartZoom;
    private pinchStartCenter;
    private pinchRafId;
    private lastPinchEvent;
    constructor(canvas: HTMLDivElement, board: Whiteboard, viewport: ViewportController, visual: VisualWhiteboard, options: Required<VisualOptions>);
    /** Handle pointer down events with FSM */
    private onPointerDown;
    /** Throttle pointer move with requestAnimationFrame for better performance */
    private onPointerMoveThrottled;
    /** Handle pointer move events with FSM */
    private onPointerMove;
    /** Handle touch start events for better touch support */
    private onTouchStart;
    /** Handle touch move events */
    private onTouchMove;
    /** Handle touch end events */
    private onTouchEnd;
    /** Handle pointer up events with FSM */
    private onPointerUp;
    /** Handle pinch-to-zoom gesture */
    private handlePinchMove;
    /** Calculate distance between two touch points */
    private getTouchesDistance;
    /** Calculate center point between two touches */
    private getTouchesCenter;
}
