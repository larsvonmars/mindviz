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
import { showStyleModal } from "./Modal";
import { createMindNodeElement } from "./MindNodeComponent";
import { createToolbar } from "./Toolbar";

// Add a new interface for custom connections
interface MindMapConnection {
  id: number;
  sourceId: number;
  targetId: number;
  style?: {
    color?: string;
    width?: number;
    dasharray?: string;
  };
  label?: string;
}

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
  // NEW: Add zoom level display element
  private zoomLevelDisplay!: HTMLSpanElement;
  private currentLayout: 'radial' | 'tree' = 'radial';
  // NEW: Flag to toggle dragging mode
  private draggingMode: boolean = false;
  // Add new property to track description expansion state
  private descriptionExpanded = new Map<number, boolean>();
  // Add property to track manually positioned nodes
  private manuallyPositionedNodes = new Set<number>();

  // Add action history properties and methods
  private historyStack: string[] = [];
  private redoStack: string[] = [];

  private recordSnapshot(): void {
    this.historyStack.push(this.toJSON());
    this.redoStack = [];
  }

  public undo(): void {
    if (this.historyStack.length <= 1) return;
    const current = this.historyStack.pop()!;
    this.redoStack.push(current);
    const previous = this.historyStack[this.historyStack.length - 1];
    this.fromJSON(previous);
  }

  public redo(): void {
    if (this.redoStack.length === 0) return;
    const redoState = this.redoStack.pop()!;
    this.historyStack.push(redoState);
    this.fromJSON(redoState);
  }

  // Constants for layout
  private readonly MindNode_WIDTH = 80;
  private readonly HORIZONTAL_GAP = 80; // increased gap to prevent overlap
  private readonly VERTICAL_GAP = 200; // increased gap to prevent overlap

  // NEW: Properties for custom connections
  private customConnections: MindMapConnection[] = [];
  private connectionIdCounter: number = 1;

  constructor(container: HTMLElement, mindMap: MindMap) {
    // Container styling
    if (!container.style.width) container.style.width = "100%";
    if (!container.style.height) container.style.height = "800px";
    Object.assign(container.style, {
        border: "1px solid var(--mm-border-color, #e0e0e0)",
        overflow: "hidden",
        cursor: "grab",
        position: "relative",
        backgroundColor: "var(--mm-container-bg, #f8f9fa)"
    });

    this.container = container;
    this.mindMap = mindMap;
    
    // NEW: Append the separated toolbar component.
    const toolbar = createToolbar(this);
    container.appendChild(toolbar);
    
    // Canvas styling
    this.canvas = document.createElement("div");
    Object.assign(this.canvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: `${this.canvasSize.width}px`,
        height: `${this.canvasSize.height}px`,
        transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        willChange: "transform",
        backgroundColor: "var(--mm-canvas-bg, transparent)"
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
    
    // NEW: Deselect node when clicking on empty canvas area.
    this.canvas.addEventListener("click", (e) => {
      if (e.target === this.canvas) {
        if (this.selectedMindNodeDiv) {
          this.selectedMindNodeDiv.style.border = "1px solid #dee2e6";
          this.selectedMindNodeDiv = null;
        }
        if (this.currentActionButtons) {
          this.currentActionButtons.remove();
          this.currentActionButtons = null;
        }
      }
    });

    // Unified keydown event listener for undo/redo and toggling dragging mode.
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      // Skip if focus is in an input, textarea, select, or any contentEditable element.
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) {
        return;
      }
      // Undo: Trigger on Ctrl+Z or Command+Z (without shift)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.undo();
        return;
      }
      // Redo: Trigger on Ctrl+Shift+Z / Command+Shift+Z or Ctrl+Y / Command+Y
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key.toLowerCase() === "z") || e.key.toLowerCase() === "y")) {
        e.preventDefault();
        this.redo();
        return;
      }
      // Toggle dragging mode with the "G" key (only when no modifiers are active)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        this.draggingMode = !this.draggingMode;
        this.container.setAttribute("dragging-mode", String(this.draggingMode));
      }
    });
  }

  private updateCanvasTransform() {
    this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
  }

  // NEW: Method to set zoom level and update the canvas transform
  public setZoom(zoom: number): void {
    this.zoomLevel = zoom;
    this.updateCanvasTransform();
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
    // Clear the canvas (not the container) for re-rendering.
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
    
    // Record initial state if undo history is empty.
    if (this.historyStack.length === 0) {
      this.recordSnapshot();
    }
  }

  // New radial layout method: positions MindNode using polar coordinates.
  private radialLayout(MindNode: MindNode, centerX: number, centerY: number, depth: number, minAngle: number, maxAngle: number): void {
    if (this.manuallyPositionedNodes.has(MindNode.id)) {
      // Position children relative to manual node
      if (MindNode.expanded && MindNode.children.length > 0) {
        const angleStep = (2 * Math.PI) / MindNode.children.length;
        let currentAngle = 0;
        const radius = this.VERTICAL_GAP * (depth > 0 ? 1.5 : 1); // Increased spread
        MindNode.children.forEach(child => {
          if (!this.manuallyPositionedNodes.has(child.id)) {
            (child as any).x = (MindNode as any).x + radius * Math.cos(currentAngle);
            (child as any).y = (MindNode as any).y + radius * Math.sin(currentAngle);
            currentAngle += angleStep;
          }
        });
      }
      return;
    }
    if (depth === 0) {
      (MindNode as any).x = centerX;
      (MindNode as any).y = centerY;
    } else {
      const radius = this.VERTICAL_GAP * depth; // radial gap
      const angle = (minAngle + maxAngle) / 2;
      (MindNode as any).x = centerX + radius * Math.cos(angle);
      (MindNode as any).y = centerY + radius * Math.sin(angle);
    }
    // Process children only if expanded
    if (!MindNode.expanded || MindNode.children.length === 0) return;
    const angleStep = (maxAngle - minAngle) / MindNode.children.length;
    let currentAngle = minAngle;
    for (let child of MindNode.children) {
      this.radialLayout(child, centerX, centerY, depth + 1, currentAngle, currentAngle + angleStep);
      currentAngle += angleStep;
    }
  }

  // NEW: Helper method to compute the subtree width for treeLayout.
  private computeSubtreeWidth(node: MindNode): number {
    if (node.children.length === 0) return this.MindNode_WIDTH;
    const childWidths = node.children.map(child => this.computeSubtreeWidth(child));
    return childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * this.HORIZONTAL_GAP;
  }

  // Updated treeLayout method: set nodes positions so they do not overlap.
  private treeLayout(node: MindNode, x: number, y: number): void {
    if (this.manuallyPositionedNodes.has(node.id)) {
      // Position children relative to manual node
      if (node.expanded && node.children.length > 0) {
        let startX = (node as any).x - (node.children.length * this.HORIZONTAL_GAP) / 2;
        node.children.forEach(child => {
          if (!this.manuallyPositionedNodes.has(child.id)) {
            (child as any).x = startX;
            (child as any).y = (node as any).y + this.VERTICAL_GAP;
            startX += this.HORIZONTAL_GAP + this.MindNode_WIDTH;
          }
        });
      }
      return;
    }
    (node as any).x = x;
    (node as any).y = y;
    // Process children only if expanded
    if (!node.expanded || node.children.length === 0) return;
    const totalWidth = node.children
      .map(child => this.computeSubtreeWidth(child))
      .reduce((a, b) => a + b, 0) + (node.children.length - 1) * this.HORIZONTAL_GAP;
    let startX = x - totalWidth / 2;
    for (const child of node.children) {
      const childWidth = this.computeSubtreeWidth(child);
      const childCenterX = startX + childWidth / 2;
      this.treeLayout(child, childCenterX, y + this.VERTICAL_GAP);
      startX += childWidth + this.HORIZONTAL_GAP;
    }
  }

  // Updated renderMindNode method to use the MindNode component.
  private renderMindNode(MindNode: MindNode): void {
    // Create the MindNode element using the new component:
    const nodeX = (MindNode as any).x;
    const nodeY = (MindNode as any).y;
    const isExpanded = this.descriptionExpanded.get(MindNode.id) || false;
    const MindNodeDiv = createMindNodeElement({
      mindNode: MindNode,
      x: nodeX,
      y: nodeY,
      descriptionExpanded: isExpanded,
      onToggleDescription: () => {
        const curr = this.descriptionExpanded.get(MindNode.id) || false;
        this.descriptionExpanded.set(MindNode.id, !curr);
        this.render();
      },
      onClick: (e, nodeEl) => {
        if (this.draggingMode) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        this.selectMindNode(e, nodeEl);
      }
    });
    MindNodeDiv.dataset.mindNodeId = String(MindNode.id);
    this.canvas.appendChild(MindNodeDiv);
    const eleWidth = MindNodeDiv.offsetWidth;
    MindNodeDiv.style.left = ((MindNode as any).x - eleWidth / 2) + "px";
    
    // Draw lines and recursively render child MindNodes.
    for (let child of MindNode.children) {
      this.drawLine(MindNode, child);
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
      const parentId = parseInt(MindNodeDiv.dataset.mindNodeId!);
      this.recordSnapshot(); // record state before addition
      const newLabel = await this.showModal("Enter label for new child MindNode:");
      if (newLabel) {
        const parentNode = this.findMindNode(parentId);
        if (!parentNode) return;
        
        // Temporarily remove parent's manual flag:
        this.manuallyPositionedNodes.delete(parentNode.id);
        
        const newNode = this.mindMap.addMindNode(parentId, newLabel);
        
        // Set position relative to parent's current position
        (newNode as any).x = (parentNode as any).x + this.HORIZONTAL_GAP;
        (newNode as any).y = (parentNode as any).y;
        
        // Re-mark the parent as manually positioned:
        this.manuallyPositionedNodes.add(parentNode.id);
        
        // Force a full re-render after adding the new child:
        this.clear();
        this.render();
      }
    });
    const deleteButton = createButton("Delete MindNode", (e) => {
      e.stopPropagation();
      const MindNodeId = parseInt(MindNodeDiv.dataset.mindNodeId!);
      this.recordSnapshot(); // record state before deletion
      try {
        this.mindMap.deleteMindNode(MindNodeId);
        this.render();
      } catch (err) {
        alert(err);
      }
    });
    const editButton = createButton("Edit Node", async (e) => {
      e.stopPropagation();
      const MindNodeId = parseInt(MindNodeDiv.dataset.mindNodeId!);
      const node = this.findMindNode(MindNodeId);
      if (!node) return;
      const defaultText = node.label; // Use only the label for the title field
      const defaultBg = MindNodeDiv.style.background;
      const defaultDesc = node.description || '';
      const result = await showStyleModal(defaultText, defaultBg, defaultDesc);
      if (result) {
        this.mindMap.updateMindNode(MindNodeId, result.text, result.description);
        this.updateMindNodeBackground(MindNodeId, result.background);
        this.updateMindNodeDescription(MindNodeId, result.description);
        this.render();
      }
    });

    actionDiv.append(addButton, deleteButton, editButton);
    this.canvas.appendChild(actionDiv);
    this.currentActionButtons = actionDiv;
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

  // NEW: Helper method to update a MindNode's description by traversing the tree.
  private updateMindNodeDescription(MindNodeId: number, description: string): boolean {
    function traverse(MindNode: any): boolean {
      if (MindNode.id === MindNodeId) {
        MindNode.description = description;
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
    // Calculate positions using node dimensions and edge detection
    const parentRect = { 
      x: (parent as any).x, 
      y: (parent as any).y, 
      width: this.MindNode_WIDTH, 
      height: 40 
    };
    const childRect = { 
      x: (child as any).x, 
      y: (child as any).y, 
      width: this.MindNode_WIDTH, 
      height: 40 
    };
    const start = this.calculateEdgePoint(parentRect, childRect);
    const end = this.calculateEdgePoint(childRect, parentRect);

    const dx = end.x - start.x, dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    const line = document.createElement("div");
    line.style.position = "absolute";
    line.style.zIndex = "0";
    line.style.background = "var(--mm-connection-color, #ced4da)";
    line.style.height = "2px";
    line.style.width = length + "px";
    line.style.left = start.x + "px";
    line.style.top = start.y + "px";
    line.style.transformOrigin = "0 0";
    line.style.transform = `rotate(${angle}deg)`;
    line.dataset.source = parent.id.toString();
    line.dataset.target = child.id.toString();
    line.className = 'connection';
    this.canvas.appendChild(line);
  }
  
  private calculateEdgePoint(source: any, target: any) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const angle = Math.atan2(dy, dx);
    return {
      x: source.x + Math.cos(angle) * (source.width / 2),
      y: source.y + Math.sin(angle) * (source.height / 2)
    };
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
    const MindNodes = this.canvas.querySelectorAll<HTMLDivElement>('[data-mind-node-id]');
    
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

  // Modified exportAsSVG method
  public exportAsSVG(): void {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const nodeDivs = this.canvas.querySelectorAll<HTMLDivElement>('[data-mind-node-id]');
    const MindNodes = this.getAllMindNodes();
    
    // Capture node dimensions from DOM
    const nodeDimensions = new Map<number, { width: number, height: number }>();
    nodeDivs.forEach(div => {
        const nodeId = parseInt(div.dataset.mindNodeId!);
        nodeDimensions.set(nodeId, {
            width: div.offsetWidth,
            height: div.offsetHeight
        });
    });

    // Calculate bounding box with padding
    const { minX, minY, maxX, maxY } = this.calculateBoundingBox(MindNodes);
    const padding = 50;
    svg.setAttribute("viewBox", `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Draw connections first (under nodes)
    MindNodes.forEach(parent => {
        parent.children.forEach(child => {
            const parentDims = nodeDimensions.get(parent.id);
            const childDims = nodeDimensions.get(child.id);
            if (parentDims && childDims) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", (parent as any).x.toString());
                line.setAttribute("y1", ((parent as any).y + parentDims.height / 2).toString());
                line.setAttribute("x2", (child as any).x.toString());
                line.setAttribute("y2", ((child as any).y - childDims.height / 2).toString());
                line.setAttribute("stroke", "#ced4da");
                line.setAttribute("stroke-width", "2");
                svg.appendChild(line);
            }
        });
    });

    // Draw nodes
    nodeDivs.forEach(div => {
        const nodeId = parseInt(div.dataset.mindNodeId!);
        const mindNode = this.findMindNode(nodeId);
        if (!mindNode) return;

        const dims = nodeDimensions.get(nodeId);
        if (!dims) return;

        const x = (mindNode as any).x - dims.width / 2;
        const y = (mindNode as any).y - dims.height / 2;

        // Node rectangle with background color
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x.toString());
        rect.setAttribute("y", y.toString());
        rect.setAttribute("width", dims.width.toString());
        rect.setAttribute("height", dims.height.toString());
        rect.setAttribute("rx", "8");
        const bgColor = this.extractSolidColor(div.style.backgroundColor) || "#ffffff";
        rect.setAttribute("fill", bgColor);
        rect.setAttribute("stroke", "#e0e0e0");
        rect.setAttribute("stroke-width", "1");
        svg.appendChild(rect);

        // Node label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", (mindNode as any).x.toString());
        label.setAttribute("y", (y + 24).toString()); // Adjust for vertical centering
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-family", "Arial, sans-serif");
        label.setAttribute("font-size", "14px");
        label.setAttribute("fill", "#2d3436");
        label.setAttribute("font-weight", "600");
        label.textContent = mindNode.label;
        svg.appendChild(label);

        // Node description if expanded
        if (this.descriptionExpanded.get(nodeId)) {
            const descLines = this.wrapText(mindNode.description || "", dims.width - 20, 12); // 12px font size
            const desc = document.createElementNS("http://www.w3.org/2000/svg", "text");
            desc.setAttribute("x", (mindNode as any).x.toString());
            desc.setAttribute("y", (y + 40).toString());
            desc.setAttribute("text-anchor", "middle");
            desc.setAttribute("font-family", "Arial, sans-serif");
            desc.setAttribute("font-size", "12px");
            desc.setAttribute("fill", "#636e72");

            descLines.forEach((line, i) => {
                const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                tspan.setAttribute("x", (mindNode as any).x.toString());
                tspan.setAttribute("dy", i === 0 ? "0" : "1.2em");
                tspan.textContent = line;
                desc.appendChild(tspan);
            });
            svg.appendChild(desc);
        }
    });

    // Serialize and trigger download
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

  // Added helper method to wrap text into multiple lines
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const testWidth = testLine.length * fontSize * 0.6; // Approximate width
        if (testWidth > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Public method to export mindmap data as JSON (unified format)
  public toJSON(): string {
    return JSON.stringify({
      model: JSON.parse(this.mindMap.toJSON()),
      canvasSize: this.canvasSize,
      virtualCenter: this.virtualCenter,
      manuallyPositioned: Array.from(this.manuallyPositionedNodes),
      viewport: { offsetX: this.offsetX, offsetY: this.offsetY, zoom: this.zoomLevel },
      customConnections: this.customConnections, // added custom connections export
      version: "1.2"
    }, null, 2);
  }

  // Public method to import mindmap data from JSON (unified format)
  public fromJSON(jsonData: string): void {
    const data = JSON.parse(jsonData);
    this.mindMap.fromJSON(JSON.stringify(data.model));
    this.canvasSize = data.canvasSize;
    this.virtualCenter = data.virtualCenter;
    this.manuallyPositionedNodes = new Set(data.manuallyPositioned || []);
    this.customConnections = data.customConnections || []; // added custom connections import
    if (data.viewport) {
      this.offsetX = data.viewport.offsetX;
      this.offsetY = data.viewport.offsetY;
      this.setZoom(data.viewport.zoom);
    }
    this.validateManualPositions();
    this.render();
  }

  // New helper to validate manual positions
  private validateManualPositions() {
    const allNodes = new Map<number, MindNode>();
    const traverse = (node: MindNode) => {
      allNodes.set(node.id, node);
      node.children.forEach(child => traverse(child));
    };
    traverse(this.mindMap.root);

    // Clean up invalid references
    this.manuallyPositionedNodes = new Set(
      Array.from(this.manuallyPositionedNodes).filter(id => allNodes.has(id))
    );

    // Ensure positions exist for manual nodes
    allNodes.forEach(node => {
      if (this.manuallyPositionedNodes.has(node.id)) {
        if (typeof (node as any).x !== "number" || typeof (node as any).y !== "number") {
          console.warn(`Node ${node.id} marked as manual but missing coordinates, resetting`);
          (node as any).x = this.virtualCenter.x;
          (node as any).y = this.virtualCenter.y;
        }
      }
    });
  }

  private enableFreeformDragging() {
    let isDraggingNode = false;
    let currentDraggedNode: HTMLDivElement | null = null;
    let startX = 0;
    let startY = 0;
    let nodeOffsetX = 0;
    let nodeOffsetY = 0;
    let dragStartPosition = { x: 0, y: 0 };
    
    // When dragging starts
    const handleDragStart = (e: MouseEvent, nodeDiv: HTMLDivElement) => {
      dragStartPosition = {
        x: parseFloat(nodeDiv.style.left),
        y: parseFloat(nodeDiv.style.top)
      };
      // Mark all descendants as non-manual on drag start
      const nodeId = parseInt(nodeDiv.dataset.mindNodeId!);
      this.markDescendantsAsManual(nodeId, false);
    };
    
    // When dragging ends
    const handleDragEnd = (nodeDiv: HTMLDivElement) => {
      const nodeId = parseInt(nodeDiv.dataset.mindNodeId!);
      this.updateSubtreeConnections(nodeId);
    };
    
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.draggingMode) return;
      const target = e.target as HTMLDivElement;
      if (target.dataset.mindNodeId) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingNode = true;
        currentDraggedNode = target;
        target.style.cursor = 'grabbing';
        
        const rect = this.canvas.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        
        const nodeX = parseFloat(target.style.left);
        const nodeY = parseFloat(target.style.top);
        nodeOffsetX = (startX - rect.left - this.offsetX) / this.zoomLevel - nodeX;
        nodeOffsetY = (startY - rect.top - this.offsetY) / this.zoomLevel - nodeY;

        handleDragStart(e, target);
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!this.draggingMode || !isDraggingNode || !currentDraggedNode) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - this.offsetX) / this.zoomLevel - nodeOffsetX;
      const rawY = (e.clientY - rect.top - this.offsetY) / this.zoomLevel - nodeOffsetY;
      const x = Math.max(0, Math.min(this.canvasSize.width - currentDraggedNode.offsetWidth, rawX));
      const y = Math.max(0, Math.min(this.canvasSize.height - currentDraggedNode.offsetHeight, rawY));
      currentDraggedNode.style.left = `${x}px`;
      currentDraggedNode.style.top = `${y}px`;
      this.updateConnectionsForNode(currentDraggedNode);
    });
    
    document.addEventListener('mouseup', (e) => {
      if (!this.draggingMode) return;
      if (isDraggingNode && currentDraggedNode) {
        e.preventDefault();
        e.stopPropagation();
        this.updateNodePositionInModel(currentDraggedNode);
        this.renderConnections();
        handleDragEnd(currentDraggedNode);
        this.recordSnapshot(); // record state after move
      }
      isDraggingNode = false;
      currentDraggedNode = null;
    });
  }

  // Updated markDescendantsAsManual method to prevent infinite recursion
  private markDescendantsAsManual(nodeId: number, manual: boolean, visited: Set<number> = new Set()) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = this.findMindNode(nodeId);
    if (!node) return;
    if (manual) {
      this.manuallyPositionedNodes.add(nodeId);
    } else {
      this.manuallyPositionedNodes.delete(nodeId);
    }
    node.children.forEach(child =>
      this.markDescendantsAsManual(child.id, manual, visited)
    );
  }

  // Helper to update connections for a node subtree.
  private updateSubtreeConnections(nodeId: number) {
    // For simplicity, update all connections after a drag operation.
    this.renderConnections();
  }

  private updateNodePositionInModel(nodeDiv: HTMLDivElement) {
    const nodeId = parseInt(nodeDiv.dataset.mindNodeId!);
    const x = parseFloat(nodeDiv.style.left);
    const y = parseFloat(nodeDiv.style.top);
    this.updateNodeCoordinates(this.mindMap.root, nodeId, x, y);
  }
  
  private updateNodeCoordinates(node: MindNode, targetId: number, x: number, y: number): boolean {
    if (node.id === targetId) {
      (node as any).x = x;
      (node as any).y = y;
      this.manuallyPositionedNodes.add(node.id); // Mark as manually positioned
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

  // Updated showImportModal with modern styling
  private async showImportModal(): Promise<string | null> {
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
        zIndex: "10000",
        backdropFilter: "blur(2px)"
      });
  
      const modal = document.createElement("div");
      Object.assign(modal.style, {
        background: "#ffffff",
        padding: "32px",
        borderRadius: "16px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
        width: "90%",
        maxWidth: "600px",
        position: "relative"
      });
      
      // Cleanup helper to remove the modal overlay
      const cleanup = () => {
        if (modalOverlay.parentElement) {
          modalOverlay.parentElement.removeChild(modalOverlay);
        }
      };
  
      // Close button
      const closeButton = document.createElement("button");
      closeButton.innerHTML = "&times;";
      Object.assign(closeButton.style, {
        position: "absolute",
        top: "16px",
        right: "16px",
        background: "none",
        border: "none",
        fontSize: "24px",
        color: "#6c757d",
        cursor: "pointer",
        padding: "4px",
        lineHeight: "1"
      });
      closeButton.addEventListener("click", () => {
        cleanup();
        resolve(null);
      });
  
      const title = document.createElement("h3");
      title.textContent = "Import JSON Data";
      Object.assign(title.style, {
        margin: "0 0 24px 0",
        fontSize: "20px",
        fontWeight: "600",
        color: "#2d3436"
      });
  
      const textArea = document.createElement("textarea");
      Object.assign(textArea.style, {
        width: "100%",
        height: "300px",
        padding: "16px",
        border: "1px solid #e9ecef",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "13px",
        resize: "vertical",
        marginBottom: "24px",
        background: "#f8f9fa",
        transition: "all 0.2s ease"
      });
      textArea.placeholder = "Paste your JSON data here...";
  
      const buttonGroup = document.createElement("div");
      Object.assign(buttonGroup.style, {
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end"
      });
  
      const cancelButton = document.createElement("button");
      Object.assign(cancelButton, {
        textContent: "Cancel",
        style: {
          padding: "12px 24px",
          border: "1px solid #e9ecef",
          borderRadius: "8px",
          background: "none",
          cursor: "pointer",
          color: "#495057",
          fontWeight: "500"
        }
      });
  
      const importButton = document.createElement("button");
      Object.assign(importButton, {
        textContent: "Import Data",
        style: {
          padding: "12px 24px",
          border: "none",
          borderRadius: "8px",
          background: "#4dabf7",
          color: "white",
          cursor: "pointer",
          fontWeight: "500"
        }
      });
  
      cancelButton.addEventListener("click", () => {
        cleanup();
        resolve(null);
      });
      importButton.addEventListener("click", () => {
        cleanup();
        resolve(textArea.value);
      });
  
      modal.appendChild(closeButton);
      modal.appendChild(title);
      modal.appendChild(textArea);
      buttonGroup.append(cancelButton, importButton);
      modal.appendChild(buttonGroup);
      modalOverlay.appendChild(modal);
      document.body.appendChild(modalOverlay);
  
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          cleanup();
          resolve(null);
        }
      });
    });
  }

  // New helper method to get all MindNodes in the mind map
  private getAllMindNodes(): MindNode[] {
    const nodes: MindNode[] = [];
    const traverse = (node: MindNode) => {
      nodes.push(node);
      node.children.forEach(child => traverse(child));
    };
    traverse(this.mindMap.root);
    return nodes;
  }

  // New helper method to calculate the bounding box of all nodes
  private calculateBoundingBox(nodes: MindNode[]): { minX: number, minY: number, maxX: number, maxY: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      const x = (node as any).x;
      const y = (node as any).y;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    return { minX, minY, maxX, maxY };
  }

  // New method to update connection drawings without recalculating layout
  private renderConnections(): void {
    // Remove existing connections
    const connections = this.canvas.querySelectorAll('.connection');
    connections.forEach(conn => conn.remove());
  
    // Recursively draw connections starting from the root node
    const drawConns = (node: MindNode) => {
      node.children.forEach(child => {
        this.drawLine(node, child);
        drawConns(child);
      });
    };
    drawConns(this.mindMap.root);

    // NEW: Loop through customConnections and render each
    for (const connection of this.customConnections) {
      const source = this.findMindNode(connection.sourceId);
      const target = this.findMindNode(connection.targetId);
      if (source && target) {
        this.drawCustomConnection(source, target, connection);
      }
    }
  }

  // NEW: Method to add a custom connection between any two nodes
  public addCustomConnection(
    sourceId: number,
    targetId: number,
    style?: { color?: string; width?: number; dasharray?: string },
    label?: string
  ): void {
    const source = this.findMindNode(sourceId);
    const target = this.findMindNode(targetId);
    if (!source || !target) {
      throw new Error("Invalid node id(s) for custom connection.");
    }
    const connection: MindMapConnection = {
      id: this.connectionIdCounter++,
      sourceId,
      targetId,
      style,
      label,
    };
    this.customConnections.push(connection);
    // Redraw connections after adding a custom one
    this.renderConnections();
  }

  // NEW: Draw a custom connection applying optional style and label
  private drawCustomConnection(source: MindNode, target: MindNode, connection: MindMapConnection): void {
    const sourceRect = { 
      x: (source as any).x, 
      y: (source as any).y, 
      width: this.MindNode_WIDTH, 
      height: 40 
    };
    const targetRect = { 
      x: (target as any).x, 
      y: (target as any).y, 
      width: this.MindNode_WIDTH, 
      height: 40 
    };

    const start = this.calculateEdgePoint(sourceRect, targetRect);
    const end = this.calculateEdgePoint(targetRect, sourceRect);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const line = document.createElement("div");
    line.style.position = "absolute";
    line.style.zIndex = "0";

    // Use custom style or default values
    const color = connection.style?.color || "var(--mm-connection-color, #ced4da)";
    const width = connection.style?.width || 2;
    line.style.background = color;
    line.style.height = `${width}px`;
    line.style.width = `${length}px`;
    line.style.left = `${start.x}px`;
    line.style.top = `${start.y}px`;
    line.style.transformOrigin = "0 0";
    line.style.transform = `rotate(${angle}deg)`;
    if (connection.style?.dasharray) {
      line.style.background = "none";
      line.style.borderTop = `${width}px dashed ${color}`;
    }
    line.className = "connection";
    line.dataset.connectionId = connection.id.toString();
    this.canvas.appendChild(line);

    // If a label is provided, create and position a label element
    if (connection.label) {
      const labelEl = document.createElement("div");
      labelEl.innerText = connection.label;
      labelEl.style.position = "absolute";
      labelEl.style.fontSize = "12px";
      labelEl.style.background = "rgba(255, 255, 255, 0.8)";
      labelEl.style.padding = "2px 4px";
      labelEl.style.borderRadius = "4px";
      labelEl.style.whiteSpace = "nowrap";
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      labelEl.style.left = `${midX}px`;
      labelEl.style.top = `${midY}px`;
      labelEl.style.transform = "translate(-50%, -50%)";
      this.canvas.appendChild(labelEl);
    }
  }
}

export { VisualMindMap };
