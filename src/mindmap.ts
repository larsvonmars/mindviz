class Node {
  public children: Node[];

  constructor(public id: number, public label: string) {
    this.children = [];
  }

  // Method to add a child node
  addChild(node: Node): void {
    this.children.push(node);
  }
}

// Define the MindMap class
class MindMap {
  public root: Node;
  private nodeCount: number;

  constructor(rootLabel: string) {
    // Create a root node with id 0
    this.root = new Node(0, rootLabel);
    this.nodeCount = 1; // to assign unique ids for new nodes
  }

  // Add a new node as a child to a given parent node by id
  addNode(parentId: number, label: string): Node {
    const parentNode = this.findNode(this.root, parentId);
    if (!parentNode) {
      throw new Error(`Parent node with id ${parentId} not found.`);
    }
    const newNode = new Node(this.nodeCount++, label);
    parentNode.addChild(newNode);
    return newNode;
  }

  // Recursive helper to find a node by id
  private findNode(currentNode: Node, id: number): Node | null {
    if (currentNode.id === id) return currentNode;
    for (let child of currentNode.children) {
      const found = this.findNode(child, id);
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

  // Add a new node deletion function
  deleteNode(nodeId: number): void {
    if (this.root.id === nodeId) {
      throw new Error("Cannot delete the root node.");
    }
    const parent = this.findParent(this.root, nodeId);
    if (!parent) {
      throw new Error(`Node with id ${nodeId} not found.`);
    }
    // Remove the child from parent's children array
    parent.children = parent.children.filter(child => child.id !== nodeId);
  }

  updateNode(nodeId: number, label: string): void {
    const node = this.findNode(this.root, nodeId);
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found.`);
    }
    node.label = label;
  }

  makeSibling(nodeId: number, label: string): Node {
    const parent = this.findParent(this.root, nodeId);
    if (!parent) {
      throw new Error(`Node with id ${nodeId} not found.`);
    }
    const newNode = new Node(this.nodeCount++, label);
    parent.addChild(newNode);
    return newNode;
  }

  // Private helper to find the parent of a node by child's id
  private findParent(currentNode: Node, childId: number): Node | null {
    for (let child of currentNode.children) {
      if (child.id === childId) {
        return currentNode;
      }
      const found = this.findParent(child, childId);
      if (found) return found;
    }
    return null;
  }

  // Method to print the mindmap structure
  print(node: Node = this.root, indent: number = 0): void {
    console.log(' '.repeat(indent) + `${node.id}: ${node.label}`);
    node.children.forEach(child => this.print(child, indent + 2));
  }
}

// Export the classes so they can be used in other modules
export { Node, MindMap };

// Example usage when running this file directly
// if (require.main === module) {
//   const myMindMap = new MindMap("Root");
//   myMindMap.addNode(0, "Child 1");
//   myMindMap.addNode(0, "Child 2");
//   myMindMap.addNode(1, "Grandchild of Root");
//   myMindMap.print();
// }
