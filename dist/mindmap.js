"use strict";
/*
  Usage Instructions:
  -------------------
  This file exports the MindNode and MindMap classes for managing a mind map data structure.
  
  Basic Usage:
    - Create a root MindNode and pass it to the MindMap constructor.
    - Use addMindNode, deleteMindNode, or updateMindNode to manipulate the mind map.
    - Export or import your data via exportJson and importJson as needed.
  
  Using with React:
    - Import these classes into your React components.
    - Manage the MindMap instance within your component state or effects.
    - Pass the MindMap instance to a visual component (e.g., VisualMindMap) to render updates.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MindMap = exports.MindNode = void 0;
class MindNode {
    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.children = [];
    }
    // Method to add a child MindNode
    addChild(MindNode) {
        this.children.push(MindNode);
    }
}
exports.MindNode = MindNode;
// Define the MindMap class
class MindMap {
    // Changed constructor to accept a MindNode instead of a string.
    constructor(root) {
        this.root = root;
        this.MindNodeCount = root.id + 1; // assumes root.id is assigned appropriately
    }
    // Add a new MindNode as a child to a given parent MindNode by id
    addMindNode(parentId, label) {
        const parentMindNode = this.findMindNode(this.root, parentId);
        if (!parentMindNode) {
            throw new Error(`Parent MindNode with id ${parentId} not found.`);
        }
        const newMindNode = new MindNode(this.MindNodeCount++, label);
        parentMindNode.addChild(newMindNode);
        return newMindNode;
    }
    // Recursive helper to find a MindNode by id
    findMindNode(currentMindNode, id) {
        if (currentMindNode.id === id)
            return currentMindNode;
        for (let child of currentMindNode.children) {
            const found = this.findMindNode(child, id);
            if (found)
                return found;
        }
        return null;
    }
    exportJson() {
        return JSON.stringify(this.root);
    }
    importJson(json) {
        this.root = JSON.parse(json);
    }
    // Add a new MindNode deletion function
    deleteMindNode(MindNodeId) {
        if (this.root.id === MindNodeId) {
            throw new Error("Cannot delete the root MindNode.");
        }
        const parent = this.findParent(this.root, MindNodeId);
        if (!parent) {
            throw new Error(`MindNode with id ${MindNodeId} not found.`);
        }
        // Remove the child from parent's children array
        parent.children = parent.children.filter(child => child.id !== MindNodeId);
    }
    updateMindNode(MindNodeId, label) {
        const MindNode = this.findMindNode(this.root, MindNodeId);
        if (!MindNode) {
            throw new Error(`MindNode with id ${MindNodeId} not found.`);
        }
        MindNode.label = label;
    }
    makeSibling(MindNodeId, label) {
        const parent = this.findParent(this.root, MindNodeId);
        if (!parent) {
            throw new Error(`MindNode with id ${MindNodeId} not found.`);
        }
        const newMindNode = new MindNode(this.MindNodeCount++, label);
        parent.addChild(newMindNode);
        return newMindNode;
    }
    // Private helper to find the parent of a MindNode by child's id
    findParent(currentMindNode, childId) {
        for (let child of currentMindNode.children) {
            if (child.id === childId) {
                return currentMindNode;
            }
            const found = this.findParent(child, childId);
            if (found)
                return found;
        }
        return null;
    }
    // Method to print the mindmap structure
    print(MindNode = this.root, indent = 0) {
        console.log(' '.repeat(indent) + `${MindNode.id}: ${MindNode.label}`);
        MindNode.children.forEach(child => this.print(child, indent + 2));
    }
}
exports.MindMap = MindMap;
