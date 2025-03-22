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

import { MindMap, MindNode } from "./mindmap";
import React from "react";

class VisualMindMap {
  private container: HTMLElement;
  private mindMap: MindMap;
  private selectedMindNodeDiv: HTMLDivElement | null = null; // new property for selection
  private currentActionButtons: HTMLDivElement | null = null; // new property for action buttons
  private canvas: HTMLDivElement; // new inner canvas for panning
  private offsetX: number = 0; // panning offset X
  private offsetY: number = 0; // panning offset Y
  // NEW: Properties for infinite canvas
  private canvasSize = { width: 100000, height: 100000 };
  private virtualCenter = { x: 50000, y: 50000 };
  private zoomLevel: number = 1;
  private currentLayout: 'radial' | 'tree' = 'radial';
  // NEW: Flag to toggle dragging mode
  private draggingMode: boolean = false;

  // Constants for layout
  private readonly MindNode_WIDTH = 80;
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
    
    // Create modern toolbar
    const toolbar = document.createElement("div");
    Object.assign(toolbar.style, {
      position: "absolute",
      top: "0",
      left: "0",
      right: "0",
      height: "50px",
      background: "#fff",
      borderBottom: "1px solid #f0f0f0",
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      gap: "16px",
      zIndex: "1100",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    });
    container.appendChild(toolbar);
    
    // Updated modern button style
    const buttonStyle = {
      padding: "8px 16px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "4px",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      fontSize: "14px",
      color: "#333"
    };

    const createButton = (text: string, onClick: () => void) => {
      const button = document.createElement("button");
      button.textContent = text;
      Object.assign(button.style, buttonStyle);
      button.addEventListener("click", onClick);
      button.addEventListener("mouseover", () => {
        button.style.boxShadow = "0 3px 6px rgba(0,0,0,0.15)";
        button.style.transform = "translateY(-1px)";
      });
      button.addEventListener("mouseout", () => {
        button.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        button.style.transform = "translateY(0)";
      });
      return button;
    };

    // Toolbar buttons
    toolbar.appendChild(createButton("Re-center", () => {
      const containerCenterX = container.clientWidth / 2;
      const containerCenterY = container.clientHeight / 2;
      this.offsetX = (containerCenterX / this.zoomLevel) - this.virtualCenter.x;
      this.offsetY = (containerCenterY / this.zoomLevel) - this.virtualCenter.y;
      this.updateCanvasTransform();
    }));

    toolbar.appendChild(createButton("Export SVG", () => this.exportAsSVG()));

    toolbar.appendChild(createButton("Clear All", () => {
      this.mindMap.root.children = [];
      this.render();
    }));

    const layoutSelect = document.createElement("select");
    Object.assign(layoutSelect.style, {
      padding: "8px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
      color: "#333"
    });
    layoutSelect.innerHTML = `
      <option value="radial">Radial</option>
      <option value="tree">Tree</option>
    `;
    layoutSelect.addEventListener("change", () => {
      this.currentLayout = layoutSelect.value as 'radial' | 'tree';
      this.render();
    });
    toolbar.appendChild(layoutSelect);

    const zoomContainer = document.createElement("div");
    Object.assign(zoomContainer.style, {
      display: "flex",
      gap: "8px",
      marginLeft: "auto"
    });
    const zoomOutButton = createButton("-", () => this.setZoom(this.zoomLevel / 1.2));
    const zoomInButton = createButton("+", () => this.setZoom(this.zoomLevel * 1.2));
    zoomContainer.append(zoomOutButton, zoomInButton);
    toolbar.appendChild(zoomContainer);

    // NEW: Dragging Mode button in toolbar
    const draggingModeButton = createButton("Dragging Mode OFF", () => {
      this.draggingMode = !this.draggingMode;
      draggingModeButton.textContent = this.draggingMode ? "Dragging Mode ON" : "Dragging Mode OFF";
      // Update container cursor based on mode
      this.container.style.cursor = this.draggingMode ? "default" : "grab";
    });
    toolbar.appendChild(draggingModeButton);

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

    // NEW: Panning event listeners (disabled when dragging mode is enabled)
    let isPanning = false, startX = 0, startY = 0;
    container.addEventListener("mousedown", (e) => {
      if (this.draggingMode) return;
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      container.style.cursor = "grabbing";
    });
    document.addEventListener("mousemove", (e) => {
      if (this.draggingMode || !isPanning) return;
      const dx = (e.clientX - startX) / this.zoomLevel;
      const dy = (e.clientY - startY) / this.zoomLevel;
      this.offsetX += dx;
      this.offsetY += dy;
      this.updateCanvasTransform();
      startX = e.clientX;
      startY = e.clientY;
    });
    document.addEventListener("mouseup", () => {
      if (this.draggingMode) return;
      isPanning = false;
      container.style.cursor = "grab";
    });
// NEW: Always center on the root MindNode on loading:
    const containerCenterX = container.clientWidth / 2;
    const containerCenterY = container.clientHeight / 2;
    this.offsetX = containerCenterX - this.virtualCenter.x * this.zoomLevel;
    this.offsetY = containerCenterY - this.virtualCenter.y * this.zoomLevel;
    this.updateCanvasTransform();

    this.enableFreeformDragging();
    
    
  }

  private setZoom(newZoom: number) {
    this.zoomLevel = Math.min(Math.max(newZoom, 0.2), 3);
    this.updateCanvasTransform();
  }

  private updateCanvasTransform() {
    this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
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
    
    if (this.currentLayout === 'radial') {
      this.radialLayout(this.mindMap.root, this.virtualCenter.x, this.virtualCenter.y, 0, 0, 2 * Math.PI);
    } else {
      this.treeLayout(this.mindMap.root, this.virtualCenter.x, this.virtualCenter.y);
    }
    this.renderMindNode(this.mindMap.root);
    this.autoExpandCanvas();
  }

  // New radial layout method: positions MindNode using polar coordinates.
  private radialLayout(MindNode: MindNode, centerX: number, centerY: number, depth: number, minAngle: number, maxAngle: number): void {
    if (depth === 0) {
      (MindNode as any).x = centerX;
      (MindNode as any).y = centerY;
    } else {
      const radius = this.VERTICAL_GAP * depth; // radial gap
      const angle = (minAngle + maxAngle) / 2;
      (MindNode as any).x = centerX + radius * Math.cos(angle);
      (MindNode as any).y = centerY + radius * Math.sin(angle);
    }
    if (MindNode.children.length === 0) return;
    const angleStep = (maxAngle - minAngle) / MindNode.children.length;
    let currentAngle = minAngle;
    for (let child of MindNode.children) {
      this.radialLayout(child, centerX, centerY, depth + 1, currentAngle, currentAngle + angleStep);
      currentAngle += angleStep;
    }
  }

  private treeLayout(node: MindNode, x: number, y: number, depth: number = 0) {
    (node as any).x = x;
    (node as any).y = y;
    let currentX = x - (node.children.length * this.HORIZONTAL_GAP) / 2;
    for (const child of node.children) {
      this.treeLayout(child, currentX, y + this.VERTICAL_GAP, depth + 1);
      currentX += this.HORIZONTAL_GAP;
    }
  }

  // Render a MindNode and its children as DOM elements.
  private renderMindNode(MindNode: MindNode): void {
    const MindNodeDiv = document.createElement("div");
    MindNodeDiv.innerText = MindNode.label;
    MindNodeDiv.dataset.MindNodeId = MindNode.id.toString();
    Object.assign(MindNodeDiv.style, {
        position: "absolute",
        left: `${(MindNode as any).x}px`,
        top: `${(MindNode as any).y}px`,
        padding: "8px 16px",
        display: "inline-block",
        whiteSpace: "nowrap",
        zIndex: "1",
        background: (MindNode as any).background || "#ffffff",
        border: "1px solid #dee2e6",
        borderRadius: "12px",
        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.1)",
        fontSize: "16px",
        fontWeight: "500",
        color: "#212529",
        cursor: "pointer",
        transition: "all 0.2s ease"
    });
    MindNodeDiv.addEventListener("mouseover", () => {
        MindNodeDiv.style.transform = "translateY(-2px)";
        MindNodeDiv.style.boxShadow = "0 5px 12px rgba(0, 0, 0, 0.15)";
    });
    MindNodeDiv.addEventListener("mouseout", () => {
        MindNodeDiv.style.transform = "translateY(0)";
        MindNodeDiv.style.boxShadow = "0 3px 6px rgba(0, 0, 0, 0.1)";
    });
    // Add click event listener for MindNode selection.
    MindNodeDiv.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectMindNode(e, MindNodeDiv); // updated to pass the event
    });
    // Append the MindNode div to the canvas.
    this.canvas.appendChild(MindNodeDiv);
    // Adjust left to center the MindNode based on its dynamic width.
    const MindNodeWidth = MindNodeDiv.offsetWidth;
    MindNodeDiv.style.left = ((MindNode as any).x - MindNodeWidth / 2) + "px";
    
    // Draw lines from this MindNode to each child.
    for (let child of MindNode.children) {
      this.drawLine(MindNode, child);
      // Recursively render child MindNodes.
      this.renderMindNode(child);
    }
  }

  // New helper method to get SVG icons for buttons
  private getIconForAction(action: string): string {
    const icons = {
        'Add Child': '<path d="M12 5v14M5 12h14"/>',
        'Delete MindNode': '<path d="M19 6L5 18M5 6l14 12"/>',
        'Edit MindNode': '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
        'MindNode Style': '<path d="M3 16l7-7 2 2 5-5m-2-1l2 2m-13 7l2 2M3 6c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>'
    };
    return icons[action as keyof typeof icons] || '';
  }

  // Modified selectMindNode method for centered action buttons under the MindNode.
  private selectMindNode(e: MouseEvent, MindNodeDiv: HTMLDivElement): void {
    // Deselect previous MindNode if any.
    if (this.selectedMindNodeDiv) {
      this.selectedMindNodeDiv.style.border = "1px solid #dee2e6";
    }
    MindNodeDiv.style.border = "2px solid #4dabf7";
    this.selectedMindNodeDiv = MindNodeDiv;

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

    // Calculate the MindNode's position using its style and dimensions.
    const MindNodeLeft = parseFloat(MindNodeDiv.style.left);
    const MindNodeTop = parseFloat(MindNodeDiv.style.top);
    const MindNodeWidth = MindNodeDiv.offsetWidth;
    const MindNodeHeight = MindNodeDiv.offsetHeight;

    // Position the action buttons centered under the MindNode.
    const buttonLeft = MindNodeLeft + MindNodeWidth / 2;
    const buttonTop = MindNodeTop + MindNodeHeight + 8; // 8px padding

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
      const MindNodeId = parseInt(MindNodeDiv.dataset.MindNodeId!);
      const newLabel = await this.showModal("Enter label for new child MindNode:");
      if (newLabel) {
        this.mindMap.addMindNode(MindNodeId, newLabel);
        this.render();
      }
    });
    const deleteButton = createButton("Delete MindNode", (e) => {
      e.stopPropagation();
      const MindNodeId = parseInt(MindNodeDiv.dataset.MindNodeId!);
      try {
        this.mindMap.deleteMindNode(MindNodeId);
        this.render();
      } catch (err) {
        alert(err);
      }
    });
    const editButton = createButton("Edit Node", async (e) => {
      e.stopPropagation();
      const MindNodeId = parseInt(MindNodeDiv.dataset.MindNodeId!);
      const defaultText = MindNodeDiv.innerText;
      const defaultBg = MindNodeDiv.style.background;
      const result = await this.showStyleModal(defaultText, defaultBg);
      if (result) {
        this.mindMap.updateMindNode(MindNodeId, result.text);
        this.updateMindNodeBackground(MindNodeId, result.background);
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
          MindNode Text
        </label>
        <input type="text" style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #dee2e6; border-radius: 4px;" value="${defaultText}">
      `;
      const textInput = textGroup.querySelector('input')!;

      // Color Picker Group
      const colorGroup = document.createElement("div");
      colorGroup.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: 500;">
          MindNode Background
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
        textPrompt.innerText = "Enter new text for the MindNode:";
        textPrompt.style.marginBottom = "5px";
        modal.appendChild(textPrompt);
        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.value = defaultText;
        textInput.style.width = "100%";
        textInput.style.marginBottom = "10px";
        modal.appendChild(textInput);

        const bgPrompt = document.createElement("div");
        bgPrompt.innerText = "Enter background CSS for the MindNode:";
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

  // NEW: Helper method to update a MindNode's background by traversing the tree.
  private updateMindNodeBackground(MindNodeId: number, background: string): boolean {
    function traverse(MindNode: any): boolean {
      if (MindNode.id === MindNodeId) {
        MindNode.background = background;
        return true;
      }
      for (let child of MindNode.children) {
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

  // Draw a simple line between two MindNodes using a rotated div.
  private drawLine(parent: MindNode, child: MindNode): void {
    const line = document.createElement("div");
    Object.assign(line.style, {
        position: "absolute",
        zIndex: "0",
        background: "#ced4da",
        height: "2px",
        transformOrigin: "0 0"
    });
    // Compute the center coordinates of parent and child MindNodes.
    const x1 = (parent as any).x;
    const y1 = (parent as any).y + 15; // 15 is half of the MindNode's height
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
    // Add connection metadata
    line.dataset.source = parent.id.toString();
    line.dataset.target = child.id.toString();
    line.className = 'connection';
    // Append the line to the canvas.
    this.canvas.appendChild(line);
  }

  // New method to allow users to set a custom canvas size.
  public setCanvasSize(width: string, height: string): void {
    this.canvas.style.width = width;
    this.canvas.style.height = height;
  }

  // Added public function 'clear' to empty the canvas.
  public clear(): void {
    this.canvas.innerHTML = "";
  }

  // NEW: Method to automatically expand the canvas when MindNodes approach boundaries.
  private autoExpandCanvas(): void {
    const buffer = 2000; // Expansion buffer in pixels
    const MindNodes = this.canvas.querySelectorAll<HTMLDivElement>('[data-MindNode-id]');
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    MindNodes.forEach(MindNode => {
      const x = parseFloat(MindNode.style.left);
      const y = parseFloat(MindNode.style.top);
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
    const MindNodes = this.getAllMindNodes();
    const { minX, minY, maxX, maxY } = this.calculateBoundingBox(MindNodes);
    const padding = 50;
    
    svg.setAttribute("viewBox", `${minX - padding} ${minY - padding} ${maxX - minX + 2*padding} ${maxY - minY + 2*padding}`);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Draw connections
    MindNodes.forEach(MindNode => {
      MindNode.children.forEach(child => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String((MindNode as any).x));
        line.setAttribute("y1", String((MindNode as any).y + 15));
        line.setAttribute("x2", String((child as any).x));
        line.setAttribute("y2", String((child as any).y - 15));
        line.setAttribute("stroke", "#ced4da");
        line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
      });
    });

    // Draw MindNodes
    MindNodes.forEach(MindNode => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      
      // Calculate text width approximation
      const textWidth = MindNode.label.length * 8;
      const textHeight = 20;

      rect.setAttribute("x", String((MindNode as any).x - textWidth/2));
      rect.setAttribute("y", String((MindNode as any).y - textHeight/2));
      rect.setAttribute("width", String(textWidth));
      rect.setAttribute("height", String(textHeight));
      rect.setAttribute("rx", "8");
      rect.setAttribute("fill", (MindNode as any).background || "#ffffff");
      rect.setAttribute("stroke", "#dee2e6");
      rect.setAttribute("stroke-width", "1");

      text.setAttribute("x", String((MindNode as any).x));
      text.setAttribute("y", String((MindNode as any).y + 5));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-family", "Arial, sans-serif");
      text.setAttribute("font-size", "16px");
      text.setAttribute("fill", "#212529");
      text.textContent = MindNode.label;

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

  // NEW: Helper method to get all MindNodes in the mindmap.
  private getAllMindNodes(): MindNode[] {
    const MindNodes: MindNode[] = [];
    const traverse = (MindNode: MindNode) => {
      MindNodes.push(MindNode);
      MindNode.children.forEach(child => traverse(child));
    };
    traverse(this.mindMap.root);
    return MindNodes;
  }

  // NEW: Helper method to calculate the bounding box for all MindNodes.
  private calculateBoundingBox(MindNodes: MindNode[]): { minX: number, minY: number, maxX: number, maxY: number } {
    return MindNodes.reduce((acc, MindNode) => ({
      minX: Math.min(acc.minX, (MindNode as any).x),
      minY: Math.min(acc.minY, (MindNode as any).y),
      maxX: Math.max(acc.maxX, (MindNode as any).x),
      maxY: Math.max(acc.maxY, (MindNode as any).y)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  }

  // Public method to export mindmap data as JSON (unified format)
  public toJSON(): string {
    return JSON.stringify({
      model: JSON.parse(this.mindMap.toJSON()),
      canvasSize: this.canvasSize,
      virtualCenter: this.virtualCenter,
      version: "1.0"
    }, null, 2);
  }

  // Public method to import mindmap data from JSON (unified format)
  public fromJSON(jsonData: string): void {
    const data = JSON.parse(jsonData);
    // Load the MindMap model using its unified fromJSON method.
    this.mindMap.fromJSON(JSON.stringify(data.model));
    this.canvasSize = data.canvasSize;
    this.virtualCenter = data.virtualCenter;
    this.render();
  }

  private enableFreeformDragging() {
    let isDraggingNode = false;
    let currentDraggedNode: HTMLDivElement | null = null;
    let startX = 0;
    let startY = 0;
    let nodeOffsetX = 0;
    let nodeOffsetY = 0;
  
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.draggingMode) return;
      const target = e.target as HTMLDivElement;
      if (target.dataset.mindNodeId) {
        isDraggingNode = true;
        currentDraggedNode = target;
        target.style.cursor = 'grabbing';
  
        const rect = this.canvas.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        nodeOffsetX = (startX - rect.left - this.offsetX) / this.zoomLevel - parseFloat(target.style.left);
        nodeOffsetY = (startY - rect.top - this.offsetY) / this.zoomLevel - parseFloat(target.style.top);
      }
    });
  
    document.addEventListener('mousemove', (e) => {
      if (!this.draggingMode || !isDraggingNode || !currentDraggedNode) return;
  
      const rect = this.canvas.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - this.offsetX) / this.zoomLevel - nodeOffsetX;
      const rawY = (e.clientY - rect.top - this.offsetY) / this.zoomLevel - nodeOffsetY;
  
      const x = Math.max(0, Math.min(this.canvasSize.width - currentDraggedNode.offsetWidth, rawX));
      const y = Math.max(0, Math.min(this.canvasSize.height - currentDraggedNode.offsetHeight, rawY));
  
      currentDraggedNode.style.left = `${x}px`;
      currentDraggedNode.style.top = `${y}px`;
  
      // Update connections immediately
      this.updateConnectionsForNode(currentDraggedNode);
    });
  
    document.addEventListener('mouseup', () => {
      if (!this.draggingMode) return;
      isDraggingNode = false;
      if (currentDraggedNode) {
        currentDraggedNode.style.cursor = 'pointer';
        this.updateNodePositionInModel(currentDraggedNode);
        this.render(); // Full re-render to update all connections
      }
    });
  }
  
  private updateNodePositionInModel(nodeDiv: HTMLDivElement) {
    const nodeId = parseInt(nodeDiv.dataset.mindNodeId!);
    const x = parseFloat(nodeDiv.style.left) + nodeDiv.offsetWidth/2;
    const y = parseFloat(nodeDiv.style.top);
    this.updateNodeCoordinates(this.mindMap.root, nodeId, x, y);
  }
  
  private updateNodeCoordinates(node: MindNode, targetId: number, x: number, y: number): boolean {
    if (node.id === targetId) {
      (node as any).x = x;
      (node as any).y = y;
      return true;
    }
    return node.children.some(child => this.updateNodeCoordinates(child, targetId, x, y));
  }

  private updateConnectionsForNode(nodeDiv: HTMLDivElement) {
    const connections = this.canvas.querySelectorAll('.connection');
    connections.forEach(conn => {
      if (
        conn instanceof HTMLElement &&
        (conn.dataset.source === nodeDiv.dataset.mindNodeId ||
         conn.dataset.target === nodeDiv.dataset.mindNodeId)
      ) {
        conn.remove();
      }
    });
  
    const nodeId = parseInt(nodeDiv.dataset.mindNodeId!);
    const mindNode = this.findMindNode(nodeId);
    if (mindNode) {
      if (mindNode.parent) {
        this.drawLine(mindNode.parent, mindNode);
      }
      mindNode.children.forEach(child => {
        this.drawLine(mindNode, child);
      });
    }
  }

  private findMindNode(id: number): MindNode | null {
    let found: MindNode | null = null;
    const traverse = (node: MindNode) => {
      if (node.id === id) {
        found = node;
        return;
      }
      node.children.forEach(child => traverse(child));
    };
    traverse(this.mindMap.root);
    return found;
  }
}

export { VisualMindMap };
