import { Whiteboard } from "./whiteboard";
export interface VisualOptions {
    gridSize?: number;
    snap?: boolean;
    background?: string;
}
export declare class VisualWhiteboard {
    readonly board: Whiteboard;
    private readonly container;
    private readonly canvas;
    private zoom;
    private panX;
    private panY;
    private options;
    private selected;
    private selectionBox;
    constructor(container: HTMLElement, board: Whiteboard, opts?: VisualOptions);
    private fullRender;
    private drawGrid;
    private elementMap;
    private renderItem;
    private updateItemElement;
    private removeItemElement;
    private applyItemStyles;
    private bindInteractions;
    private makeInteractive;
    private updateViewportTransform;
    private updateSelectionOutline;
    exportPNG(): Promise<Blob>;
}
/**
.wb-container::-webkit-scrollbar { display: none; }
.wb-item.selected { outline: 2px solidrgb(6, 6, 6); }
*/
