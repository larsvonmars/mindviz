"use strict";
// ---------------- whiteboard.ts ----------------
/**
 * Expanded Whiteboard Library – May 2025
 * ------------------------------------------------
 * Adds rich item attributes and management utilities:
 *  • z-index, rotation, opacity, locked, groupId, metadata
 *  • Movement, resize, duplication, grouping, layering helpers
 *  • Undo / Redo via a simple Command stack
 *  • EventEmitter so UI layers can react to model changes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Whiteboard = void 0;
class Emitter {
    constructor() {
        this.listeners = new Map();
    }
    on(event, fn) {
        if (!this.listeners.has(event))
            this.listeners.set(event, new Set());
        this.listeners.get(event).add(fn);
        return () => this.off(event, fn);
    }
    off(event, fn) {
        this.listeners.get(event)?.delete(fn);
    }
    emit(event, ...args) {
        this.listeners.get(event)?.forEach(l => l(...args));
    }
}
class CommandStack {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }
    push(cmd) {
        cmd.do();
        this.undoStack.push(cmd);
        this.redoStack = []; // clear future when new action occurs
    }
    undo() {
        const cmd = this.undoStack.pop();
        if (cmd) {
            cmd.undo();
            this.redoStack.push(cmd);
        }
    }
    redo() {
        const cmd = this.redoStack.pop();
        if (cmd) {
            cmd.do();
            this.undoStack.push(cmd);
        }
    }
    canUndo() {
        return this.undoStack.length > 0;
    }
    canRedo() {
        return this.redoStack.length > 0;
    }
}
// ---------------------------------------------------------------------------
// Whiteboard core
// ---------------------------------------------------------------------------
class Whiteboard {
    constructor() {
        this.items = [];
        this.newId = 1;
        this.history = new CommandStack();
        this.emitter = new Emitter();
        // -------------------------------------------------------------------------
        // Event helpers
        // -------------------------------------------------------------------------
        this.on = this.emitter.on.bind(this.emitter);
        this.off = this.emitter.off.bind(this.emitter);
        // -------------------------------------------------------------------------
        // Grouping
        // -------------------------------------------------------------------------
        this.newGroupId = 1;
    }
    // -------------------------------------------------------------------------
    // Item CRUD w/ history
    // -------------------------------------------------------------------------
    addItem(partial) {
        const item = { id: this.newId++, z: this.items.length, ...partial };
        this.history.push({
            do: () => {
                this.items.push(item);
                this.emitter.emit("item:add", item);
            },
            undo: () => {
                this.items = this.items.filter(i => i.id !== item.id);
                this.emitter.emit("item:delete", item);
            },
        });
        return item;
    }
    find(id) {
        return this.items.find(i => i.id === id);
    }
    updateItem(id, updates) {
        const item = this.find(id);
        if (!item || item.locked)
            throw new Error("Item not found or locked");
        // Historically, pure position updates were skipped from the history stack
        // to avoid clutter when dragging items. However this meant undo/redo could
        // behave unexpectedly when callers relied on `updateItem` for any change.
        // Now every update is recorded so state changes are fully reversible.
        const before = { ...item };
        this.history.push({
            do: () => {
                Object.assign(item, updates);
                this.emitter.emit("item:update", item);
            },
            undo: () => {
                Object.assign(item, before);
                this.emitter.emit("item:update", item);
            },
        });
    }
    deleteItem(id) {
        const item = this.find(id);
        if (!item)
            return;
        this.history.push({
            do: () => {
                this.items = this.items.filter(i => i.id !== id);
                this.emitter.emit("item:delete", item);
            },
            undo: () => {
                this.items.push(item);
                this.emitter.emit("item:add", item);
            },
        });
    }
    // -------------------------------------------------------------------------
    // Utility helpers (move, resize, layer, duplicate)
    // -------------------------------------------------------------------------
    moveItem(id, dx, dy) {
        const item = this.find(id);
        if (!item)
            return;
        this.updateItem(id, { x: item.x + dx, y: item.y + dy });
    }
    resizeItem(id, w, h) {
        this.updateItem(id, { width: w, height: h });
    }
    bringToFront(id) {
        const maxZ = Math.max(...this.items.map(i => i.z ?? 0));
        this.updateItem(id, { z: maxZ + 1 });
    }
    sendToBack(id) {
        const minZ = Math.min(...this.items.map(i => i.z ?? 0));
        this.updateItem(id, { z: minZ - 1 });
    }
    duplicateItem(id) {
        const item = this.find(id);
        if (!item)
            return;
        const copy = { ...item, id: 0, x: item.x + 20, y: item.y + 20 }; // offset a bit
        return this.addItem(copy);
    }
    groupItems(ids) {
        const groupId = this.newGroupId++;
        ids.forEach(id => this.updateItem(id, { groupId }));
        return groupId;
    }
    ungroup(groupId) {
        this.items
            .filter(i => i.groupId === groupId)
            .forEach(i => this.updateItem(i.id, { groupId: undefined }));
    }
    // -------------------------------------------------------------------------
    // History
    // -------------------------------------------------------------------------
    undo() {
        this.history.undo();
        this.emitter.emit("history:undo");
    }
    redo() {
        this.history.redo();
        this.emitter.emit("history:redo");
    }
    // -------------------------------------------------------------------------
    // Persistence helpers
    // -------------------------------------------------------------------------
    toJSON() {
        return JSON.stringify({ items: this.items }, null, 2);
    }
    fromJSON(json) {
        const data = JSON.parse(json);
        this.items = data.items;
        this.newId = this.items.reduce((m, i) => Math.max(m, i.id), 0) + 1;
        this.emitter.emit("board:load", this.items);
    }
}
exports.Whiteboard = Whiteboard;
