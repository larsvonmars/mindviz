import { test, expect } from '@playwright/test';
import { MindMap, MindNode } from '../src/mindmap';

test.describe('MindMap backend tests', () => {
  test('initializes with a root MindNode', () => {
    // Changed constructor argument
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    expect(mindMap.root).toBeDefined();
    expect(mindMap.root.id).toBe(0);
    expect(mindMap.root.label).toBe('Root');
    expect(mindMap.root.children.length).toBe(0);
  });

  test('adds a child MindNode', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    const childMindNode = mindMap.addMindNode(0, 'Child 1');
    expect(childMindNode.label).toBe('Child 1');
    expect(mindMap.root.children.length).toBe(1);
    expect(mindMap.root.children[0]).toEqual(childMindNode);
  });

  test('updates a MindNode label', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    mindMap.addMindNode(0, 'Child 1');
    mindMap.updateMindNode(1, 'Updated Child', '');
    const updatedMindNode = mindMap.root.children.find(child => child.id === 1);
    expect(updatedMindNode?.label).toBe('Updated Child');
  });

  test('throws an error when updating an inexistent MindNode', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    expect(() => mindMap.updateMindNode(999, 'Label', '')).toThrow();
  });

  test('deletes a MindNode', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    const child1 = mindMap.addMindNode(0, 'Child 1');
    const child2 = mindMap.addMindNode(0, 'Child 2');
    mindMap.deleteMindNode(child1.id);
    expect(mindMap.root.children.length).toBe(1);
    expect(mindMap.root.children[0].id).toBe(child2.id);
  });

  test('throws an error when trying to delete the root MindNode', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    expect(() => mindMap.deleteMindNode(0)).toThrow('Cannot delete the root MindNode.');
  });

  test('adds a sibling MindNode', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    const child1 = mindMap.addMindNode(0, 'Child 1');
    const sibling = mindMap.makeSibling(child1.id, 'Child 1 Sibling');
    expect(mindMap.root.children.length).toBe(2);
    const labels = mindMap.root.children.map(child => child.label);
    expect(labels).toContain('Child 1');
    expect(labels).toContain('Child 1 Sibling');
  });

  test('exports and imports JSON preserving structure', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    mindMap.addMindNode(0, 'Child 1');
    const json = mindMap.toJSON();
    
    // Dummy initialization replaced with a new root MindNode.
    const newMindMap = new MindMap(new MindNode(0, 'Dummy'));
    newMindMap.fromJSON(json);
    
    expect(newMindMap.root.label).toBe('Root');
    expect(newMindMap.root.children.length).toBe(1);
    expect(newMindMap.root.children[0].label).toBe('Child 1');
  });

  test('getAllNodes returns every node in the map', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    mindMap.addMindNode(0, 'Child 1');
    mindMap.addMindNode(0, 'Child 2');
    const nodes = mindMap.getAllNodes();
    const labels = nodes.map(n => n.label);
    expect(labels).toEqual(expect.arrayContaining(['Root', 'Child 1', 'Child 2']));
  });

  test('updateMindNodeProperties updates partial data', () => {
    const mindMap = new MindMap(new MindNode(0, 'Root'));
    const child = mindMap.addMindNode(0, 'Child');
    mindMap.updateMindNodeProperties(child.id, { background: '#fff' });
    const node = mindMap.findMindNode(mindMap.root, child.id);
    expect(node?.background).toBe('#fff');
    expect(node?.label).toBe('Child');
  });
});