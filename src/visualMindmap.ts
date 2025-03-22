import { MindMap, Node } from "./mindmap";
import React from "react";

class VisualMindMap {
  private container: HTMLElement;
  private mindMap: MindMap;
  private selectedNodeDiv: HTMLDivElement | null = null; // new property for selection

  // Constants for layout
  private readonly NODE_WIDTH = 80;
  private readonly HORIZONTAL_GAP = 20;
  private readonly VERTICAL_GAP = 100;

  constructor(container: HTMLElement, mindMap: MindMap) {
    this.container = container;
    this.mindMap = mindMap;
    // Ensure the container is positioned relative so we can use absolute positioning for nodes.
    this.container.style.position = "relative";
  }

  // Updated static constructor for React usage.
  public static fromReactRef(
    containerRef: React.RefObject<HTMLDivElement>, 
    mindMap: MindMap
  ): VisualMindMap {
    if (!containerRef.current) {
      throw new Error("Container ref is not assigned");
    }
    return new VisualMindMap(containerRef.current, mindMap);
  }

  // Updated render method to use the new layout.
  public render(): void {
    // Clear the container.
    this.container.innerHTML = "";
    // Start by positioning the root at the container's horizontal center.
    this.layout(this.mindMap.root, this.container.clientWidth / 2, 20);
    // Render nodes (and connecting lines).
    this.renderNode(this.mindMap.root);
  }

  // New helper to compute the required width for a node's subtree.
  private computeSubtreeWidth(node: Node): number {
    if (node.children.length === 0) return this.NODE_WIDTH;
    let total = 0;
    for (let child of node.children) {
      total += this.computeSubtreeWidth(child);
    }
    return total + this.HORIZONTAL_GAP * (node.children.length - 1);
  }

  // Updated layout method: positions node at (x, y) and arranges children using their subtree widths.
  private layout(node: Node, x: number, y: number): void {
    // Assign position for the current node.
    (node as any).x = x;
    (node as any).y = y;
    if (node.children.length === 0) return;
    // Compute total width needed for children.
    const totalWidth = node.children.reduce((acc, child) => 
      acc + this.computeSubtreeWidth(child), 0) +
      this.HORIZONTAL_GAP * (node.children.length - 1);
    // Starting x so that children group is centered under the parent.
    let currentX = x - totalWidth / 2;
    for (let child of node.children) {
      const childSubtreeWidth = this.computeSubtreeWidth(child);
      // Center of child's subtree.
      const childX = currentX + childSubtreeWidth / 2;
      this.layout(child, childX, y + this.VERTICAL_GAP);
      currentX += childSubtreeWidth + this.HORIZONTAL_GAP;
    }
  }

  // Render a node and its children as DOM elements.
  private renderNode(node: Node): void {
    // Create a div element for the node.
    const nodeDiv = document.createElement("div");
    nodeDiv.innerText = node.label;
    nodeDiv.style.position = "absolute";
    // Positioning the node.
    nodeDiv.style.left = ((node as any).x - 40) + "px";
    nodeDiv.style.top = (node as any).y + "px";
    nodeDiv.style.width = "80px";
    nodeDiv.style.height = "30px";
    
    // Improved styling:
    nodeDiv.style.background = "linear-gradient(to bottom right, #e0f7fa, #ffffff)";
    nodeDiv.style.border = "1px solid #444";
    nodeDiv.style.borderRadius = "8px";
    nodeDiv.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
    nodeDiv.style.textAlign = "center";
    nodeDiv.style.lineHeight = "30px";
    nodeDiv.style.fontFamily = "Arial, sans-serif";
    nodeDiv.style.fontSize = "14px";
    nodeDiv.style.cursor = "pointer";
    // Add hover effect for a subtle scale change.
    nodeDiv.addEventListener("mouseover", () => {
      nodeDiv.style.transform = "scale(1.05)";
    });
    nodeDiv.addEventListener("mouseout", () => {
      nodeDiv.style.transform = "scale(1)";
    });
    
    // Add click event listener for node selection.
    nodeDiv.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectNode(nodeDiv);
    });
    // Append the node div to the container.
    this.container.appendChild(nodeDiv);
    
    // Draw lines from this node to each child.
    for (let child of node.children) {
      this.drawLine(node, child);
      // Recursively render child nodes.
      this.renderNode(child);
    }
  }

  // New helper method for selecting a node.
  private selectNode(nodeDiv: HTMLDivElement): void {
    // Deselect previous node if any.
    if (this.selectedNodeDiv) {
      this.selectedNodeDiv.style.border = "1px solid #000";
    }
    // Highlight the clicked node.
    nodeDiv.style.border = "2px solid blue";
    this.selectedNodeDiv = nodeDiv;
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
