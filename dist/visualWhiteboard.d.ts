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
export * from "./whiteboard";
import { Whiteboard, WhiteboardItem } from "./whiteboard";
export interface VisualOptions {
    gridSize?: number;
    snap?: boolean;
    background?: string;
    accentColor?: string;
    showGrid?: boolean;
    enablePanning?: boolean;
    enableZooming?: boolean;
}
export interface Point {
    x: number;
    y: number;
}
export declare class VisualWhiteboard {
    input: import("./InteractionLayer").InteractionLayer;
    readonly board: Whiteboard;
    readonly container: HTMLElement;
    private canvas;
    private svgOverlay;
    private readonly toolbar;
    private readonly contextMenu;
    private viewport;
    private options;
    private selectedItemsSet;
    private selectionBox;
    private selectionRect;
    drawingMode: 'select' | 'pen' | 'rect' | 'circle' | 'line' | 'arrow' | 'eraser' | null;
    private currentPath;
    private drawingData;
    private isDrawing;
    private isErasing;
    private drawStartPoint;
    private eraserRadius;
    private isDragging;
    private isPanning;
    private isSelecting;
    private dragStartPoint;
    private draggedItems;
    private itemElements;
    activeResizeHandleType: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
    activeResizeItemInitialState: {
        id: number;
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    private isResizing;
    private resizeStartPoint;
    private resizeStartDimensions;
    private lastPointerPosition;
    isTextEditing: boolean;
    private pendingRender;
    private renderQueue;
    constructor(container: HTMLElement, board: Whiteboard, options?: VisualOptions);
    private initializeContainer;
    private createCanvas;
    private createSVGOverlay;
    private drawGrid;
    handlePointerDown(e: PointerEvent): void;
    handlePointerMove(e: PointerEvent): void;
    handlePointerUp(e: PointerEvent): void;
    handleItemPointerDown(e: PointerEvent, itemElement: HTMLDivElement, point: Point): void;
    handleCanvasPointerDown(e: PointerEvent, point: Point): void;
    startDrawing(point: Point): void;
    updateDrawing(point: Point): void;
    finishDrawing(point: Point): void;
    private startErasing;
    private updateErasing;
    private finishErasing;
    private eraseAt;
    private calculatePenBounds;
    private calculateShapeBounds;
    private buildShapePath;
    private buildSmoothPath;
    updateDrag(point: Point): void;
    finishDrag(): void;
    updatePan(clientX: number, clientY: number): void;
    finishPan(): void;
    createSelectionRect(startPoint: Point): void;
    updateSelection(point: Point): void;
    finishSelection(): void;
    private isItemInRect;
    handleWheel(e: WheelEvent): void;
    handleKeyDown(e: KeyboardEvent): void;
    private screenToCanvas;
    screenToWorld(screenPoint: Point): Point;
    getItemAt(x: number, y: number): WhiteboardItem | null;
    private getShapesNearPoint;
    resetView(): void;
    updateViewport(): void;
    clearSelection(): void;
    private selectAll;
    private deleteSelectedItems;
    private updateSelectionDisplay;
    private calculateSelectionBounds;
    private createSelectionBox;
    private handleItemAdd;
    private handleItemUpdate;
    private handleItemDelete;
    private createItemElement;
    private updateItemElement;
    private renderTextItem;
    private renderNoteItem;
    private autoResizeTextItem;
    private renderImageItem;
    private renderShapeItem;
    private addResizeHandle;
    enterTextEditMode(itemId: number, textContentDiv: HTMLElement): void;
    private setupItemInteractions;
    private startResize;
    updateResize(currentPoint: Point): void;
    finishResize(): void;
    setDrawingMode(mode: 'select' | 'pen' | 'rect' | 'circle' | 'line' | 'arrow' | 'eraser'): void;
    addItem(type: WhiteboardItem['type'], x?: number, y?: number): void;
    private getDefaultContent;
    render(): void;
    exportPNG(): Promise<Blob>;
    zoomToFit(): void;
    private injectStyles;
    get currentDrawingMode(): "select" | "circle" | "line" | "rect" | "pen" | "eraser" | "arrow" | null;
    get currentViewport(): {
        zoom: number;
        panX: number;
        panY: number;
    };
    get selectedItemCount(): number;
    get selectedItems(): number[];
    private throttleRender;
    private performRender;
    private normalizePoint;
    private cancelDrawing;
}
