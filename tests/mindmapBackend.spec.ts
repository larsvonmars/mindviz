import { test, expect } from '@playwright/test';
import { MindMap } from '../src/mindmap';

test.describe('MindMap backend tests', () => {
  test('initializes with a root node', () => {
    const mindMap = new MindMap('Root');
    expect(mindMap.root).toBeDefined();
    expect(mindMap.root.id).toBe(0);
    expect(mindMap.root.label).toBe('Root');
    expect(mindMap.root.children.length).toBe(0);
  });

  test('adds a child node', () => {
    const mindMap = new MindMap('Root');
    const childNode = mindMap.addNode(0, 'Child 1');
    expect(childNode.label).toBe('Child 1');
    expect(mindMap.root.children.length).toBe(1);
    expect(mindMap.root.children[0]).toEqual(childNode);
  });

  test('updates a node label', () => {
    const mindMap = new MindMap('Root');
    mindMap.addNode(0, 'Child 1');
    mindMap.updateNode(1, 'Updated Child');
    const updatedNode = mindMap.root.children.find(child => child.id === 1);
    expect(updatedNode?.label).toBe('Updated Child');
  });

  test('throws an error when updating an inexistent node', () => {
    const mindMap = new MindMap('Root');
    expect(() => mindMap.updateNode(999, 'Label')).toThrow();
  });

  test('deletes a node', () => {
    const mindMap = new MindMap('Root');
    const child1 = mindMap.addNode(0, 'Child 1');
    const child2 = mindMap.addNode(0, 'Child 2');
    mindMap.deleteNode(child1.id);
    expect(mindMap.root.children.length).toBe(1);
    expect(mindMap.root.children[0].id).toBe(child2.id);
  });

  test('throws an error when trying to delete the root node', () => {
    const mindMap = new MindMap('Root');
    expect(() => mindMap.deleteNode(0)).toThrow('Cannot delete the root node.');
  });

  test('adds a sibling node', () => {
    const mindMap = new MindMap('Root');
    const child1 = mindMap.addNode(0, 'Child 1');
    const sibling = mindMap.makeSibling(child1.id, 'Child 1 Sibling');
    expect(mindMap.root.children.length).toBe(2);
    const labels = mindMap.root.children.map(child => child.label);
    expect(labels).toContain('Child 1');
    expect(labels).toContain('Child 1 Sibling');
  });

  test('exports and imports JSON preserving structure', () => {
    const mindMap = new MindMap('Root');
    mindMap.addNode(0, 'Child 1');
    const json = mindMap.exportJson();
    
    const newMindMap = new MindMap('Dummy'); // dummy initialization; will be replaced
    newMindMap.importJson(json);
    
    expect(newMindMap.root.label).toBe('Root');
    expect(newMindMap.root.children.length).toBe(1);
    expect(newMindMap.root.children[0].label).toBe('Child 1');
  });
});