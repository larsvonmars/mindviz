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

class MindNode {
  public children: MindNode[];

  constructor(public id: number, public label: string) {
    this.children = [];
  }

  // Method to add a child MindNode
  addChild(MindNode: MindNode): void {
    this.children.push(MindNode);
  }
}

// Define the MindMap class
class MindMap {
  public root: MindNode;
  private MindNodeCount: number;

  // Updated constructor: start counter at 1 regardless of root.id
  constructor(root: MindNode) {
    this.root = root;
    this.MindNodeCount = 1; // Unique IDs start at 1
  }

  // Add a new MindNode as a child to a given parent MindNode by id
  addMindNode(parentId: number, label: string): MindNode {
    const parentMindNode = this.findMindNode(this.root, parentId);
    if (!parentMindNode) {
      throw new Error(`Parent MindNode with id ${parentId} not found.`);
    }
    const newMindNode = new MindNode(this.MindNodeCount++, label); // Now generates unique IDs
    parentMindNode.addChild(newMindNode);
    return newMindNode;
  }

  // Recursive helper to find a MindNode by id
  private findMindNode(currentMindNode: MindNode, id: number): MindNode | null {
    if (currentMindNode.id === id) return currentMindNode;
    for (let child of currentMindNode.children) {
      const found = this.findMindNode(child, id);
      if (found) return found;
    }
    return null;
  }

  exportJson(): string {
    return JSON.stringify(this.root);
  }

  importJson(json: string): void {
    this.root = JSON.parse(json);
  }

  // Add a new MindNode deletion function
  deleteMindNode(MindNodeId: number): void {
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

  updateMindNode(MindNodeId: number, label: string): void {
    const MindNode = this.findMindNode(this.root, MindNodeId);
    if (!MindNode) {
      throw new Error(`MindNode with id ${MindNodeId} not found.`);
    }
    MindNode.label = label;
  }

  makeSibling(MindNodeId: number, label: string): MindNode {
    const parent = this.findParent(this.root, MindNodeId);
    if (!parent) {
      throw new Error(`MindNode with id ${MindNodeId} not found.`);
    }
    const newMindNode = new MindNode(this.MindNodeCount++, label);
    parent.addChild(newMindNode);
    return newMindNode;
  }

  // Private helper to find the parent of a MindNode by child's id
  private findParent(currentMindNode: MindNode, childId: number): MindNode | null {
    for (let child of currentMindNode.children) {
      if (child.id === childId) {
        return currentMindNode;
      }
      const found = this.findParent(child, childId);
      if (found) return found;
    }
    return null;
  }

  // Method to print the mindmap structure
  print(MindNode: MindNode = this.root, indent: number = 0): void {
    console.log(' '.repeat(indent) + `${MindNode.id}: ${MindNode.label}`);
    MindNode.children.forEach(child => this.print(child, indent + 2));
  }
}

// Export the classes so they can be used in other modules
export { MindNode, MindMap };

