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

export type WhiteboardItemType = "text" | "image" | "graph" | "shape";

export interface WhiteboardItem {
  id: number;
  type: WhiteboardItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  z?: number; // stacking order
  rotation?: number; // degrees
  opacity?: number; // 0-1
  locked?: boolean;
  groupId?: number | null;
  content: any; // string for text, URL for image, data for graph, svgPath for shape
  metadata?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Event Emitter (tiny – no external dep).
// ---------------------------------------------------------------------------
export type EventName =
  | "item:add"
  | "item:update"
  | "item:delete"
  | "history:undo"
  | "history:redo"
  | "board:load";

export type Listener = (...args: any[]) => void;

class Emitter {
  private listeners = new Map<EventName, Set<Listener>>();
  on(event: EventName, fn: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.off(event, fn);
  }
  off(event: EventName, fn: Listener) {
    this.listeners.get(event)?.delete(fn);
  }
  emit(event: EventName, ...args: any[]) {
    this.listeners.get(event)?.forEach(l => l(...args));
  }
}

// ---------------------------------------------------------------------------
// Command pattern for history (undo / redo)
// ---------------------------------------------------------------------------
interface Command {
  do(): void;
  undo(): void;
}

class CommandStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  push(cmd: Command) {
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
export class Whiteboard {
  public items: WhiteboardItem[] = [];
  private newId = 1;
  private history = new CommandStack();
  private emitter = new Emitter();

  // -------------------------------------------------------------------------
  // Event helpers
  // -------------------------------------------------------------------------
  on = this.emitter.on.bind(this.emitter);
  off = this.emitter.off.bind(this.emitter);

  // -------------------------------------------------------------------------
  // Item CRUD w/ history
  // -------------------------------------------------------------------------
  addItem(partial: Omit<WhiteboardItem, "id">): WhiteboardItem {
    const item: WhiteboardItem = { id: this.newId++, z: this.items.length, ...partial };
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

  find(id: number) {
    return this.items.find(i => i.id === id);
  }

  updateItem(id: number, updates: Partial<Omit<WhiteboardItem, "id">>): void {
    const item = this.find(id);
    if (!item || item.locked) throw new Error("Item not found or locked");

    // Omit position changes (x/y) from history
    const keys = Object.keys(updates);
    if (keys.length > 0 && keys.every(k => k === 'x' || k === 'y')) {
      Object.assign(item, updates);
      this.emitter.emit("item:update", item);
      return;
    }

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

  deleteItem(id: number) {
    const item = this.find(id);
    if (!item) return;
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
  moveItem(id: number, dx: number, dy: number) {
    const item = this.find(id);
    if (!item) return;
    this.updateItem(id, { x: item.x + dx, y: item.y + dy });
  }

  resizeItem(id: number, w: number, h: number) {
    this.updateItem(id, { width: w, height: h });
  }

  bringToFront(id: number) {
    const maxZ = Math.max(...this.items.map(i => i.z ?? 0));
    this.updateItem(id, { z: maxZ + 1 });
  }

  sendToBack(id: number) {
    const minZ = Math.min(...this.items.map(i => i.z ?? 0));
    this.updateItem(id, { z: minZ - 1 });
  }

  duplicateItem(id: number) {
    const item = this.find(id);
    if (!item) return;
    const copy = { ...item, id: 0, x: item.x + 20, y: item.y + 20 }; // offset a bit
    return this.addItem(copy);
  }

  // -------------------------------------------------------------------------
  // Grouping
  // -------------------------------------------------------------------------
  private newGroupId = 1;

  groupItems(ids: number[]): number {
    const groupId = this.newGroupId++;
    ids.forEach(id => this.updateItem(id, { groupId }));
    return groupId;
  }

  ungroup(groupId: number) {
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
  toJSON(): string {
    return JSON.stringify({ items: this.items }, null, 2);
  }

  fromJSON(json: string) {
    const data = JSON.parse(json);
    this.items = data.items;
    this.newId = this.items.reduce((m: number, i: WhiteboardItem) => Math.max(m, i.id), 0) + 1;
    this.emitter.emit("board:load", this.items);
  }
}


