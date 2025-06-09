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
interface Point {
    x: number;
    y: number;
}
export declare class VisualWhiteboard {
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
    private drawingMode;
    private currentPath;
    private drawingData;
    private isDrawing;
    private drawStartPoint;
    private isDragging;
    private isPanning;
    private isSelecting;
    private dragStartPoint;
    private draggedItems;
    private itemElements;
    private isResizing;
    private activeResizeItemInitialState;
    private resizeStartPoint;
    private activeResizeHandleType;
    constructor(container: HTMLElement, board: Whiteboard, options?: VisualOptions);
    private initializeContainer;
    private createCanvas;
    private createSVGOverlay;
    private drawGrid;
    private setupEventListeners;
    private handlePointerDown;
    private handlePointerMove;
    private handlePointerUp;
    private handleItemPointerDown;
    private handleCanvasPointerDown;
    private startDrawing;
    private updateDrawing;
    private finishDrawing;
    private calculatePenBounds;
    private relativePoints;
    private buildSmoothPath;
    private updateDrag;
    private finishDrag;
    private updatePan;
    private finishPan;
    private createSelectionRect;
    private updateSelection;
    private finishSelection;
    private isItemInRect;
    private handleWheel;
    private handleKeyDown;
    private screenToCanvas;
    screenToWorld(screenPoint: Point): Point;
    getItemAt(x: number, y: number): WhiteboardItem | null;
    private updateViewport;
    private clearSelection;
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
    private autoResizeTextItem;
    private renderImageItem;
    private renderShapeItem;
    private addResizeHandle;
    private setupItemInteractions;
    private startResize;
    private updateResize;
    private finishResize;
    setDrawingMode(mode: 'select' | 'pen' | 'rect' | 'circle' | 'line' | 'arrow'): void;
    addItem(type: WhiteboardItem['type'], x?: number, y?: number): void;
    private getDefaultContent;
    render(): void;
    exportPNG(): Promise<Blob>;
    resetView(): void;
    zoomToFit(): void;
    private injectStyles;
    get currentDrawingMode(): "select" | "circle" | "line" | "rect" | "pen" | "arrow" | null;
    get currentViewport(): {
        zoom: number;
        panX: number;
        panY: number;
    };
    get selectedItemCount(): number;
    get selectedItems(): number[];
}
