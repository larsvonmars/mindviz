import { MindMap, Node } from "./mindmap";
import React from "react";

class VisualMindMap {
  private container: HTMLElement;
  private mindMap: MindMap;
  private selectedNodeDiv: HTMLDivElement | null = null; // new property for selection
  private currentActionButtons: HTMLDivElement | null = null; // new property for action buttons
  private canvas: HTMLDivElement; // new inner canvas for panning
  private offsetX: number = 0; // panning offset X
  private offsetY: number = 0; // panning offset Y

  // Constants for layout
  private readonly NODE_WIDTH = 80;
  private readonly HORIZONTAL_GAP = 20;
  private readonly VERTICAL_GAP = 100;

  constructor(container: HTMLElement, mindMap: MindMap) {
    // Container styling
    if (!container.style.width) container.style.width = "800px";
    if (!container.style.height) container.style.height = "600px";
    Object.assign(container.style, {
        border: "1px solid #e0e0e0",
        overflow: "hidden",
        cursor: "grab",
        position: "relative",
        backgroundColor: "#f8f9fa"
    });

    this.container = container;
    this.mindMap = mindMap;
    
    // Canvas styling
    this.canvas = document.createElement("div");
    Object.assign(this.canvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "1600px",
        height: "1200px",
        transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    });
    container.appendChild(this.canvas);

    // Add panning event listeners on the container.
    let isPanning = false, startX = 0, startY = 0;
    container.addEventListener("mousedown", (e) => {
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      container.style.cursor = "grabbing";
    });
    document.addEventListener("mousemove", (e) => {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
      startX = e.clientX;
      startY = e.clientY;
    });
    document.addEventListener("mouseup", () => {
      isPanning = false;
      container.style.cursor = "grab";
    });
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
    // Clear the canvas instead of the container.
    this.canvas.innerHTML = "";
    const centerX = this.canvas.clientWidth / 2;
    const centerY = this.canvas.clientHeight / 2;
    // Apply radial layout with full circle for the root.
    this.radialLayout(this.mindMap.root, centerX, centerY, 0, 0, 2 * Math.PI);
    // Render nodes (and connecting lines).
    this.renderNode(this.mindMap.root);
  }

  // New radial layout method: positions node using polar coordinates.
  private radialLayout(node: Node, centerX: number, centerY: number, depth: number, minAngle: number, maxAngle: number): void {
    if (depth === 0) {
      (node as any).x = centerX;
      (node as any).y = centerY;
    } else {
      const radius = this.VERTICAL_GAP * depth; // radial gap
      const angle = (minAngle + maxAngle) / 2;
      (node as any).x = centerX + radius * Math.cos(angle);
      (node as any).y = centerY + radius * Math.sin(angle);
    }
    if (node.children.length === 0) return;
    const angleStep = (maxAngle - minAngle) / node.children.length;
    let currentAngle = minAngle;
    for (let child of node.children) {
      this.radialLayout(child, centerX, centerY, depth + 1, currentAngle, currentAngle + angleStep);
      currentAngle += angleStep;
    }
  }

  // Render a node and its children as DOM elements.
  private renderNode(node: Node): void {
    const nodeDiv = document.createElement("div");
    nodeDiv.innerText = node.label;
    nodeDiv.dataset.nodeId = node.id.toString();
    Object.assign(nodeDiv.style, {
        position: "absolute",
        left: `${(node as any).x}px`,
        top: `${(node as any).y}px`,
        padding: "8px 16px",
        display: "inline-block",
        whiteSpace: "nowrap",
        zIndex: "1",
        background: (node as any).background || "#ffffff",
        border: "1px solid #dee2e6",
        borderRadius: "12px",
        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.1)",
        fontSize: "16px",
        fontWeight: "500",
        color: "#212529",
        cursor: "pointer",
        transition: "all 0.2s ease"
    });
    nodeDiv.addEventListener("mouseover", () => {
        nodeDiv.style.transform = "translateY(-2px)";
        nodeDiv.style.boxShadow = "0 5px 12px rgba(0, 0, 0, 0.15)";
    });
    nodeDiv.addEventListener("mouseout", () => {
        nodeDiv.style.transform = "translateY(0)";
        nodeDiv.style.boxShadow = "0 3px 6px rgba(0, 0, 0, 0.1)";
    });
    // Add click event listener for node selection.
    nodeDiv.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectNode(nodeDiv);
    });
    // Append the node div to the canvas.
    this.canvas.appendChild(nodeDiv);
    // Adjust left to center the node based on its dynamic width.
    const nodeWidth = nodeDiv.offsetWidth;
    nodeDiv.style.left = ((node as any).x - nodeWidth / 2) + "px";
    
    // Draw lines from this node to each child.
    for (let child of node.children) {
      this.drawLine(node, child);
      // Recursively render child nodes.
      this.renderNode(child);
    }
  }

  // New helper method to get SVG icons for buttons
  private getIconForAction(action: string): string {
    const icons = {
        'Add Child': '<path d="M12 5v14M5 12h14"/>',
        'Delete Node': '<path d="M19 6L5 18M5 6l14 12"/>',
        'Edit Node': '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
        'Node Style': '<path d="M3 16l7-7 2 2 5-5m-2-1l2 2m-13 7l2 2M3 6c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>'
    };
    return icons[action as keyof typeof icons] || '';
  }

  // New helper method for selecting a node.
  private selectNode(nodeDiv: HTMLDivElement): void {
    // Deselect previous node if any.
    if (this.selectedNodeDiv) {
        this.selectedNodeDiv.style.border = "1px solid #dee2e6";
    }
    nodeDiv.style.border = "2px solid #4dabf7";
    this.selectedNodeDiv = nodeDiv;

    if (this.currentActionButtons) this.currentActionButtons.remove();

    const actionDiv = document.createElement("div");
    Object.assign(actionDiv.style, {
        position: "absolute",
        background: "#ffffff",
        border: "1px solid #e9ecef",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: "10000",
        minWidth: "160px",
        overflow: "hidden"
    });

    const createButton = (text: string, clickHandler: (e: MouseEvent) => void) => {
        const button = document.createElement("button");
        Object.assign(button.style, {
            width: "100%",
            padding: "8px 16px",
            border: "none",
            background: "none",
            textAlign: "left",
            fontSize: "14px",
            color: "#495057",
            cursor: "pointer",
            transition: "background 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        });
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              ${this.getIconForAction(text)}
            </svg>
            ${text}
        `;
        button.addEventListener("mouseover", () => {
            button.style.background = "#f8f9fa";
        });
        button.addEventListener("mouseout", () => {
            button.style.background = "none";
        });
        button.addEventListener("click", clickHandler);
        return button;
    };

    // Create buttons with existing event handlers
    const addButton = createButton("Add Child", async (e) => {
        e.stopPropagation();
        const nodeId = parseInt(nodeDiv.dataset.nodeId!);
        const newLabel = await this.showModal("Enter label for new child node:");
        if (newLabel) {
            this.mindMap.addNode(nodeId, newLabel);
            this.render();
        }
    });
    const deleteButton = createButton("Delete Node", (e) => {
        e.stopPropagation();
        const nodeId = parseInt(nodeDiv.dataset.nodeId!);
        try {
            this.mindMap.deleteNode(nodeId);
            this.render();
        } catch (err) {
            alert(err);
        }
    });
    const editButton = createButton("Edit Node", async (e) => {
        e.stopPropagation();
        const nodeId = parseInt(nodeDiv.dataset.nodeId!);
        const defaultText = nodeDiv.innerText;
        const defaultBg = nodeDiv.style.background;
        const result = await this.showEditModal(defaultText, defaultBg);
        if (result) {
            if(result.text) {
                this.mindMap.updateNode(nodeId, result.text);
            }
            if(result.background !== undefined) {
                this.updateNodeBackground(nodeId, result.background);
            }
            this.render();
        }
    });
    const styleButton = createButton("Node Style", async (e) => {
        e.stopPropagation();
        const nodeId = parseInt(nodeDiv.dataset.nodeId!);
        const currentBg = nodeDiv.style.background;
        const newStyle = await this.showModal("Enter CSS styles for node:", currentBg);
        if (newStyle !== null) {
            this.updateNodeBackground(nodeId, newStyle);
            this.render();
        }
    });

    actionDiv.append(addButton, deleteButton, editButton, styleButton);
    this.canvas.appendChild(actionDiv);
    this.currentActionButtons = actionDiv;

    const nodeRect = nodeDiv.getBoundingClientRect();
    Object.assign(actionDiv.style, {
        left: `${nodeRect.left + nodeRect.width / 2}px`,
        top: `${nodeRect.bottom + 8}px`
    });
  }

  // NEW: New modal that combines editing text and background in one modal.
  private showEditModal(defaultText: string, defaultBg: string): Promise<{text: string, background: string} | null> {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement("div");
        Object.assign(modalOverlay.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "10000"
        });

        const modal = document.createElement("div");
        Object.assign(modal.style, {
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            minWidth: "320px"
        });

        const textPrompt = document.createElement("div");
        textPrompt.innerText = "Enter new text for the node:";
        textPrompt.style.marginBottom = "5px";
        modal.appendChild(textPrompt);
        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.value = defaultText;
        textInput.style.width = "100%";
        textInput.style.marginBottom = "10px";
        modal.appendChild(textInput);

        const bgPrompt = document.createElement("div");
        bgPrompt.innerText = "Enter background CSS for the node:";
        bgPrompt.style.marginBottom = "5px";
        modal.appendChild(bgPrompt);
        const bgInput = document.createElement("input");
        bgInput.type = "text";
        bgInput.value = defaultBg;
        bgInput.style.width = "100%";
        bgInput.style.marginBottom = "10px";
        modal.appendChild(bgInput);

        const buttonContainer = document.createElement("div");
        const okButton = document.createElement("button");
        okButton.innerText = "OK";
        okButton.style.marginRight = "10px";
        const cancelButton = document.createElement("button");
        cancelButton.innerText = "Cancel";
        buttonContainer.appendChild(okButton);
        buttonContainer.appendChild(cancelButton);
        modal.appendChild(buttonContainer);

        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);

        okButton.addEventListener("click", () => {
            const result = {text: textInput.value, background: bgInput.value};
            document.body.removeChild(modalOverlay);
            resolve(result);
        });
        cancelButton.addEventListener("click", () => {
            document.body.removeChild(modalOverlay);
            resolve(null);
        });
    });
  }

  // NEW: Helper method to update a node's background by traversing the tree.
  private updateNodeBackground(nodeId: number, background: string): boolean {
    function traverse(node: any): boolean {
      if (node.id === nodeId) {
        node.background = background;
        return true;
      }
      for (let child of node.children) {
        if (traverse(child)) return true;
      }
      return false;
    }
    return traverse(this.mindMap.root);
  }

  // NEW: Custom modal to replace browser prompt
  private showModal(promptText: string, defaultText: string = ""): Promise<string | null> {
    // If in test mode, bypass the modal and return the preset reply.
    if ((window as any).__TEST_MODE__) {
      return Promise.resolve((window as any).__TEST_PROMPT_REPLY__ || null);
    }
    return new Promise((resolve) => {
      const modalOverlay = document.createElement("div");
      Object.assign(modalOverlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "10000" // highest z-index for modal overlay
      });

      const modalContainer = document.createElement("div");
      Object.assign(modalContainer.style, {
        background: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        minWidth: "200px",
        zIndex: "10001" // above modal overlay
      });

      const promptEl = document.createElement("div");
      promptEl.innerText = promptText;
      promptEl.style.marginBottom = "10px";
      modalContainer.appendChild(promptEl);

      const inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.value = defaultText;
      inputEl.style.width = "100%";
      inputEl.style.marginBottom = "10px";
      modalContainer.appendChild(inputEl);

      const buttonContainer = document.createElement("div");
      const okButton = document.createElement("button");
      okButton.innerText = "OK";
      okButton.style.marginRight = "10px";
      const cancelButton = document.createElement("button");
      cancelButton.innerText = "Cancel";
      buttonContainer.appendChild(okButton);
      buttonContainer.appendChild(cancelButton);
      modalContainer.appendChild(buttonContainer);

      modalOverlay.appendChild(modalContainer);
      document.body.appendChild(modalOverlay);

      okButton.addEventListener("click", () => {
        const value = inputEl.value;
        document.body.removeChild(modalOverlay);
        resolve(value);
      });
      cancelButton.addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
        resolve(null);
      });
    });
  }

  // Draw a simple line between two nodes using a rotated div.
  private drawLine(parent: Node, child: Node): void {
    const line = document.createElement("div");
    Object.assign(line.style, {
        position: "absolute",
        zIndex: "0",
        background: "#ced4da",
        height: "2px",
        transformOrigin: "0 0"
    });
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
    line.style.left = x1 + "px";
    line.style.top = y1 + "px";
    // Rotate the line to the proper angle.
    line.style.transform = `rotate(${angle}deg)`;
    // Append the line to the canvas.
    this.canvas.appendChild(line);
  }

  // New method to allow users to set a custom canvas size.
  public setCanvasSize(width: string, height: string): void {
    this.canvas.style.width = width;
    this.canvas.style.height = height;
  }
}

export { VisualMindMap };
