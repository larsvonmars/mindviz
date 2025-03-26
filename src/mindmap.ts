class MindNode {
  public children: MindNode[];
  public background: string; // new property for background
  public parent: MindNode | null = null; // new parent property
  public expanded: boolean = true;       // new property for expand/collapse
  public description: string = '';         // new property for description

  constructor(public id: number, public label: string) {
    this.children = [];
    this.background = "#ffffff"; // initialize default background
  }

  // Updated addChild to assign child's parent
  addChild(child: MindNode): void {
    child.parent = this; // assign parent
    this.children.push(child);
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
    newMindNode.parent = parentMindNode; // assign parent explicitly
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

  // Unified export: convert the model into JSON
  public toJSON(): string {
    return JSON.stringify(this.serializeNode(this.root), null, 2);
  }

  // Unified import: load the model from JSON
  public fromJSON(json: string): void {
    const data = JSON.parse(json);
    this.root = this.deserializeNode(data);
    // Ensure the MindNodeCount is set to one more than the highest existing id
    this.MindNodeCount = this.getMaxId(this.root) + 1;
  }

  // Helper to recursively serialize a MindNode
  private serializeNode(node: MindNode): any {
    return {
      id: node.id,
      label: node.label,
      x: (node as any).x,        // <-- Add position tracking
      y: (node as any).y,
      description: node.description,       // new
      background: node.background,
      expanded: node.expanded,             // new
      children: node.children.map(child => this.serializeNode(child))
    };
  }

  // Helper to recursively deserialize a MindNode
  private deserializeNode(data: any): MindNode {
    const node = new MindNode(data.id, data.label);
    (node as any).x = data.x;    // <-- Restore position
    (node as any).y = data.y;
    node.description = data.description || '';   // new
    node.background = data.background;
    node.expanded = data.expanded ?? true;         // new
    if (data.children) {
      data.children.forEach((childData: any) => {
        node.addChild(this.deserializeNode(childData));
      });
    }
    return node;
  }

  // NEW: Helper method to recursively get the maximum id in the MindMap
  private getMaxId(node: MindNode): number {
    let maxId = node.id;
    node.children.forEach(child => {
      maxId = Math.max(maxId, this.getMaxId(child));
    });
    return maxId;
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

  // Update updateMindNode to also update description
  public updateMindNode(MindNodeId: number, label: string, description: string): void {
    const node = this.findMindNode(this.root, MindNodeId);
    if (!node) {
      throw new Error(`MindNode with id ${MindNodeId} not found.`);
    }
    node.label = label;
    node.description = description; // update description
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
  print(node: MindNode = this.root, indent: number = 0): void {
    console.log(' '.repeat(indent) + `${node.id}: ${node.label}`);
    node.children.forEach(child => this.print(child, indent + 2));
  }
}

// Export the classes so they can be used in other modules
export { MindNode, MindMap };

