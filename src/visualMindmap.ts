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
import { showConnectionCustomizationModal } from "./ConnectionCustomizationModal";
import { ConnectionLabel } from "./components/ConnectionLabel";

// Add a new interface for custom connections
interface MindMapConnection {
  id: string; // changed from number to string for unique ids.
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
  public mindMap: MindMap;
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

  // NEW: Properties for connection mode
  private connectionModeActive: boolean = false;
  private pendingConnectionSource: number | null = null;

  // NEW: Event listeners registry
  private eventListeners: { [key: string]: ((payload: any) => void)[] } = {};

  // NEW: Property to track the current theme
  private theme: 'light' | 'dark' = 'light';

  constructor(container: HTMLElement, mindMap: MindMap) {
    // Container styling
    if (!container.style.width) container.style.width = "100%";
    if (!container.style.height) container.style.height = "800px";
    Object.assign(container.style, {
      border: "1px solid var(--mm-border-color,rgb(214, 214, 214))",
      overflow: "hidden", // changed to disable scrolling
      cursor: "grab",
      position: "relative",
      backgroundColor: "var(--mm-container-bg,rgb(192, 193, 194))", // Slightly darker background color
      borderRadius: "12px", // Rounded borders
      resize: "both" // allow user to resize the container
    });
    // Disable browser-level panning / pinch-zoom so we can manage it ourselves
    this.container = container;
    this.container.style.touchAction = "none";
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

    // NEW: Touch event listeners for panning on container
    container.addEventListener("touchstart", (e: TouchEvent) => {
      if (this.draggingMode) return;
      if(e.touches.length === 1) { // single touch to pan
        isPanning = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        container.style.cursor = "grabbing";
      }
    });
    container.addEventListener("touchmove", (e: TouchEvent) => {
      if (this.draggingMode || !isPanning) return;
      if(e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = (touch.clientX - startX) / this.zoomLevel;
        const dy = (touch.clientY - startY) / this.zoomLevel;
        this.offsetX += dx;
        this.offsetY += dy;
        this.updateCanvasTransform();
        startX = touch.clientX;
        startY = touch.clientY;
      }
    });
    container.addEventListener("touchend", (e: TouchEvent) => {
      if (this.draggingMode) return;
      isPanning = false;
      container.style.cursor = "grab";
    });

    /* ----------   Pinch-zoom & two-finger pan   ---------- */
    let pinchStartDist: number | null = null;
    let pinchStartZoom = 1;
    let pinchStartCenter = { x: 0, y: 0 };
    const clampZoom = (z: number) => Math.max(0.2, Math.min(4, z));
    container.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 2) {
          pinchStartDist = this.getTouchesDistance(e.touches);
          pinchStartZoom = this.zoomLevel;
          pinchStartCenter = this.getTouchesCenter(e.touches);
        }
      },
      { passive: false }
    );
    container.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 2 && pinchStartDist !== null) {
          e.preventDefault();
          const newDist = this.getTouchesDistance(e.touches);
          const scale = newDist / pinchStartDist;
          const newZoom = clampZoom(pinchStartZoom * scale);
          const newCenter = this.getTouchesCenter(e.touches);
          const deltaX = (newCenter.x - pinchStartCenter.x) / this.zoomLevel;
          const deltaY = (newCenter.y - pinchStartCenter.y) / this.zoomLevel;
          this.offsetX += deltaX;
          this.offsetY += deltaY;
          this.setZoom(newZoom);
          pinchStartDist = newDist;
          pinchStartCenter = newCenter;
        }
      },
      { passive: false }
    );
    container.addEventListener("touchend", (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartDist = null;
      }
    });

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
    this.renderConnections(); // render custom connections on initial render
    
    // Record initial state if undo history is empty.
    if (this.historyStack.length === 0) {
      this.recordSnapshot();
    }
  }

  // New render function that does not re-center and avoids any animation or effects.
  public renderNoCenter(): void {
    // Clear the canvas without modifying offsets.
    this.canvas.innerHTML = "";
    
    // Use the root node’s current position if available, otherwise default to virtualCenter.
    const rootNode = this.mindMap.root;
    const currentX = (rootNode as any).x !== undefined ? (rootNode as any).x : this.virtualCenter.x;
    const currentY = (rootNode as any).y !== undefined ? (rootNode as any).y : this.virtualCenter.y;

    if (this.currentLayout === 'radial') {
      this.radialLayout(rootNode, currentX, currentY, 0, 0, 2 * Math.PI);
    } else {
      this.treeLayout(rootNode, currentX, currentY);
    }
    
    this.renderMindNode(rootNode);
    
    // Immediately disable any transition effects.
    this.canvas.style.transition = "none";
    
    // Render connections as usual.
    this.renderConnections();
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

  // Modified renderMindNode method to delegate connection mode clicks
  private renderMindNode(MindNode: MindNode): void {
    const nodeX = (MindNode as any).x;
    const nodeY = (MindNode as any).y;
    const isExpanded = this.descriptionExpanded.get(MindNode.id) || false;
    const MindNodeDiv = createMindNodeElement({
      mindNode: MindNode,
      x: nodeX,
      y: nodeY,
      descriptionExpanded: isExpanded,
      onToggleDescription: () => {  // Modified callback
        const curr = this.descriptionExpanded.get(MindNode.id) || false;
        this.descriptionExpanded.set(MindNode.id, !curr);
        const nodeEl = this.canvas.querySelector(`[data-mind-node-id="${MindNode.id}"]`);
        const descEl = nodeEl?.querySelector('.mindnode-description');
        if (descEl) {
          (descEl as HTMLElement).style.display = this.descriptionExpanded.get(MindNode.id) ? 'block' : 'none';
        }
      },
      onClick: (e, nodeEl) => {
        if (this.draggingMode) {
          e.stopPropagation();
          return;
        }
        if (this.connectionModeActive) {
          this.handleConnectionNodeClick(e, nodeEl);
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

  // NEW: Handler for connection mode node clicks
  private handleConnectionNodeClick(e: MouseEvent, nodeEl: HTMLDivElement): void {
    const nodeId = parseInt(nodeEl.dataset.mindNodeId!);
    if (this.pendingConnectionSource === null) {
      this.pendingConnectionSource = nodeId;
      nodeEl.classList.add("connection-source");
    } else {
      const sourceId = this.pendingConnectionSource;
      const targetId = nodeId;
      if (sourceId !== targetId) {
        this.addCustomConnection(sourceId, targetId);
      }
      this.deactivateConnectionMode();
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
        
        // Broadcast node addition
        this.broadcastOperation({
          type: 'node_add',
          parentId: parentId,
          label: newLabel,
          nodeId: newNode.id,
          timestamp: Date.now()
        });
        
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
        // Broadcast node deletion
        this.broadcastOperation({
          type: 'node_delete',
          nodeId: MindNodeId,
          timestamp: Date.now()
        });
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
      const defaultImageUrl = (node as any).imageUrl || "";
      const result = await showStyleModal(defaultText, defaultBg, defaultDesc, defaultImageUrl);
      if (result) {
        this.mindMap.updateMindNode(MindNodeId, result.text, result.description);
        this.updateMindNodeBackground(MindNodeId, result.background);
        this.updateMindNodeImage(MindNodeId, result.imageUrl);
        // Broadcast node update
        this.broadcastOperation({
          type: 'node_update',
          nodeId: MindNodeId,
          newLabel: result.text,
          newDescription: result.description,
          timestamp: Date.now()
        });
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
        zIndex: "2147483647" // updated z-index for fullscreen modals
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
      const parent = (document.fullscreenElement as HTMLElement) || this.container;
      parent.appendChild(modalOverlay);

      okButton.addEventListener("click", () => {
        const value = inputEl.value;
        parent.removeChild(modalOverlay);
        resolve(value);
      });
      cancelButton.addEventListener("click", () => {
        parent.removeChild(modalOverlay);
        resolve(null);
      });
    });
  }

  // Modified drawLine method:
  private drawLine(parent: MindNode, child: MindNode): void {
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
    line.className = 'connection'; // Keep base class
    line.dataset.connectionType = 'hierarchical'; // Add type identifier
    line.dataset.source = String(parent.id);
    line.dataset.target = String(child.id);

    // Add custom connection metadata if available
    const existingCustom = this.customConnections.find(c => 
      c.sourceId === parent.id && c.targetId === child.id
    );
    if (existingCustom) {
      line.dataset.connectionId = existingCustom.id;
      line.className += ' custom-connection';
    }

    // Unified click handler for all connections
    line.addEventListener("click", (e) => {
      e.stopPropagation();
      if (line.dataset.connectionId) {
        const connection = this.customConnections.find(c => c.id === line.dataset.connectionId);
        if (connection) {
          this.handleConnectionClick(connection, line);
        }
      } else {
        const tempConnection = {
          id: `temp-${line.dataset.source}-${line.dataset.target}`,
          sourceId: parseInt(line.dataset.source!),
          targetId: parseInt(line.dataset.target!),
          style: { color: "var(--mm-connection-color, #ced4da)", width: 6 }
        };
        this.handleConnectionClick(tempConnection, line);
      }
    });

    line.style.position = "absolute";
    line.style.zIndex = "0";
    line.style.height = "6px"; // default width is 6px
    line.style.width = length + "px";
    line.style.left = start.x + "px";
    line.style.top = start.y + "px";
    line.style.transformOrigin = "0 0";
    line.style.transform = `rotate(${angle}deg)`;

    // For hierarchical connections, use default styling if no custom exists
    if (!existingCustom) {
      line.style.background = "var(--mm-connection-color, #ced4da)";
    }
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

  // Enhanced connection click handler:
  private handleConnectionClick(conn: MindMapConnection, line: HTMLDivElement): void {
    const isCustom = line.classList.contains("custom-connection");
    const connectionId = line.dataset.connectionId;
    const connection = isCustom
      ? this.customConnections.find(c => c.id === connectionId)
      : {
          id: `temp-${line.dataset.source}-${line.dataset.target}`,
          sourceId: parseInt(line.dataset.source!),
          targetId: parseInt(line.dataset.target!),
          style: { color: "#ced4da", width: 6, dasharray: "" }
        };
    if (!connection) return;
    
    // Properly pass the current connection data to the modal
    const defaults = {
      sourceId: connection.sourceId,
      targetId: connection.targetId,
      color: connection.style?.color || "#ced4da",
      width: connection.style?.width || 6,
      dasharray: connection.style?.dasharray || "",
      label: connection.label || ""
    };

    showConnectionCustomizationModal(defaults).then(result => {
      if (result.action === "delete") {
        if (isCustom) {
          this.customConnections = this.customConnections.filter(c => c.id !== connectionId);
        }
        line.remove();
      } else if (result.action === "update") {
        if (!isCustom) {
          connection.id = this.generateConnectionId();
          this.customConnections.push({
            ...connection,
            style: {
              color: result.color,
              width: result.width,
              dasharray: result.dasharray
            },
            label: result.label
          });
        } else {
          const index = this.customConnections.findIndex(c => c.id === connectionId);
          this.customConnections[index] = {
            ...connection,
            style: {
              color: result.color,
              width: result.width,
              dasharray: result.dasharray
            },
            label: result.label
          };
        }
        this.render();
      }
      this.recordSnapshot();
    });
  }

  // Updated renderConnections method:
  private renderConnections(): void {
    // Clear existing hierarchical and custom connection elements, plus connection labels.
    this.canvas.querySelectorAll('.connection, .custom-connection, .connection-label').forEach(c => c.remove());

    // Render all hierarchical connections if no custom connection exists
    const renderHierarchical = (node: MindNode) => {
      node.children.forEach(child => {
        if (!this.customConnections.some(c => c.sourceId === node.id && c.targetId === child.id)) {
          this.drawLine(node, child);
        }
        renderHierarchical(child);
      });
    };
    renderHierarchical(this.mindMap.root);

    // Draw custom connections
    this.customConnections.forEach(conn => {
      const source = this.findMindNode(conn.sourceId);
      const target = this.findMindNode(conn.targetId);
      if (source && target) this.drawCustomConnection(source, target, conn);
    });
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

  // Updated exportAsSVG method
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

    // Draw hierarchical connections (only if custom connection doesn't exist)
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
                line.setAttribute("stroke-width", "6"); // Set stroke-width to 6
                svg.appendChild(line);
            }
        });
    });

    // NEW: Render custom connections and their labels
    this.customConnections.forEach(conn => {
      const source = this.findMindNode(conn.sourceId);
      const target = this.findMindNode(conn.targetId);
      if (source && target) {
        const sourceDims = nodeDimensions.get(source.id);
        const targetDims = nodeDimensions.get(target.id);
        if (sourceDims && targetDims) {
          const sourceRect = { x: (source as any).x, y: (source as any).y, width: this.MindNode_WIDTH, height: sourceDims.height };
          const targetRect = { x: (target as any).x, y: (target as any).y, width: this.MindNode_WIDTH, height: targetDims.height };
          const start = this.calculateEdgePoint(sourceRect, targetRect);
          const end = this.calculateEdgePoint(targetRect, sourceRect);
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", start.x.toString());
          line.setAttribute("y1", start.y.toString());
          line.setAttribute("x2", end.x.toString());
          line.setAttribute("y2", end.y.toString());
          line.setAttribute("stroke", conn.style?.color || "#ced4da");
          line.setAttribute("stroke-width", (conn.style?.width || 6).toString());
          if(conn.style?.dasharray) {
              line.setAttribute("stroke-dasharray", conn.style.dasharray);
          }
          svg.appendChild(line);
          
          if(conn.label) {
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", midX.toString());
            text.setAttribute("y", midY.toString());
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-family", "Arial, sans-serif");
            text.setAttribute("font-size", "12px");
            text.setAttribute("fill", "#2d3436");
            text.textContent = conn.label;
            svg.appendChild(text);
          }
        }
      }
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
        label.setAttribute("y", (y + 24).toString());
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-family", "Arial, sans-serif");
        label.setAttribute("font-size", "14px");
        label.setAttribute("fill", "#2d3436");
        label.setAttribute("font-weight", "600");
        label.textContent = mindNode.label;
        svg.appendChild(label);
        // Node description if expanded
        if (this.descriptionExpanded.get(nodeId)) {
            const descLines = this.wrapText(mindNode.description || "", dims.width - 20, 12);
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
        // Add image if available
        if ((mindNode as any).imageUrl) {
          const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
          img.setAttribute("href", (mindNode as any).imageUrl);
          img.setAttribute("x", (x + 10).toString());
          img.setAttribute("y", (y + dims.height - 100).toString());
          img.setAttribute("width", "120");
          img.setAttribute("height", "80");
          img.setAttribute("preserveAspectRatio", "xMidYMid meet");
          svg.appendChild(img);
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
    const modelData = JSON.parse(this.mindMap.toJSON());
    // NEW: Traverse all nodes to ensure imageUrl is always set
    const traverse = (node: any) => {
      if (!node) return; // added guard for undefined
      if (!('imageUrl' in node)) {
        node.imageUrl = "";
      }
      node.children && node.children.forEach((child: any) => traverse(child));
    };
    traverse(modelData.root);
    return JSON.stringify({
      model: modelData,
      canvasSize: this.canvasSize,
      virtualCenter: this.virtualCenter,
      manuallyPositioned: Array.from(this.manuallyPositionedNodes),
      viewport: { offsetX: this.offsetX, offsetY: this.offsetY, zoom: this.zoomLevel },
      customConnections: this.customConnections.map(conn => ({
        ...conn,
        style: {
          color: conn.style?.color || '#ced4da',
          width: conn.style?.width || 6,
          dasharray: conn.style?.dasharray || ''
        }
      })),
      version: "1.3"
    }, null, 2);
  }

  // Public method to import mindmap data from JSON (unified format)
  public fromJSON(jsonData: string): void {
    const data = JSON.parse(jsonData);
    this.mindMap.fromJSON(JSON.stringify(data.model));
    // NEW: Ensure each node has an imageUrl property after import
    const allNodes = this.getAllMindNodes();
    allNodes.forEach(node => {
      if (!(node as any).imageUrl) {
        (node as any).imageUrl = "";
      }
    });
    this.canvasSize = data.canvasSize;
    this.virtualCenter = data.virtualCenter;
    this.manuallyPositionedNodes = new Set(data.manuallyPositioned || []);
    this.customConnections = (data.customConnections || []).map((conn: any) => ({
      ...conn,
      style: {
        color: conn.style?.color || '#ced4da',
        width: conn.style?.width || 6,
        dasharray: conn.style?.dasharray || ''
      }
    }));
    if (data.viewport) {
      this.offsetX = data.viewport.offsetX;
      this.offsetY = data.viewport.offsetY;
      this.setZoom(data.viewport.zoom);
    }
    this.validateManualPositions();
    this.render();
  }

  public fromJSONWhileActive(jsonData: string): void {
    const data = JSON.parse(jsonData);
    this.mindMap.fromJSON(JSON.stringify(data.model));
    // NEW: Ensure each node has an imageUrl property after import
    const allNodes = this.getAllMindNodes();
    allNodes.forEach(node => {
      if (!(node as any).imageUrl) {
        (node as any).imageUrl = "";
      }
    });
    this.canvasSize = data.canvasSize;
    this.virtualCenter = data.virtualCenter;
    this.manuallyPositionedNodes = new Set(data.manuallyPositioned || []);
    this.customConnections = (data.customConnections || []).map((conn: any) => ({
      ...conn,
      style: {
        color: conn.style?.color || '#ced4da',
        width: conn.style?.width || 6,
        dasharray: conn.style?.dasharray || ''
      }
    }));
    if (data.viewport) {
      this.offsetX = data.viewport.offsetX;
      this.offsetY = data.viewport.offsetY;
      this.setZoom(data.viewport.zoom);
    }
    this.validateManualPositions();
    this.renderNoCenter();
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
    // --- long-press support ---
    let longPressTimer: number | null = null;
    let longPressTriggered = false;
    const LONG_PRESS_MS = 400;            // press-and-hold delay
    const MOVE_CANCEL_PX = 10;            // finger wiggle tolerance
    
    // When dragging starts
    const handleDragStart = (clientX: number, clientY: number, nodeDiv: HTMLDivElement) => {
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
    
    // Mouse events (unchanged)
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

        handleDragStart(e.clientX, e.clientY, target);
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

    /* ─────  touchstart  ───── */
    this.canvas.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        if (e.touches.length !== 1) return;              // ignore multi-touch here
        const target = e.target as HTMLDivElement;
        if (!target.dataset.mindNodeId) return;
        const touch = e.touches[0];
        const startTouchX = touch.clientX;
        const startTouchY = touch.clientY;
        /* schedule the long-press */
        longPressTimer = window.setTimeout(() => {
          // launch drag
          longPressTriggered = true;
          isDraggingNode = true;
          currentDraggedNode = target;
          target.style.cursor = "grabbing";
          const rect = this.canvas.getBoundingClientRect();
          nodeOffsetX =
            (startTouchX - rect.left - this.offsetX) / this.zoomLevel -
            parseFloat(target.style.left);
          nodeOffsetY =
            (startTouchY - rect.top - this.offsetY) / this.zoomLevel -
            parseFloat(target.style.top);
          handleDragStart(startTouchX, startTouchY, target);
        }, LONG_PRESS_MS);
      },
      { passive: true }
    );

    /* ─────  touchmove  ───── */
    this.canvas.addEventListener(
      "touchmove",
      (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        // 1️⃣ If we haven’t triggered yet → cancel long-press if finger moved too much
        if (!longPressTriggered && longPressTimer !== null) {
          const dx = touch.clientX - (e as any).targetTouches[0].clientX;
          const dy = touch.clientY - (e as any).targetTouches[0].clientY;
          if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          return;
        }
        // 2️⃣ If long-press is active → run the usual drag loop
        if (isDraggingNode && currentDraggedNode) {
          e.preventDefault(); // stop page scroll
          const rect = this.canvas.getBoundingClientRect();
          const rawX =
            (touch.clientX - rect.left - this.offsetX) / this.zoomLevel -
            nodeOffsetX;
          const rawY =
            (touch.clientY - rect.top - this.offsetY) / this.zoomLevel -
            nodeOffsetY;
          const x = Math.max(
            0,
            Math.min(this.canvasSize.width - currentDraggedNode.offsetWidth, rawX)
          );
          const y = Math.max(
            0,
            Math.min(this.canvasSize.height - currentDraggedNode.offsetHeight, rawY)
          );
          currentDraggedNode.style.left = `${x}px`;
          currentDraggedNode.style.top = `${y}px`;
          this.updateConnectionsForNode(currentDraggedNode);
        }
      },
      { passive: false }
    );

    /* ─────  touchend / touchcancel  ───── */
    ["touchend", "touchcancel"].forEach((evt) =>
      this.canvas.addEventListener(evt, () => {
        // abort pending long-press without drag
        if (!longPressTriggered && longPressTimer !== null) {
          clearTimeout(longPressTimer);
        }
        longPressTimer = null;
        // finish an active drag
        if (isDraggingNode && currentDraggedNode) {
          this.updateNodePositionInModel(currentDraggedNode);
          this.renderConnections();
          handleDragEnd(currentDraggedNode);
          this.recordSnapshot();
        }
        // reset state
        isDraggingNode = false;
        currentDraggedNode = null;
        longPressTriggered = false;
      })
    );
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
    
    // Broadcast node move operation
    const operation = {
      type: 'node_move',
      nodeId: nodeId,
      newX: x,
      newY: y,
      timestamp: Date.now()
    };
    this.broadcastOperation(operation);
    
    // ...existing code...
    this.updateAllConnectionsForNode(nodeId);
  }

  // New method to apply remote operations
  public applyRemoteOperation(operation: any): void {
    console.log('Remote operation received:', operation);
    switch (operation.type) {
      case 'node_move':
        this.updateNodeCoordinates(
          this.mindMap.root,
          Number(operation.nodeId),
          Number(operation.newX),
          Number(operation.newY)
        );
        break;
      case 'node_add':
        const newNode = this.mindMap.addMindNode(operation.parentId, operation.label);
        // Override the new node's ID with the provided one for consistency.
        (newNode as any).id = operation.nodeId;
        break;
      case 'node_delete':
        this.mindMap.deleteMindNode(operation.nodeId);
        break;
      case 'node_update':
        this.mindMap.updateMindNode(operation.nodeId, operation.newLabel, operation.newDescription);
        break;
      default:
        console.warn('Unhandled operation type:', operation.type);
    }
    console.log('Updated mind map state:', this.mindMap);
    this.render();
  }
  
  // New method to emit an event with payload
  private emit(event: string, payload: any): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach(callback => callback(payload));
    }
  }

  // New method to broadcast an operation
  private broadcastOperation(operation: any): void {
    this.emit('operation', operation);
  }

  // New method to subscribe to an event
  public on(event: string, callback: (payload: any) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  private updateAllConnectionsForNode(nodeId: number): void {
    // Simply re-render all connections.
    this.renderConnections();
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

  public findMindNode(id: number): MindNode | null {
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
  public async showImportModal(): Promise<string | null> {
    return new Promise((resolve) => {
      const modalOverlay = document.createElement("div");
      Object.assign(modalOverlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.4)", // Fixed: added missing comma and space
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "2147483647", // updated z-index for fullscreen modals
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
        position: "relative",
        zIndex: "2147483648" // updated to ensure modal is above overlay
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
        borderRadius: "12px", // changed from "8px" for more rounded corners
        fontFamily: "monospace",
        fontSize: "13px",
        resize: "vertical",
        marginBottom: "24px",
        background: "#d3d3d3", // changed from "#f8f9fa" for a slightly darker light grey background
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
      // FIX: Append the modal overlay to the document to display the modal
      const parent = (document.fullscreenElement as HTMLElement) || this.container;
      parent.appendChild(modalOverlay);
  
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
      id: this.generateConnectionId(),
      sourceId,
      targetId,
      style,
      label,
    };
    this.customConnections.push(connection);
    this.renderConnections();
  }

  private drawCustomConnection(
    source: MindNode,
    target: MindNode,
    connection: MindMapConnection
  ): void {
    const start = this.calculateEdgePoint(
      { x: (source as any).x, y: (source as any).y, width: this.MindNode_WIDTH, height: 40 },
      { x: (target as any).x, y: (target as any).y, width: this.MindNode_WIDTH, height: 40 }
    );
    const end = this.calculateEdgePoint(
      { x: (target as any).x, y: (target as any).y, width: this.MindNode_WIDTH, height: 40 },
      { x: (source as any).x, y: (source as any).y, width: this.MindNode_WIDTH, height: 40 }
    );
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    const line = document.createElement("div");
    Object.assign(line.style, {
      position: "absolute",
      zIndex: "0",
      background: connection.style?.color || "var(--mm-connection-color, #ced4da)",
      height: `${connection.style?.width || 6}px`,
      width: `${length}px`,
      left: `${start.x}px`,
      top: `${start.y}px`,
      transformOrigin: "0 0",
      transform: `rotate(${angle}deg)`,
      pointerEvents: "auto"
    });
    if (connection.style?.dasharray) {
      line.style.background = "none";
      line.style.borderTop = `${connection.style.width || 6}px dashed ${connection.style.color || "#ced4da"}`;
    }
    line.dataset.connectionId = connection.id;
    line.className = "custom-connection";
    line.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleConnectionClick(connection, line);
    });
    this.canvas.appendChild(line);
    
    if (connection.label) {
      const label = new ConnectionLabel(connection.label);
      label.setPosition((start.x + end.x) / 2, (start.y + end.y) / 2);
      // Add a class so the connection label is cleared on re-render.
      label.el.classList.add("connection-label");
      this.canvas.appendChild(label.el);
    }
  }

  // Updated connection mode activation: change cursor and add deactivation method
  public activateConnectionMode(): void {
    this.connectionModeActive = true;
    this.pendingConnectionSource = null;
    this.container.style.cursor = "crosshair";
    this.container.dispatchEvent(new CustomEvent("connectionModeChanged", { detail: true }));
  }

  public deactivateConnectionMode(): void {
    this.connectionModeActive = false;
    this.pendingConnectionSource = null;
    this.container.style.cursor = "grab";
    this.container.dispatchEvent(new CustomEvent("connectionModeChanged", { detail: false }));
  }

  // NEW: UUID generator for connection ids
  private generateConnectionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // NEW: Helper method to update a MindNode's image URL by traversing the tree.
  private updateMindNodeImage(MindNodeId: number, imageUrl: string): boolean {
    function traverse(node: any): boolean {
      if (node.id === MindNodeId) {
        node.imageUrl = imageUrl;
        return true;
      }
      return node.children.some((child: any) => traverse(child));
    }
    return traverse(this.mindMap.root);
  }

  // New public re-centering function
  public reCenter(): void {
    this.setZoom(1);
    const containerCenterX = this.container.clientWidth / 2;
    const containerCenterY = this.container.clientHeight / 2;
    this.offsetX = containerCenterX - this.virtualCenter.x * this.zoomLevel;
    this.offsetY = containerCenterY - this.virtualCenter.y * this.zoomLevel;
    this.updateCanvasTransform();
  }

  // NEW: Method to toggle theme
  public toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    if (this.theme === 'dark') {
      document.documentElement.style.setProperty("--mm-container-bg", "#1a1a1a");
      document.documentElement.style.setProperty("--mm-bg", "#2d2d2d");
      document.documentElement.style.setProperty("--mm-text", "#f0f0f0");
      document.documentElement.style.setProperty("--mm-node-bg", "#3d3d3d");
      document.documentElement.style.setProperty("--mm-node-text", "#ffffff");
      document.documentElement.style.setProperty("--mm-node-border-color", "#4d4d4d");
      document.documentElement.style.setProperty("--mm-description-bg", "#333333");
      document.documentElement.style.setProperty("--mm-description-text", "#cccccc");
      document.documentElement.style.setProperty("--mm-primary-dark", "#4dabf740");
      document.documentElement.style.setProperty("--mm-border-dark", "#5e5e5e");
    } else {
      document.documentElement.style.setProperty("--mm-container-bg", "#f8f9fa");
      document.documentElement.style.setProperty("--mm-bg", "#ffffff");
      document.documentElement.style.setProperty("--mm-text", "#2d3436");
      document.documentElement.style.setProperty("--mm-node-bg", "#ffffff");
      document.documentElement.style.setProperty("--mm-node-text", "#2d3436");
      document.documentElement.style.setProperty("--mm-node-border-color", "#e0e0e0");
      document.documentElement.style.setProperty("--mm-description-bg", "#f8f9fa");
      document.documentElement.style.setProperty("--mm-description-text", "#636e72");
      document.documentElement.style.setProperty("--mm-primary-dark", "");
      document.documentElement.style.setProperty("--mm-border-dark", "");
    }
    // Ensure the container uses the updated variable
    this.container.style.backgroundColor = "var(--mm-container-bg)";
  }

  // NEW: Function to apply remote changes based on JSON diff
  public applyRemoteChanges(remoteJson: string): void {
    const remoteState = JSON.parse(remoteJson);
    const remoteModel = remoteState.model.root;
    const localModel = JSON.parse(this.mindMap.toJSON()).root;
    const operations: any[] = [];
    
    // Helper to recursively diff nodes
    const diffNodes = (local: any, remote: any) => {
      // Compare coordinates and generate move operation if needed
      if (local.x !== remote.x || local.y !== remote.y) {
        operations.push({
          type: 'node_move',
          nodeId: remote.id,
          newX: remote.x,
          newY: remote.y,
          timestamp: Date.now()
        });
      }
      // Compare label and description; update if different
      if (local.label !== remote.label || local.description !== remote.description) {
        operations.push({
          type: 'node_update',
          nodeId: remote.id,
          newLabel: remote.label,
          newDescription: remote.description,
          timestamp: Date.now()
        });
      }
      
      const localChildrenMap: { [key: number]: any } = {};
      (local.children || []).forEach((child: any) => {
        localChildrenMap[child.id] = child;
      });
      const remoteChildrenMap: { [key: number]: any } = {};
      (remote.children || []).forEach((child: any) => {
        remoteChildrenMap[child.id] = child;
      });
      
      // Process remote children: additions or diff existing nodes recursively
      (remote.children || []).forEach((rChild: any) => {
        if (!localChildrenMap[rChild.id]) {
          operations.push({
            type: 'node_add',
            parentId: remote.id,
            label: rChild.label,
            nodeId: rChild.id,
            timestamp: Date.now()
          });
          // Diff children of the newly added node (compare against empty children)
          diffNodes({ id: rChild.id, children: [] }, rChild);
        } else {
          diffNodes(localChildrenMap[rChild.id], rChild);
        }
      });
      
      // Process deletions: any local child not present remotely
      (local.children || []).forEach((lChild: any) => {
        if (!remoteChildrenMap[lChild.id]) {
          operations.push({
            type: 'node_delete',
            nodeId: lChild.id,
            timestamp: Date.now()
          });
        }
      });
    };
    
    diffNodes(localModel, remoteModel);
    
    // Apply all computed operations
    operations.forEach(op => {
      this.applyRemoteOperation(op);
    });
    
    // Update canvas size if provided remotely
    if (remoteState.canvasSize) {
      this.canvasSize = remoteState.canvasSize;
      this.canvas.style.width = `${this.canvasSize.width}px`;
      this.canvas.style.height = `${this.canvasSize.height}px`;
    }
    
    // Update viewport if provided remotely
    if (remoteState.viewport) {
      this.offsetX = remoteState.viewport.offsetX;
      this.offsetY = remoteState.viewport.offsetY;
      this.setZoom(remoteState.viewport.zoom);
    }
    
    this.render();
  }

  // New public method to switch container to fullscreen
  public switchToFullscreen(): void {
    if (this.container.requestFullscreen) {
      this.container.requestFullscreen();
    } else if ((this.container as any).mozRequestFullScreen) { // Firefox
      (this.container as any).mozRequestFullScreen();
    } else if ((this.container as any).webkitRequestFullscreen) { // Chrome, Safari and Opera
      (this.container as any).webkitRequestFullscreen();
    } else if ((this.container as any).msRequestFullscreen) { // IE/Edge
      (this.container as any).msRequestFullscreen();
    }
  }

  /** Add a brand-new child node under `parentId`, then re-render */
  public addNode(parentId: number, label: string) {
    this.recordSnapshot();
    const node = this.mindMap.addMindNode(parentId, label);
    this.reCenter();
    this.render();
    return node;
  }

  /** Update the text (and optional description) of an existing node */
  public updateNode(id: number, newText: string, newDescription?: string) {
    this.recordSnapshot();
    this.mindMap.updateMindNode(id, newText, newDescription ?? "");
    this.render();
  }

  /** Delete node (and its subtree) by ID */
  public deleteNode(id: number) {
    this.recordSnapshot();
    this.mindMap.deleteMindNode(id);
    this.render();
  }

  /* ----------   Touch-gesture helpers   ---------- */
  private getTouchesDistance(t: TouchList): number {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.hypot(dx, dy);
  }
  private getTouchesCenter(t: TouchList): { x: number; y: number } {
    return {
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    };
  }
}

export { VisualMindMap };
