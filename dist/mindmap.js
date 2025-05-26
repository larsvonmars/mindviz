"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MindMap = exports.MindNode = void 0;
class MindNode {
    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.parent = null; // new parent property
        this.expanded = true; // new property for expand/collapse
        this.description = ''; // new property for description
        this.imageUrl = ""; // NEW: Add imageUrl property
        this.hidden = false; // new property for hidden
        this.children = [];
        this.background = "#ffffff"; // initialize default background
        this.hidden = false; // initialize hidden property
        this.shape = 'rectangle'; // default shape
    }
    // Updated addChild to assign child's parent
    addChild(child) {
        child.parent = this; // assign parent
        this.children.push(child);
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
        newMindNode.parent = parentMindNode; // assign parent explicitly
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
    // Unified export: convert the model into JSON
    toJSON() {
        return JSON.stringify(this.serializeNode(this.root), null, 2);
    }
    // Unified import: load the model from JSON
    fromJSON(json) {
        const data = JSON.parse(json);
        this.root = this.deserializeNode(data);
        // Ensure the MindNodeCount is set to one more than the highest existing id
        this.MindNodeCount = this.getMaxId(this.root) + 1;
    }
    // Helper to recursively serialize a MindNode
    serializeNode(node) {
        return {
            id: node.id,
            label: node.label,
            x: node.x, // <-- Add position tracking
            y: node.y,
            description: node.description, // new
            background: node.background,
            expanded: node.expanded, // new
            imageUrl: node.imageUrl, // NEW: Export imageUrl
            shape: node.shape, // new
            children: node.children.map(child => this.serializeNode(child))
        };
    }
    // Helper to recursively deserialize a MindNode
    deserializeNode(data) {
        const node = new MindNode(data.id, data.label);
        node.x = data.x; // <-- Restore position
        node.y = data.y;
        node.description = data.description || ''; // new
        node.background = data.background;
        node.expanded = data.expanded ?? true; // new
        node.imageUrl = data.imageUrl || ""; // NEW: Import imageUrl
        node.shape = data.shape || 'rectangle'; // new
        if (data.children) {
            data.children.forEach((childData) => {
                node.addChild(this.deserializeNode(childData));
            });
        }
        return node;
    }
    // NEW: Helper method to recursively get the maximum id in the MindMap
    getMaxId(node) {
        let maxId = node.id;
        node.children.forEach(child => {
            maxId = Math.max(maxId, this.getMaxId(child));
        });
        return maxId;
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
    // Update updateMindNode to also update description
    updateMindNode(MindNodeId, label, description) {
        const node = this.findMindNode(this.root, MindNodeId);
        if (!node) {
            throw new Error(`MindNode with id ${MindNodeId} not found.`);
        }
        node.label = label;
        node.description = description; // update description
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
    print(node = this.root, indent = 0) {
        console.log(' '.repeat(indent) + `${node.id}: ${node.label}`);
        node.children.forEach(child => this.print(child, indent + 2));
    }
}
exports.MindMap = MindMap;
