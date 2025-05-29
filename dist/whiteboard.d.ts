/**
 * Expanded Whiteboard Library – May 2025
 * ------------------------------------------------
 * Adds rich item attributes and management utilities:
 *  • z-index, rotation, opacity, locked, groupId, metadata
 *  • Movement, resize, duplication, grouping, layering helpers
 *  • Undo / Redo via a simple Command stack
 *  • EventEmitter so UI layers can react to model changes
 */
export type WhiteboardItemType = "text" | "image" | "graph" | "shape" | "sticky";
export interface WhiteboardItem {
    id: number;
    type: WhiteboardItemType;
    x: number;
    y: number;
    width: number;
    height: number;
    z?: number;
    rotation?: number;
    opacity?: number;
    locked?: boolean;
    groupId?: number | null;
    content: any;
    metadata?: Record<string, any>;
}
export type EventName = "item:add" | "item:update" | "item:delete" | "history:undo" | "history:redo" | "board:load";
export type Listener = (...args: any[]) => void;
export declare class Whiteboard {
    items: WhiteboardItem[];
    private newId;
    private history;
    private emitter;
    on: (event: EventName, fn: Listener) => () => void;
    off: (event: EventName, fn: Listener) => void;
    addItem(partial: Omit<WhiteboardItem, "id">): WhiteboardItem;
    find(id: number): WhiteboardItem | undefined;
    updateItem(id: number, updates: Partial<Omit<WhiteboardItem, "id">>): void;
    deleteItem(id: number): void;
    moveItem(id: number, dx: number, dy: number): void;
    resizeItem(id: number, w: number, h: number): void;
    bringToFront(id: number): void;
    sendToBack(id: number): void;
    duplicateItem(id: number): WhiteboardItem | undefined;
    private newGroupId;
    groupItems(ids: number[]): number;
    ungroup(groupId: number): void;
    undo(): void;
    redo(): void;
    toJSON(): string;
    fromJSON(json: string): void;
}
