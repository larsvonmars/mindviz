"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MindMap = exports.MindNode = void 0;
class MindNode {
    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.children = [];
        this.background = "#ffffff"; // initialize default background
    }
    // Method to add a child MindNode
    addChild(MindNode) {
        this.children.push(MindNode);
    }
}
exports.MindNode = MindNode;
// Define the MindMap class
class MindMap {
    // Updated constructor: start counter at 1 regardless of root.id
    constructor(root) {
        this.root = root;
        this.MindNodeCount = 1; // Unique IDs start at 1
    }
    // Add a new MindNode as a child to a given parent MindNode by id
    addMindNode(parentId, label) {
        const parentMindNode = this.findMindNode(this.root, parentId);
        if (!parentMindNode) {
            throw new Error(`Parent MindNode with id ${parentId} not found.`);
        }
        const newMindNode = new MindNode(this.MindNodeCount++, label); // Now generates unique IDs
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
