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
    constructor(canvas: HTMLDivElement, board: Whiteboard, viewport: ViewportController, visual: VisualWhiteboard, options: Required<VisualOptions>);
    /** Handle pointer down events with FSM */
    private onPointerDown;
    /** Handle pointer move events with FSM */
    private onPointerMove;
    /** Handle pointer up events with FSM */
    private onPointerUp;
}
