import { MindMap, Node } from "./mindmap";

class VisualMindMap {
  private container: HTMLElement;
  private mindMap: MindMap;

  constructor(container: HTMLElement, mindMap: MindMap) {
    this.container = container;
    this.mindMap = mindMap;
    // Ensure the container is positioned relative so we can use absolute positioning for nodes.
    this.container.style.position = "relative";
  }

  // Public method to render the entire mind map.
  public render(): void {
    // Clear the container.
    this.container.innerHTML = "";
    // Calculate positions for each node (using a simple layout algorithm).
    this.layout(this.mindMap.root, this.container.clientWidth / 2, 20, this.container.clientWidth / 4);
    // Render nodes (and connecting lines).
    this.renderNode(this.mindMap.root);
  }

  // A very simple tree layout: position the node at (x, y) and recursively arrange its children.
  private layout(node: Node, x: number, y: number, offset: number): void {
    // Attach layout coordinates to the node (using a type assertion to extend Node).
    (node as any).x = x;
    (node as any).y = y;
    // For simplicity, each level is 100px below the previous one.
    const childrenCount = node.children.length;
    if (childrenCount === 0) return;
    // Calculate starting x for children so they are centered below the parent.
    let startX = x - offset * (childrenCount - 1) / 2;
    for (let child of node.children) {
      // Recursively position each child.
      this.layout(child, startX, y + 100, offset / childrenCount);
      startX += offset;
    }
  }

  // Render a node and its children as DOM elements.
  private renderNode(node: Node): void {
    // Create a div element for the node.
    const nodeDiv = document.createElement("div");
    nodeDiv.innerText = node.label;
    nodeDiv.style.position = "absolute";
    // Assume each node is 80px wide and 30px tall.
    // Adjust the position so that the node is centered on its (x, y) coordinate.
    nodeDiv.style.left = ((node as any).x - 40) + "px";
    nodeDiv.style.top = (node as any).y + "px";
    nodeDiv.style.width = "80px";
    nodeDiv.style.height = "30px";
    nodeDiv.style.backgroundColor = "#fff";
    nodeDiv.style.border = "1px solid #000";
    nodeDiv.style.textAlign = "center";
    nodeDiv.style.lineHeight = "30px";
    // Append the node div to the container.
    this.container.appendChild(nodeDiv);

    // Draw lines from this node to each child.
    for (let child of node.children) {
      this.drawLine(node, child);
      // Recursively render child nodes.
      this.renderNode(child);
    }
  }

  // Draw a simple line between two nodes using a rotated div.
  private drawLine(parent: Node, child: Node): void {
    const line = document.createElement("div");
    line.style.position = "absolute";
    // Compute the center coordinates of parent and child nodes.
    const x1 = (parent as any).x;
    const y1 = (parent as any).y + 15; // 15 is half of the node's height
    const x2 = (child as any).x;
    const y2 = (child as any).y + 15;
    // Calculate the distance and angle between the two points.
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    // Set the line's style.
    line.style.width = length + "px";
    line.style.height = "2px";
    line.style.backgroundColor = "#000";
    line.style.left = x1 + "px";
    line.style.top = y1 + "px";
    // Rotate the line to the proper angle.
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = "0 0";
    // Append the line to the container.
    this.container.appendChild(line);
  }
}

export { VisualMindMap };
