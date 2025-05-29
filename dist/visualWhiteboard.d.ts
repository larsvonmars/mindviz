/**
 * Expanded Whiteboard Library – May 2025 (visual refresh)
 * ------------------------------------------------------
 *  • Core data model unchanged (see previous version)
 *  • Visual layer rewritten for richer, modern UI:
 *      – Neon‑soft palette, rounded corners, drop shadows
 *      – Hover / selection effects, animated transitions
 *      – In‑place editing for *all* textual items (double‑click)
 *      – Resize handles (SE corner for now) with live preview
 *      – Global CSS injected automatically (scoped by .wb‑container)
 */
export * from "./whiteboard";
import { Whiteboard } from "./whiteboard";
export interface VisualOptions {
    gridSize?: number;
    snap?: boolean;
    background?: string;
    accentColor?: string;
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
    private bindResize;
    private updateViewportTransform;
    private updateSelectionOutline;
    exportPNG(): Promise<Blob>;
    private static styleInjected;
    private static injectStyles;
}
/**
 * Tailwind / utility frameworks are optional – this file ships zero‑dep CSS.
 */
