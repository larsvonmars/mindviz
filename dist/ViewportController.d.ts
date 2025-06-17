export interface Point {
    x: number;
    y: number;
}
export interface ViewportState {
    zoom: number;
    panX: number;
    panY: number;
}
export declare class ViewportController {
    zoom: number;
    panX: number;
    panY: number;
    private el;
    constructor(el: HTMLElement, initial?: Partial<ViewportState>);
    fromScreen(screenX: number, screenY: number): Point;
    applyToElement(): void;
    /**
     * Zoom the viewport at a given screen point (client coordinates) by a scale factor.
     */
    zoomAt(screenX: number, screenY: number, scaleFactor: number, minZoom?: number, maxZoom?: number): void;
}
