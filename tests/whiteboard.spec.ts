import { test, expect } from '@playwright/test';
import { Whiteboard, WhiteboardItem } from '../src/whiteboard';

// Whiteboard model unit tests

test.describe('Whiteboard model tests', () => {
  test('initializes with no items', () => {
    const board = new Whiteboard();
    expect(board.items).toHaveLength(0);
  });

  test('addItem should assign incremental id and emit event', () => {
    const board = new Whiteboard();
    let eventItem: WhiteboardItem | null = null;
    board.on('item:add', item => {
      eventItem = item;
    });

    const item = board.addItem({
      type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      content: 'Hello'
    });

    expect(item.id).toBe(1);
    expect(board.items).toContain(item);
    expect(eventItem).toEqual(item);
  });

  test('updateItem should modify properties and emit update event', () => {
    const board = new Whiteboard();
    const item = board.addItem({ type: 'text', x: 0, y: 0, width: 10, height: 10, content: 'Hi' });
    let updatedEvent: WhiteboardItem | null = null;
    board.on('item:update', updated => {
      updatedEvent = updated;
    });

    board.updateItem(item.id, { x: 20, y: 30, opacity: 0.5 });

    const found = board.find(item.id)!;
    expect(found.x).toBe(20);
    expect(found.y).toBe(30);
    expect(found.opacity).toBe(0.5);
    expect(updatedEvent).toEqual(found);
  });

  test('updateItem should throw if item is locked or not found', () => {
    const board = new Whiteboard();
    const item = board.addItem({ type: 'text', x: 0, y: 0, width: 10, height: 10, content: 'Locked' });
    // lock the item
    (item as any).locked = true;
    expect(() => board.updateItem(item.id, { x: 5 })).toThrow();
    expect(() => board.updateItem(999, { x: 1 })).toThrow();
  });

  test('deleteItem should remove item and emit delete event', () => {
    const board = new Whiteboard();
    const item = board.addItem({ type: 'text', x: 1, y: 2, width: 5, height: 5, content: 'Removable' });
    let deletedEvent: WhiteboardItem | null = null;
    board.on('item:delete', deleted => {
      deletedEvent = deleted;
    });

    board.deleteItem(item.id);
    expect(board.find(item.id)).toBeUndefined();
    expect(deletedEvent).toEqual(item);
  });

  test('moveItem and resizeItem should update coordinates and dimensions', () => {
    const board = new Whiteboard();
    const item = board.addItem({ type: 'shape', x: 10, y: 10, width: 20, height: 20, content: {} });
    board.moveItem(item.id, 5, -5);
    const moved = board.find(item.id)!;
    expect(moved.x).toBe(15);
    expect(moved.y).toBe(5);

    board.resizeItem(item.id, 50, 60);
    const resized = board.find(item.id)!;
    expect(resized.width).toBe(50);
    expect(resized.height).toBe(60);
  });

  test('bringToFront and sendToBack should adjust z-index', () => {
    const board = new Whiteboard();
    const a = board.addItem({ type: 'text', x: 0, y: 0, width: 1, height: 1, content: 'A' });
    const b = board.addItem({ type: 'text', x: 0, y: 0, width: 1, height: 1, content: 'B' });
    expect(a.z!).toBe(0);
    expect(b.z!).toBe(1);

    board.bringToFront(a.id);
    expect(board.find(a.id)!.z!).toBeGreaterThan(board.find(b.id)!.z!);

    board.sendToBack(b.id);
    expect(board.find(b.id)!.z!).toBeLessThan(board.find(a.id)!.z!);
  });

  test('duplicateItem should create a new item offset and emit add event', () => {
    const board = new Whiteboard();
    const original = board.addItem({ type: 'note', x: 0, y: 0, width: 10, height: 10, content: 'Note' });
    const duplicate = board.duplicateItem(original.id)!;
    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.x).toBe(original.x + 20);
    expect(duplicate.y).toBe(original.y + 20);
    expect(board.items).toContain(duplicate);
  });

  test('groupItems and ungroup should set and clear groupId', () => {
    const board = new Whiteboard();
    const i1 = board.addItem({ type: 'text', x: 0, y: 0, width: 1, height: 1, content: 'G1' });
    const i2 = board.addItem({ type: 'text', x: 0, y: 0, width: 1, height: 1, content: 'G2' });
    const groupId = board.groupItems([i1.id, i2.id]);
    expect(board.find(i1.id)!.groupId).toBe(groupId);
    expect(board.find(i2.id)!.groupId).toBe(groupId);

    board.ungroup(groupId);
    expect(board.find(i1.id)!.groupId).toBeUndefined();
    expect(board.find(i2.id)!.groupId).toBeUndefined();
  });

  test('undo and redo should revert and reapply actions', () => {
    const board = new Whiteboard();
    const item = board.addItem({ type: 'text', x: 0, y: 0, width: 1, height: 1, content: 'Undo' });
    board.updateItem(item.id, { x: 10 });
    board.deleteItem(item.id);
    expect(board.find(item.id)).toBeUndefined();

    board.undo(); // undelete
    expect(board.find(item.id)).toBeDefined();

    board.undo(); // undo update
    expect(board.find(item.id)!.x).toBe(0);

    board.undo(); // undo add
    expect(board.items).toHaveLength(0);

    board.redo(); // redo add
    expect(board.items).toHaveLength(1);
    board.redo(); // redo update
    expect(board.find(item.id)!.x).toBe(10);
    board.redo(); // redo delete
    expect(board.find(item.id)).toBeUndefined();
  });

  test('toJSON and fromJSON should preserve state', () => {
    const board = new Whiteboard();
    board.addItem({ type: 'text', x: 1, y: 2, width: 3, height: 4, content: 'Data' });
    const json = board.toJSON();

    const newBoard = new Whiteboard();
    newBoard.fromJSON(json);
    expect(newBoard.items).toHaveLength(1);
    expect(newBoard.find(1)!.content).toBe('Data');
  });
});
