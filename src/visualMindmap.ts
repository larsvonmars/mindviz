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
  private svgCanvas!: SVGSVGElement; // SVG canvas for rendering connections
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
  private readonly MindNode_WIDTH = 160;  // Increased from 80
  private readonly MindNode_HEIGHT = 60;  // Added height parameter
  private readonly HORIZONTAL_GAP = 120;  // Increased from 80
  private readonly VERTICAL_GAP = 200;    // Increased from 200
  private readonly NODE_PADDING = 24;     // Added padding constant

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

  /*
   *  ⚙️ NEW CODE — configuration constant
   *  ------------------------------------
   *  How far to pull imported nodes ⟶ 2 ×   their original distance from the virtual centre.
   *  Increase this if you still see overlaps.
   */
  private readonly IMPORT_SPREAD_FACTOR = 1.3;

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

    // SVG canvas for connections
    this.svgCanvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    Object.assign(this.svgCanvas.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: `${this.canvasSize.width}px`,
      height: `${this.canvasSize.height}px`,
      pointerEvents: "none"
    });
    this.canvas.appendChild(this.svgCanvas);

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

  // NEW: Helper method to compute the subtree width for treeLayout.
  private computeSubtreeWidth(node: MindNode): number {
    if (node.hidden) return 0; // Hidden nodes contribute nothing to the width
    const visibleChildren = node.children.filter(child => !child.hidden);
    if (visibleChildren.length === 0) return this.MindNode_WIDTH;
    const childWidths = visibleChildren.map(child => this.computeSubtreeWidth(child));
    return childWidths.reduce((a, b) => a + b, 0) + (visibleChildren.length - 1) * this.HORIZONTAL_GAP;
  }

  // Implements radial layout for the mind map nodes
  private radialLayout(
    node: MindNode,
    x: number,
    y: number,
    depth: number,
    angleStart: number,
    angleEnd: number
  ): void {
    (node as any).x = x;
    (node as any).y = y;
    if (!node.expanded || node.children.length === 0) return;
    const visibleChildren = node.children.filter(child => !child.hidden);
    const childCount = visibleChildren.length;
    if (childCount === 0) return;
    const radius = 180 + depth * 80;
    const angleStep = (angleEnd - angleStart) / childCount;
    for (let i = 0; i < childCount; i++) {
      const angle = angleStart + i * angleStep + angleStep / 2;
      const childX = x + radius * Math.cos(angle);
      const childY = y + radius * Math.sin(angle);
      this.radialLayout(visibleChildren[i], childX, childY, depth + 1, angle - angleStep / 2, angle + angleStep / 2);
    }
  }

  // Updated treeLayout method: set nodes positions so they do not overlap.
  private treeLayout(node: MindNode, x: number, y: number): void {
    if (this.manuallyPositionedNodes.has(node.id)) {
      // Position children relative to manual node
      if (node.expanded && node.children.length > 0) {
        const visibleChildren = node.children.filter(child => !child.hidden);
        if (visibleChildren.length > 0) {
          let startX = (node as any).x - (visibleChildren.length * this.HORIZONTAL_GAP) / 2;
          visibleChildren.forEach(child => {
            if (!this.manuallyPositionedNodes.has(child.id)) {
              (child as any).x = startX;
              (child as any).y = (node as any).y + this.VERTICAL_GAP;
              startX += this.HORIZONTAL_GAP + this.MindNode_WIDTH;
            }
          });
        }
      }
      return;
    }
    (node as any).x = x;
    (node as any).y = y;
    // Process only visible children if expanded
    if (!node.expanded || node.children.length === 0) return;
    const visibleChildren = node.children.filter(child => !child.hidden);
    if (visibleChildren.length === 0) return;
    const totalWidth = visibleChildren
      .map(child => this.computeSubtreeWidth(child))
      .reduce((a, b) => a + b, 0) + (visibleChildren.length - 1) * this.HORIZONTAL_GAP;
    let startX = x - totalWidth / 2;
    for (const child of visibleChildren) {
      const childWidth = this.computeSubtreeWidth(child);
      const childCenterX = startX + childWidth / 2;
      this.treeLayout(child, childCenterX, y + this.VERTICAL_GAP);
      startX += childWidth + this.HORIZONTAL_GAP;
    }
  }

  // Modified renderMindNode method to delegate connection mode clicks
  private renderMindNode(MindNode: MindNode): void {
    if (MindNode.hidden) return; // Do not render hidden nodes
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

    // ===== ⚙️ NEW CODE — add inline expand/collapse button =====
    if (MindNode.children.length > 0) {
      const toggleBtn = document.createElement('div');
      // Set button text based on whether children are visible
      toggleBtn.textContent = MindNode.children.some(child => !child.hidden) ? '−' : '+';
      Object.assign(toggleBtn.style, {
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: 'var(--mm-node-bg, #fff)',
        border: '1px solid var(--mm-node-border-color, #adb5bd)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '600',
        lineHeight: '1',
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: '10001'
      });
      toggleBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.recordSnapshot();
        const shouldHide = MindNode.children.some(child => !child.hidden);
        const setHiddenRecursive = (node: MindNode, hidden: boolean) => {
          node.children.forEach(child => {
            child.hidden = hidden;
            setHiddenRecursive(child, hidden);
          });
        };
        setHiddenRecursive(MindNode, shouldHide);
        this.render();
      });
      MindNodeDiv.appendChild(toggleBtn);
    }

    MindNodeDiv.dataset.mindNodeId = String(MindNode.id);
    this.canvas.appendChild(MindNodeDiv);
    const eleWidth = MindNodeDiv.offsetWidth;
    MindNodeDiv.style.left = ((MindNode as any).x - eleWidth / 2) + "px";
    
    // Draw lines and recursively render only visible child MindNodes.
    for (let child of MindNode.children) {
      if (child.hidden) continue; // Skip hidden children
      // div-based connection removed; SVG connections rendered separately
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

  /** Clear all nodes and connections from the canvas */
  public clear(): void {
    this.canvas.innerHTML = '';
    this.svgCanvas.innerHTML = '';
  }

  /** Find a MindNode by id in the current MindMap */
  public findMindNode(id: number): MindNode | null {
    return this.mindMap.findMindNode(this.mindMap.root, id);
  }

  /** Add a custom connection and re-render */
  public addCustomConnection(
    sourceId: number,
    targetId: number,
    style?: { color?: string; width?: number; dasharray?: string },
    label?: string
  ): void {
    const id = this.generateConnectionId();
    this.customConnections.push({ id, sourceId, targetId, style, label });
    this.render();
  }

  /** Deactivate connection mode */
  public deactivateConnectionMode(): void {
    this.connectionModeActive = false;
    this.pendingConnectionSource = null;
    document.querySelectorAll('.connection-source').forEach(el => el.classList.remove('connection-source'));
  }


  /** Update a MindNode's background by traversing the tree */
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

  /** Update a MindNode's image URL by traversing the tree */
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

  /** Subscribe to events for remote syncing */
  public on(event: string, callback: (payload: any) => void): void {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(callback);
  }

  /** Broadcast an operation to listeners */
  public broadcastOperation(operation: any): void {
    const listeners = this.eventListeners[operation.type] || [];
    listeners.forEach(cb => cb(operation));
  }

  /** Apply a remote operation (invokes handlers) */
  public applyRemoteOperation(operation: any): void {
    const handlers = this.eventListeners[operation.type] || [];
    handlers.forEach(cb => cb(operation));
  }

  /** Serialize the current state (model and view) */
  public toJSON(): string {
    const model = JSON.parse(this.mindMap.toJSON());
    return JSON.stringify({
      model,
      customConnections: this.customConnections,
      viewport: { offsetX: this.offsetX, offsetY: this.offsetY, zoom: this.zoomLevel },
      canvasSize: this.canvasSize,
      virtualCenter: this.virtualCenter
    }, null, 2);
  }

  /** Load state from JSON and update view */
  public fromJSON(jsonStr: string): void {
    const data = JSON.parse(jsonStr);
    this.mindMap.fromJSON(JSON.stringify(data.model));
    this.customConnections = data.customConnections || [];
    if (data.viewport) {
      this.offsetX = data.viewport.offsetX;
      this.offsetY = data.viewport.offsetY;
      this.zoomLevel = data.viewport.zoom;
    }
    if (data.canvasSize) {
      this.canvasSize = data.canvasSize;
      this.canvas.style.width = `${this.canvasSize.width}px`;
      this.canvas.style.height = `${this.canvasSize.height}px`;
    }
    if (data.virtualCenter) {
      this.virtualCenter = data.virtualCenter;
    }
    this.renderNoCenter();
  }

  // Helper to get distance between two touch points
  private getTouchesDistance(touches: TouchList): number {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  // Helper to get center point between two touch points
  private getTouchesCenter(touches: TouchList): { x: number; y: number } {
    const [a, b] = [touches[0], touches[1]];
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  }

  // Enable nodes to be dragged freely
  private enableFreeformDragging(): void {
    // implemented elsewhere
  }

  // Auto-expand canvas if nodes go out of bounds
  private autoExpandCanvas(): void {
    // implemented elsewhere
  }

  /** Render all connections (custom and tree) as SVG lines */
  private renderConnections(): void {
    // Clear previous SVG content
    this.svgCanvas.innerHTML = "";

    // Draw tree connections (parent-child)
    const drawTreeConnections = (node: MindNode) => {
      if (!node.expanded || node.children.length === 0) return;
      for (const child of node.children) {
        if (child.hidden) continue;
        const x1 = (node as any).x;
        const y1 = (node as any).y;
        const x2 = (child as any).x;
        const y2 = (child as any).y;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(x1));
        line.setAttribute("y1", String(y1));
        line.setAttribute("x2", String(x2));
        line.setAttribute("y2", String(y2));
        line.setAttribute("stroke", "#adb5bd");
        line.setAttribute("stroke-width", "2");
        this.svgCanvas.appendChild(line);
        drawTreeConnections(child);
      }
    };
    drawTreeConnections(this.mindMap.root);

    // Draw custom connections
    for (const conn of this.customConnections) {
      const source = this.findMindNode(conn.sourceId);
      const target = this.findMindNode(conn.targetId);
      if (!source || !target) continue;
      const x1 = (source as any).x;
      const y1 = (source as any).y;
      const x2 = (target as any).x;
      const y2 = (target as any).y;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      // Draw a curved path (quadratic Bezier)
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2 - 40; // curve control point
      const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", conn.style?.color || "#4dabf7");
      path.setAttribute("stroke-width", String(conn.style?.width || 2));
      if (conn.style?.dasharray) {
        path.setAttribute("stroke-dasharray", conn.style.dasharray);
      }
      this.svgCanvas.appendChild(path);

      // Draw label if present
      if (conn.label) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", String(mx));
        label.setAttribute("y", String(my - 8));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "14");
        label.setAttribute("fill", "#333");
        label.textContent = conn.label;
        this.svgCanvas.appendChild(label);
      }
    }
  }

  /** Export the current mindmap as SVG string */
  public exportAsSVG(): string {
    return this.svgCanvas.outerHTML;
  }

  /** Show modal to import JSON state */
  public async showImportModal(): Promise<string | null> {
    return this.showModal("Paste JSON to import:");
  }

  /** Activate connection mode to draw custom connections */
  public activateConnectionMode(): void {
    this.connectionModeActive = true;
  }

  // UUID generator for connection ids
  private generateConnectionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => ((Math.random()*16|0)& (c==='x'?15:3)|8).toString(16));
  }

  // Custom modal placeholder
  private showModal(promptText: string, defaultText: string = ""): Promise<string | null> {
    // implemented elsewhere
    return Promise.resolve(null);
  }

}

export { VisualMindMap };
