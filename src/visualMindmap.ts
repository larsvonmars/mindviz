/* 
  Usage Instructions:
  -------------------
  This file exports the VisualMindMap class, which provides a visual representation 
  of a MindMap on an HTML container.
  
  Basic Usage:
    - Instantiate VisualMindMap by passing a container HTMLElement and a MindMap instance.
    - Call render() to display the mind map.
    - Use setCanvasSize to adjust the drawing area.
    - Use the export SVG functionality to receive an SVG output.
  
  Using with React:
    - Import VisualMindMap into your component.
    - Use the static method fromReactRef(ref, mindMap) to create an instance with 
      a React ref pointing to a container div.
    - Manage the instance within component lifecycle methods (e.g., useEffect, useRef).
*/

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
  // NEW: Properties for infinite canvas
  private canvasSize = { width: 100000, height: 100000 };
  private virtualCenter = { x: 50000, y: 50000 };

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
        width: `${this.canvasSize.width}px`,
        height: `${this.canvasSize.height}px`,
        transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        willChange: "transform"
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
// NEW: Always center on the root node on loading:
    const containerCenterX = container.clientWidth / 2;
    const containerCenterY = container.clientHeight / 2;
    this.offsetX = containerCenterX - this.virtualCenter.x;
    this.offsetY = containerCenterY - this.virtualCenter.y;
    this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;

    // NEW: Add a "Re-center" sticky button at top right of the container.
    const recenterButton = document.createElement("button");
    recenterButton.textContent = "Re-center";
    Object.assign(recenterButton.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      padding: "8px 12px",
      background: "#4dabf7",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      zIndex: "100000"
    });
    recenterButton.addEventListener("click", () => {
      const containerCenterX = container.clientWidth / 2;
      const containerCenterY = container.clientHeight / 2;
      this.offsetX = containerCenterX - this.virtualCenter.x;
      this.offsetY = containerCenterY - this.virtualCenter.y;
      this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
    });
    container.appendChild(recenterButton);

    // NEW: Add Export SVG button
    const exportButton = document.createElement("button");
    exportButton.textContent = "Export SVG";
    Object.assign(exportButton.style, {
      position: "absolute",
      top: "10px",
      right: "100px",
      padding: "8px 12px",
      background: "#4dabf7",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      zIndex: "100000"
    });
    exportButton.addEventListener("click", () => this.exportAsSVG());
    container.appendChild(exportButton);
  }

  // Updated static constructor for React usage.
  // Use this method with a React ref to a container div:
  //   const visualMindMap = VisualMindMap.fromReactRef(containerRef, mindMap);
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
    this.radialLayout(this.mindMap.root, this.virtualCenter.x, this.virtualCenter.y, 0, 0, 2 * Math.PI);
    // Render nodes (and connecting lines).
    this.renderNode(this.mindMap.root);
    this.autoExpandCanvas();
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
      this.selectNode(e, nodeDiv); // updated to pass the event
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

  // Modified selectNode method for centered action buttons under the node.
  private selectNode(e: MouseEvent, nodeDiv: HTMLDivElement): void {
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

    // Calculate the node's position using its style and dimensions.
    const nodeLeft = parseFloat(nodeDiv.style.left);
    const nodeTop = parseFloat(nodeDiv.style.top);
    const nodeWidth = nodeDiv.offsetWidth;
    const nodeHeight = nodeDiv.offsetHeight;

    // Position the action buttons centered under the node.
    const buttonLeft = nodeLeft + nodeWidth / 2;
    const buttonTop = nodeTop + nodeHeight + 8; // 8px padding

    Object.assign(actionDiv.style, {
      left: `${buttonLeft}px`,
      top: `${buttonTop}px`,
      transform: "translateX(-50%)"
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
      button.addEventListener("mouseover", () => { button.style.background = "#f8f9fa"; });
      button.addEventListener("mouseout", () => { button.style.background = "none"; });
      button.addEventListener("click", clickHandler);
      return button;
    };

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
    const editButton = createButton("Edit Style", async (e) => {
      e.stopPropagation();
      const nodeId = parseInt(nodeDiv.dataset.nodeId!);
      const defaultText = nodeDiv.innerText;
      const defaultBg = nodeDiv.style.background;
      const result = await this.showStyleModal(defaultText, defaultBg);
      if (result) {
        this.mindMap.updateNode(nodeId, result.text);
        this.updateNodeBackground(nodeId, result.background);
        this.render();
      }
    });

    actionDiv.append(addButton, deleteButton, editButton);
    this.canvas.appendChild(actionDiv);
    this.currentActionButtons = actionDiv;
  }

  // New method: unified modal for editing text and styles with a color picker.
  private async showStyleModal(defaultText: string, defaultBg: string): Promise<{text: string, background: string} | null> {
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

      // Text Input Group
      const textGroup = document.createElement("div");
      textGroup.innerHTML = `
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
          Node Text
        </label>
        <input type="text" style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #dee2e6; border-radius: 4px;" value="${defaultText}">
      `;
      const textInput = textGroup.querySelector('input')!;

      // Color Picker Group
      const colorGroup = document.createElement("div");
      colorGroup.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: 500;">
          Node Background
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <input type="color" style="width: 50px; height: 36px;" value="${this.extractSolidColor(defaultBg) || '#ffffff'}">
          <input type="text" style="flex: 1; padding: 8px; border: 1px solid #dee2e6; border-radius: 4px;" placeholder="CSS background value" value="${defaultBg}">
        </div>
      `;
      const colorInput = colorGroup.querySelector('input[type="color"]') as HTMLInputElement;
      const bgInput = colorGroup.querySelector('input[type="text"]') as HTMLInputElement;

      // Sync color inputs
      colorInput.addEventListener('input', () => bgInput.value = colorInput.value);
      bgInput.addEventListener('input', () => {
        if (this.isValidColor(bgInput.value)) {
          colorInput.value = this.extractSolidColor(bgInput.value) || '#ffffff';
        }
      });

      // Button Group
      const buttonGroup = document.createElement("div");
      buttonGroup.style.display = "flex";
      buttonGroup.style.gap = "8px";
      buttonGroup.style.justifyContent = "flex-end";
      
      const cancelButton = document.createElement("button");
      Object.assign(cancelButton, {
        textContent: "Cancel",
        style: {
          padding: "8px 16px",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          background: "none",
          cursor: "pointer"
        }
      });
      
      const saveButton = document.createElement("button");
      Object.assign(saveButton, {
        textContent: "Save",
        style: {
          padding: "8px 16px",
          border: "none",
          borderRadius: "4px",
          background: "#4dabf7",
          color: "white",
          cursor: "pointer"
        }
      });

      cancelButton.addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
        resolve(null);
      });
      saveButton.addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
        resolve({
          text: textInput.value,
          background: bgInput.value
        });
      });

      buttonGroup.append(cancelButton, saveButton);
      modal.append(textGroup, colorGroup, buttonGroup);
      modalOverlay.appendChild(modal);
      document.body.appendChild(modalOverlay);
    });
  }

  // New helper method to extract a solid color from a CSS background value.
  private extractSolidColor(bg: string): string | null {
    const match = bg.match(/#[0-9a-f]{3,6}|rgb(a?)\([^)]+\)/i);
    return match ? match[0] : null;
  }

  // New helper method to validate CSS color values.
  private isValidColor(value: string): boolean {
    const style = new Option().style;
    style.backgroundColor = value;
    return style.backgroundColor !== '';
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

  // NEW: Method to automatically expand the canvas when nodes approach boundaries.
  private autoExpandCanvas(): void {
    const buffer = 2000; // Expansion buffer in pixels
    const nodes = this.canvas.querySelectorAll<HTMLDivElement>('[data-node-id]');
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      const x = parseFloat(node.style.left);
      const y = parseFloat(node.style.top);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    
    // Determine if we need to expand canvas
    const shouldExpand = {
      left: minX < buffer,
      right: maxX > this.canvasSize.width - buffer,
      top: minY < buffer,
      bottom: maxY > this.canvasSize.height - buffer
    };
    
    const newWidth = (shouldExpand.left || shouldExpand.right) ? this.canvasSize.width * 2 : this.canvasSize.width;
    const newHeight = (shouldExpand.top || shouldExpand.bottom) ? this.canvasSize.height * 2 : this.canvasSize.height;
    
    if (newWidth !== this.canvasSize.width || newHeight !== this.canvasSize.height) {
      // Adjust offsets to maintain visual position
      const widthDiff = newWidth - this.canvasSize.width;
      const heightDiff = newHeight - this.canvasSize.height;
      if (shouldExpand.right) this.offsetX -= widthDiff;
      if (shouldExpand.bottom) this.offsetY -= heightDiff;
      
      this.canvasSize = { width: newWidth, height: newHeight };
      this.canvas.style.width = `${newWidth}px`;
      this.canvas.style.height = `${newHeight}px`;
      this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
    }
  }

  // NEW: Method to export the mindmap as an SVG file.
  private exportAsSVG(): void {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const nodes = this.getAllNodes();
    const { minX, minY, maxX, maxY } = this.calculateBoundingBox(nodes);
    const padding = 50;
    
    svg.setAttribute("viewBox", `${minX - padding} ${minY - padding} ${maxX - minX + 2*padding} ${maxY - minY + 2*padding}`);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Draw connections
    nodes.forEach(node => {
      node.children.forEach(child => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String((node as any).x));
        line.setAttribute("y1", String((node as any).y + 15));
        line.setAttribute("x2", String((child as any).x));
        line.setAttribute("y2", String((child as any).y - 15));
        line.setAttribute("stroke", "#ced4da");
        line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      
      // Calculate text width approximation
      const textWidth = node.label.length * 8;
      const textHeight = 20;

      rect.setAttribute("x", String((node as any).x - textWidth/2));
      rect.setAttribute("y", String((node as any).y - textHeight/2));
      rect.setAttribute("width", String(textWidth));
      rect.setAttribute("height", String(textHeight));
      rect.setAttribute("rx", "8");
      rect.setAttribute("fill", (node as any).background || "#ffffff");
      rect.setAttribute("stroke", "#dee2e6");
      rect.setAttribute("stroke-width", "1");

      text.setAttribute("x", String((node as any).x));
      text.setAttribute("y", String((node as any).y + 5));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-family", "Arial, sans-serif");
      text.setAttribute("font-size", "16px");
      text.setAttribute("fill", "#212529");
      text.textContent = node.label;

      group.appendChild(rect);
      group.appendChild(text);
      svg.appendChild(group);
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindmap-${new Date().getTime()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // NEW: Helper method to get all nodes in the mindmap.
  private getAllNodes(): Node[] {
    const nodes: Node[] = [];
    const traverse = (node: Node) => {
      nodes.push(node);
      node.children.forEach(child => traverse(child));
    };
    traverse(this.mindMap.root);
    return nodes;
  }

  // NEW: Helper method to calculate the bounding box for all nodes.
  private calculateBoundingBox(nodes: Node[]): { minX: number, minY: number, maxX: number, maxY: number } {
    return nodes.reduce((acc, node) => ({
      minX: Math.min(acc.minX, (node as any).x),
      minY: Math.min(acc.minY, (node as any).y),
      maxX: Math.max(acc.maxX, (node as any).x),
      maxY: Math.max(acc.maxY, (node as any).y)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  }

  // Public method to export mindmap data as JSON
  public toJSON(): string {
    return JSON.stringify({
      root: this.serializeNode(this.mindMap.root),
      canvasSize: this.canvasSize,
      virtualCenter: this.virtualCenter,
      version: "1.0"
    }, null, 2);
  }

  // Public method to import mindmap data from JSON
  public fromJSON(jsonData: string): void {
    const data = JSON.parse(jsonData);
    this.validateMindMapData(data);
    this.mindMap = this.deserializeNodes(data);
    this.canvasSize = data.canvasSize;
    this.virtualCenter = data.virtualCenter;
    this.render();
  }

  // Private helper to serialize a node recursively
  private serializeNode(node: Node): any {
    return {
      id: node.id,
      label: node.label,
      x: (node as any).x,
      y: (node as any).y,
      background: (node as any).background || "#ffffff",
      children: node.children.map(child => this.serializeNode(child))
    };
  }

  // Private helper to deserialize nodes and build a new MindMap
  private deserializeNodes(data: any): MindMap {
    let idCounter = 0;
    const deserializeNode = (nodeData: any): Node => {
      const newNode = new Node(idCounter++, nodeData.label);
      (newNode as any).x = nodeData.x;
      (newNode as any).y = nodeData.y;
      (newNode as any).background = nodeData.background;
      nodeData.children?.forEach((childData: any) => {
        newNode.addChild(deserializeNode(childData));
      });
      return newNode;
    };
    idCounter = 0; // Reset counter for new import
    return new MindMap(deserializeNode(data.root));
  }

  // Private helper to validate imported mindmap data
  private validateMindMapData(data: any): void {
    if (!data.root) throw new Error("Invalid mindmap data: missing root node");
    if (!data.canvasSize) throw new Error("Invalid mindmap data: missing canvas size");
    if (!data.virtualCenter) throw new Error("Invalid mindmap data: missing virtual center");
  }
}

export { VisualMindMap };
