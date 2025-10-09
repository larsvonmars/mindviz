"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualMindMap = void 0;
const mindmap_1 = require("./mindmap");
const styles_1 = require("./styles");
const Modal_1 = require("./Modal");
const MindNodeComponent_1 = require("./MindNodeComponent");
const Toolbar_1 = require("./Toolbar");
const ConnectionCustomizationModal_1 = require("./ConnectionCustomizationModal");
const ConnectionLabel_1 = require("./components/ConnectionLabel");
const config_1 = require("./config");
// Note: Theme colors are now managed in config.ts via themeManager
class VisualMindMap {
    recordSnapshot() {
        this.historyStack.push(this.toJSON());
        this.redoStack = [];
    }
    undo() {
        if (this.historyStack.length <= 1)
            return;
        const current = this.historyStack.pop();
        this.redoStack.push(current);
        const previous = this.historyStack[this.historyStack.length - 1];
        this.fromJSON(previous);
    }
    redo() {
        if (this.redoStack.length === 0)
            return;
        const redoState = this.redoStack.pop();
        this.historyStack.push(redoState);
        this.fromJSON(redoState);
    }
    constructor(container, mindMap, config = config_1.DEFAULT_MINDMAP_CONTAINER) {
        this.selectedMindNodeDiv = null; // new property for selection
        this.currentActionButtons = null; // new property for action buttons
        this.offsetX = 0; // panning offset X
        this.offsetY = 0; // panning offset Y
        // NEW: Properties for infinite canvas
        this.canvasSize = { width: 100000, height: 100000 };
        this.virtualCenter = { x: 50000, y: 50000 };
        this.zoomLevel = 1;
        this.currentLayout = 'radial';
        // NEW: Flag to toggle dragging mode
        this.draggingMode = false;
        // Add new property to track description expansion state
        this.descriptionExpanded = new Map();
        // Add property to track manually positioned nodes
        this.manuallyPositionedNodes = new Set();
        // Add action history properties and methods
        this.historyStack = [];
        this.redoStack = [];
        this.lastRenderState = null; // snapshot of last render to prevent redundant rerenders
        // Rendering optimization
        this.renderScheduled = false;
        // Constants for layout
        this.MindNode_WIDTH = 80;
        this.HORIZONTAL_GAP = 160; // increased gap to prevent overlap
        this.VERTICAL_GAP = 240; // increased gap to prevent overlap
        // Zoom constraints
        this.MIN_ZOOM = 0.1;
        this.MAX_ZOOM = 5;
        // NEW: Grid system properties
        this.GRID_SIZE = 80; // Increased size for better visibility
        this.gridEnabled = true;
        this.gridVisible = true;
        this.gridCtx = null; // Cached 2D context
        this.gridRenderScheduled = false; // rAF flag for grid redraws
        this.gridOccupancy = new Map(); // Track occupied grid cells
        this.nodePositions = new Map(); // Track node grid positions
        // NEW: Properties for custom connections
        this.customConnections = [];
        this.connectionIdCounter = 1;
        // NEW: Properties for connection mode
        this.connectionModeActive = false;
        this.pendingConnectionSource = null;
        // NEW: Event listeners registry
        this.eventListeners = {};
        // Store event listener references for cleanup
        this.eventListenerCleanup = [];
        /*
         *  ⚙️ NEW CODE — configuration constant
         *  ------------------------------------
         *  How far to pull imported nodes ⟶ 2 ×   their original distance from the virtual centre.
         *  Increase this if you still see overlaps.
         */
        this.IMPORT_SPREAD_FACTOR = 1.3;
        // Apply centralized container configuration
        (0, config_1.applyContainerConfig)(container, config);
        // Apply theme-aware styles
        Object.assign(container.style, {
            border: "1px solid var(--mm-border)",
            overflow: "hidden",
            cursor: "grab",
            position: "relative",
            backgroundColor: "var(--mm-container-bg)",
            color: "var(--mm-text)",
            touchAction: "none"
        });
        this.container = container;
        this.mindMap = mindMap;
        // Subscribe to theme changes
        this.themeUnsubscribe = config_1.themeManager.subscribe((theme) => {
            this.handleThemeChange(theme);
        });
        // Remove any existing toolbar to prevent duplicates
        const prevToolbar = this.container.querySelector('.mm-toolbar');
        if (prevToolbar) {
            prevToolbar.remove();
        }
        // Remove any existing canvas to prevent ghost nodes
        const prevCanvas = this.container.querySelector('.mm-canvas');
        if (prevCanvas) {
            prevCanvas.remove();
        }
        // NEW: Append the separated toolbar component.
        const toolbar = (0, Toolbar_1.createToolbar)(this);
        toolbar.classList.add('mm-toolbar');
        container.appendChild(toolbar);
        // Canvas styling
        this.canvas = document.createElement('div');
        this.canvas.classList.add('mm-canvas');
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
        // create the permanent SVG layer just once
        this.svgLayer = document.createElementNS(VisualMindMap.SVG_NS, "svg");
        Object.assign(this.svgLayer.style, {
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            overflow: "visible", pointerEvents: "none"
        });
        this.canvas.appendChild(this.svgLayer);
        this.ensureDefs();
        // NEW: Create and setup grid canvas
        // Grid canvas is positioned on the container, not inside the transformed canvas
        // This keeps it fixed in viewport coordinates
        this.gridCanvas = document.createElement("canvas");
        Object.assign(this.gridCanvas.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "0" // Above container bg but below canvas content
        });
        container.appendChild(this.gridCanvas); // Append to container, not canvas
        this.initializeGrid();
        // NEW: Panning event listeners (disabled when dragging mode is enabled)
        let isPanning = false, startX = 0, startY = 0;
        container.addEventListener("mousedown", (e) => {
            if (this.draggingMode)
                return;
            isPanning = true;
            startX = e.clientX;
            startY = e.clientY;
            container.style.cursor = "grabbing";
        });
        const mouseMoveHandler = (e) => {
            if (this.draggingMode || !isPanning)
                return;
            const dx = (e.clientX - startX) / this.zoomLevel;
            const dy = (e.clientY - startY) / this.zoomLevel;
            this.offsetX += dx;
            this.offsetY += dy;
            this.updateCanvasTransform();
            startX = e.clientX;
            startY = e.clientY;
        };
        const mouseUpHandler = () => {
            if (this.draggingMode)
                return;
            isPanning = false;
            container.style.cursor = "grab";
        };
        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
        this.eventListenerCleanup.push(() => {
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("mouseup", mouseUpHandler);
        });
        // NEW: Touch event listeners for panning on container
        let panRafId = null;
        let lastPanEvent = null;
        const handlePanMove = () => {
            if (!lastPanEvent || this.draggingMode || !isPanning) {
                panRafId = null;
                return;
            }
            const touch = lastPanEvent.touches[0];
            const dx = (touch.clientX - startX) / this.zoomLevel;
            const dy = (touch.clientY - startY) / this.zoomLevel;
            this.offsetX += dx;
            this.offsetY += dy;
            this.updateCanvasTransform();
            startX = touch.clientX;
            startY = touch.clientY;
            panRafId = null;
        };
        container.addEventListener("touchstart", (e) => {
            if (this.draggingMode)
                return;
            if (e.touches.length === 1) { // single touch to pan
                isPanning = true;
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                container.style.cursor = "grabbing";
            }
        }, { passive: true });
        container.addEventListener("touchmove", (e) => {
            if (this.draggingMode || !isPanning)
                return;
            if (e.touches.length === 1) {
                lastPanEvent = e;
                // Throttle pan updates with requestAnimationFrame
                if (!panRafId) {
                    panRafId = requestAnimationFrame(handlePanMove);
                }
            }
        }, { passive: true });
        container.addEventListener("touchend", (e) => {
            if (this.draggingMode)
                return;
            isPanning = false;
            container.style.cursor = "grab";
            lastPanEvent = null;
            if (panRafId) {
                cancelAnimationFrame(panRafId);
                panRafId = null;
            }
        }, { passive: true });
        /* ----------   Pinch-zoom & two-finger pan   ---------- */
        let pinchStartDist = null;
        let pinchStartZoom = 1;
        let pinchStartCenter = { x: 0, y: 0 };
        let pinchRafId = null;
        let lastPinchEvent = null;
        const handlePinchMove = () => {
            if (!lastPinchEvent || !pinchStartDist)
                return;
            const e = lastPinchEvent;
            const newDist = this.getTouchesDistance(e.touches);
            const scale = newDist / pinchStartDist;
            const newZoom = pinchStartZoom * scale; // Use setZoom for clamping
            const newCenter = this.getTouchesCenter(e.touches);
            const deltaX = (newCenter.x - pinchStartCenter.x) / this.zoomLevel;
            const deltaY = (newCenter.y - pinchStartCenter.y) / this.zoomLevel;
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            this.setZoom(newZoom); // setZoom handles clamping
            pinchStartDist = newDist;
            pinchStartCenter = newCenter;
            pinchRafId = null;
        };
        container.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
                pinchStartDist = this.getTouchesDistance(e.touches);
                pinchStartZoom = this.zoomLevel;
                pinchStartCenter = this.getTouchesCenter(e.touches);
            }
        }, { passive: true });
        container.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2 && pinchStartDist !== null) {
                e.preventDefault();
                lastPinchEvent = e;
                // Throttle pinch updates with requestAnimationFrame
                if (!pinchRafId) {
                    pinchRafId = requestAnimationFrame(handlePinchMove);
                }
            }
        }, { passive: false });
        container.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) {
                pinchStartDist = null;
                lastPinchEvent = null;
                if (pinchRafId) {
                    cancelAnimationFrame(pinchRafId);
                    pinchRafId = null;
                }
            }
        }, { passive: true });
        this.enableFreeformDragging();
        // NEW: Deselect node when clicking on empty canvas area.
        this.canvas.addEventListener("click", (e) => {
            if (e.target === this.canvas) {
                if (this.selectedMindNodeDiv) {
                    this.selectedMindNodeDiv.style.border = `1px solid ${styles_1.CSS_VARS.border}`;
                    this.selectedMindNodeDiv = null;
                }
                if (this.currentActionButtons) {
                    this.currentActionButtons.remove();
                    this.currentActionButtons = null;
                }
            }
        });
        // Unified keydown event listener for undo/redo and toggling dragging mode.
        const keydownHandler = (e) => {
            // Skip if focus is in an input, textarea, select, or any contentEditable element.
            const target = e.target;
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
        };
        document.addEventListener("keydown", keydownHandler);
        this.eventListenerCleanup.push(() => {
            document.removeEventListener("keydown", keydownHandler);
        });
    }
    updateCanvasTransform() {
        this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
        // Redraw grid on transform changes, throttled via rAF
        this.scheduleGridRender();
    }
    /**
     * Set the zoom level for the mindmap canvas
     * @param zoom - The desired zoom level (will be clamped between 0.1 and 5)
     */
    setZoom(zoom) {
        // Clamp zoom level to prevent invalid values
        this.zoomLevel = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, zoom));
        this.updateCanvasTransform();
    }
    // Schedule a grid redraw on the next animation frame
    scheduleGridRender() {
        if (this.gridRenderScheduled || !this.gridVisible)
            return;
        this.gridRenderScheduled = true;
        requestAnimationFrame(() => {
            this.gridRenderScheduled = false;
            this.renderGrid();
        });
    }
    // Take a snapshot of properties affecting rendering to detect changes
    captureRenderState() {
        return [
            this.mindMap.toJSON(),
            this.offsetX,
            this.offsetY,
            this.zoomLevel,
            config_1.themeManager.getTheme(),
            this.gridVisible,
            this.currentLayout
        ].join("|");
    }
    // Updated static constructor for React usage.
    // Use this method with a React ref to a container div:
    //   const visualMindMap = VisualMindMap.fromReactRef(containerRef, mindMap);
    static fromReactRef(containerRef, mindMap) {
        if (!containerRef.current) {
            throw new Error("Container ref is not assigned");
        }
        return new VisualMindMap(containerRef.current, mindMap);
    }
    /**
     * Render the mindmap with all nodes and connections
     * Uses requestAnimationFrame for optimal performance and prevents redundant renders
     */
    render() {
        // Debounce rendering using requestAnimationFrame
        if (this.renderScheduled)
            return;
        this.renderScheduled = true;
        requestAnimationFrame(() => {
            this.renderScheduled = false;
            this._doRender();
        });
    }
    // Internal render implementation
    _doRender() {
        const stateBefore = this.captureRenderState();
        if (stateBefore === this.lastRenderState)
            return;
        this.canvas.innerHTML = "";
        this.canvas.appendChild(this.svgLayer); // re-attach SVG layer
        // Grid canvas is on container, not on canvas, so no need to re-attach
        // Clear grid occupancy before layout
        this.gridOccupancy.clear();
        this.nodePositions.clear();
        // Render grid
        this.renderGrid();
        const centerX = this.virtualCenter.x;
        const centerY = this.virtualCenter.y;
        if (this.currentLayout === 'radial') {
            this.radialLayout(this.mindMap.root, centerX, centerY, 0, 0, 2 * Math.PI);
        }
        else {
            this.treeLayout(this.mindMap.root, centerX, centerY);
        }
        this.renderMindNode(this.mindMap.root);
        // this.autoExpandCanvas(); // Removed: method does not exist
        this.renderConnections();
        // Record initial state if undo history is empty.
        if (this.historyStack.length === 0) {
            this.recordSnapshot();
        }
        this.lastRenderState = this.captureRenderState();
    }
    /**
     * Render the mindmap without re-centering the viewport
     * Useful when updating nodes to maintain the current view
     */
    renderNoCenter() {
        const stateBefore = this.captureRenderState();
        if (stateBefore === this.lastRenderState)
            return;
        this.canvas.innerHTML = "";
        this.canvas.appendChild(this.svgLayer); // re-attach SVG layer
        // Grid canvas is on container, not on canvas, so no need to re-attach
        // Clear grid occupancy before layout
        this.gridOccupancy.clear();
        this.nodePositions.clear();
        // Render grid
        this.renderGrid();
        // Use the root node’s current position if available, otherwise default to virtualCenter.
        const rootNode = this.mindMap.root;
        const currentX = rootNode.x !== undefined ? rootNode.x : this.virtualCenter.x;
        const currentY = rootNode.y !== undefined ? rootNode.y : this.virtualCenter.y;
        if (this.currentLayout === 'radial') {
            this.radialLayout(rootNode, currentX, currentY, 0, 0, 2 * Math.PI);
        }
        else {
            this.treeLayout(rootNode, currentX, currentY);
        }
        this.renderMindNode(rootNode);
        // Immediately disable any transition effects.
        this.canvas.style.transition = "none";
        // Render connections as usual.
        this.renderConnections();
        this.lastRenderState = this.captureRenderState();
    }
    // New radial layout method: positions MindNode using polar coordinates with grid snapping.
    radialLayout(MindNode, centerX, centerY, depth, minAngle, maxAngle) {
        if (this.manuallyPositionedNodes.has(MindNode.id)) {
            return; // Skip auto-layout for manually positioned nodes
        }
        const radius = depth * this.HORIZONTAL_GAP * 1.5;
        const angle = (minAngle + maxAngle) / 2;
        let x = centerX + radius * Math.cos(angle);
        let y = centerY + radius * Math.sin(angle);
        if (this.gridEnabled) {
            const snapped = this.snapToGrid(x, y);
            x = snapped.x;
            y = snapped.y;
        }
        MindNode.x = x;
        MindNode.y = y;
        if (MindNode.expanded && MindNode.children.length > 0) {
            const angleSlice = (maxAngle - minAngle) / MindNode.children.length;
            for (let i = 0; i < MindNode.children.length; i++) {
                const child = MindNode.children[i];
                const childMinAngle = minAngle + i * angleSlice;
                const childMaxAngle = childMinAngle + angleSlice;
                this.radialLayout(child, centerX, centerY, depth + 1, childMinAngle, childMaxAngle);
            }
        }
    }
    // NEW: Helper method to compute the subtree width for treeLayout.
    getSubtreeWidth(MindNode) {
        if (!MindNode.expanded || MindNode.children.length === 0) {
            return 1; // Each node takes up 1 grid unit of width
        }
        let width = 0;
        for (const child of MindNode.children) {
            width += this.getSubtreeWidth(child);
        }
        return width;
    }
    // Updated treeLayout method: set nodes positions with grid snapping to prevent overlaps.
    treeLayout(MindNode, x, y) {
        if (this.manuallyPositionedNodes.has(MindNode.id)) {
            return; // Skip auto-layout for manually positioned nodes
        }
        if (this.gridEnabled) {
            const snapped = this.snapToGrid(x, y);
            x = snapped.x;
            y = snapped.y;
        }
        MindNode.x = x;
        MindNode.y = y;
        if (MindNode.expanded && MindNode.children.length > 0) {
            const childrenTotalWidth = this.getSubtreeWidth(MindNode) * this.GRID_SIZE;
            let childX = x - childrenTotalWidth / 2;
            const childY = y + this.VERTICAL_GAP;
            for (const child of MindNode.children) {
                const childSubtreeWidth = this.getSubtreeWidth(child) * this.GRID_SIZE;
                this.treeLayout(child, childX + childSubtreeWidth / 2, childY);
                childX += childSubtreeWidth;
            }
        }
    }
    // Modified renderMindNode method to delegate connection mode clicks
    renderMindNode(MindNode) {
        if (MindNode.hidden)
            return; // Do not render hidden nodes
        const nodeX = MindNode.x;
        const nodeY = MindNode.y;
        const isExpanded = this.descriptionExpanded.get(MindNode.id) || false;
        const MindNodeDiv = (0, MindNodeComponent_1.createMindNodeElement)({
            mindNode: MindNode,
            x: nodeX,
            y: nodeY,
            descriptionExpanded: isExpanded,
            shape: MindNode.shape,
            onToggleDescription: () => {
                const curr = this.descriptionExpanded.get(MindNode.id) || false;
                this.descriptionExpanded.set(MindNode.id, !curr);
                const nodeEl = this.canvas.querySelector(`[data-mind-node-id="${MindNode.id}"]`);
                const descEl = nodeEl?.querySelector('.mindnode-description');
                if (descEl) {
                    descEl.style.display = this.descriptionExpanded.get(MindNode.id) ? 'block' : 'none';
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
                const setHiddenRecursive = (node, hidden) => {
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
        MindNodeDiv.style.left = (MindNode.x - eleWidth / 2) + "px";
        // Draw lines and recursively render only visible child MindNodes.
        for (let child of MindNode.children) {
            if (child.hidden)
                continue; // Skip hidden children
            this.drawLine(MindNode, child);
            this.renderMindNode(child);
        }
    }
    // NEW: Handler for connection mode node clicks
    handleConnectionNodeClick(e, nodeEl) {
        const nodeId = parseInt(nodeEl.dataset.mindNodeId);
        if (this.pendingConnectionSource === null) {
            this.pendingConnectionSource = nodeId;
            nodeEl.classList.add("connection-source");
        }
        else {
            const sourceId = this.pendingConnectionSource;
            const targetId = nodeId;
            if (sourceId !== targetId) {
                this.addCustomConnection(sourceId, targetId);
            }
            this.deactivateConnectionMode();
        }
    }
    // New helper method to get SVG icons for buttons
    getIconForAction(action) {
        const icons = {
            'Add Child': '<path d="M12 5v14M5 12h14"/>',
            'Delete MindNode': '<path d="M19 6L5 18M5 6l14 12"/>',
            'Edit MindNode': '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
            'MindNode Style': '<path d="M3 16l7-7 2 2 5-5m-2-1l2 2m-13 7l2 2M3 6c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>'
        };
        return icons[action] || '';
    }
    // Modified selectMindNode method for centered action buttons under the MindNode.
    selectMindNode(e, MindNodeDiv) {
        // Deselect previous MindNode if any.
        if (this.selectedMindNodeDiv) {
            this.selectedMindNodeDiv.style.border = `1px solid ${styles_1.CSS_VARS.border}`;
        }
        MindNodeDiv.style.border = `2px solid ${styles_1.CSS_VARS.primary}`;
        this.selectedMindNodeDiv = MindNodeDiv;
        if (this.currentActionButtons)
            this.currentActionButtons.remove();
        const actionDiv = document.createElement("div");
        Object.assign(actionDiv.style, {
            position: "absolute",
            background: styles_1.CSS_VARS.background,
            border: `1px solid ${styles_1.CSS_VARS.border}`,
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
        const createButton = (text, clickHandler) => {
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
            const parentId = parseInt(MindNodeDiv.dataset.mindNodeId);
            this.recordSnapshot(); // record state before addition
            const result = await (0, Modal_1.showAddNodeModal)("Add Child Node");
            if (result) {
                const parentNode = this.findMindNode(parentId);
                if (!parentNode)
                    return;
                const newNode = this.mindMap.addMindNode(parentId, result.label);
                newNode.description = result.description;
                // Broadcast node addition
                this.broadcastOperation({
                    type: 'node_add',
                    parentId: parentId,
                    label: result.label,
                    description: result.description,
                    nodeId: newNode.id,
                    timestamp: Date.now()
                });
                // Re-render to apply automatic layout to the new node
                this.renderNoCenter();
            }
        });
        const deleteButton = createButton("Delete MindNode", (e) => {
            e.stopPropagation();
            const MindNodeId = parseInt(MindNodeDiv.dataset.mindNodeId);
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
            }
            catch (err) {
                alert(err);
            }
        });
        const editButton = createButton("Edit Node", async (e) => {
            e.stopPropagation();
            const MindNodeId = parseInt(MindNodeDiv.dataset.mindNodeId);
            const node = this.findMindNode(MindNodeId);
            if (!node)
                return;
            const defaultText = node.label;
            const defaultBg = MindNodeDiv.style.background;
            const defaultDesc = node.description || '';
            const defaultImageUrl = node.imageUrl || "";
            const defaultShape = node.shape;
            const result = await (0, Modal_1.showStyleModal)(defaultText, defaultBg, defaultDesc, defaultImageUrl, defaultShape);
            if (result) {
                this.mindMap.updateMindNode(MindNodeId, result.text, result.description);
                this.updateMindNodeBackground(MindNodeId, result.background);
                this.updateMindNodeImage(MindNodeId, result.imageUrl);
                // apply shape
                node.shape = result.shape;
                // Broadcast node update
                this.broadcastOperation({
                    type: 'node_update',
                    nodeId: MindNodeId,
                    newLabel: result.text,
                    newDescription: result.description,
                    newShape: result.shape,
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
    extractSolidColor(bg) {
        const match = bg.match(/#[0-9a-f]{3,6}|rgb(a?)\([^)]+\)/i);
        return match ? match[0] : null;
    }
    // New helper method to validate CSS color values.
    isValidColor(value) {
        const style = new Option().style;
        style.backgroundColor = value;
        return style.backgroundColor !== '';
    }
    // NEW: Helper method to update a MindNode's background by traversing the tree.
    updateMindNodeBackground(MindNodeId, background) {
        function traverse(MindNode) {
            if (MindNode.id === MindNodeId) {
                MindNode.background = background;
                return true;
            }
            for (let child of MindNode.children) {
                if (traverse(child))
                    return true;
            }
            return false;
        }
        return traverse(this.mindMap.root);
    }
    // NEW: Helper method to update a MindNode's description by traversing the tree.
    updateMindNodeDescription(MindNodeId, description) {
        function traverse(MindNode) {
            if (MindNode.id === MindNodeId) {
                MindNode.description = description;
                return true;
            }
            for (let child of MindNode.children) {
                if (traverse(child))
                    return true;
            }
            return false;
        }
        return traverse(this.mindMap.root);
    }
    // Modified drawLine method:
    drawLine(parent, child) {
        const s = this.edgePoint(parent, child), t = this.edgePoint(child, parent);
        this.createSVGPath(`h-${parent.id}-${child.id}`, s.x, s.y, t.x, t.y, {}, false, (ev) => {
            ev.stopPropagation();
            const temp = {
                id: `temp-${parent.id}-${child.id}`,
                sourceId: parent.id,
                targetId: child.id,
                style: { color: "#ced4da", width: 4 }
            };
            this.handleConnectionClick(temp, ev);
        });
    }
    // NEW: Handler for connection click (hierarchical or custom)
    async handleConnectionClick(connection, ev) {
        ev.stopPropagation();
        // Open customization modal with current connection defaults
        const { sourceId, targetId, style = {}, label } = connection;
        try {
            const result = await (0, ConnectionCustomizationModal_1.showConnectionCustomizationModal)({
                sourceId,
                targetId,
                color: style.color,
                width: style.width,
                dasharray: style.dasharray,
                label,
                arrowHead: style.arrowHead,
                arrowType: style.arrowType
            });
            if (!result) {
                // User cancelled, do nothing
                return;
            }
            if (result.action === 'update') {
                const newStyle = {
                    color: result.color,
                    width: result.width,
                    dasharray: result.dasharray,
                    arrowHead: result.arrowHead,
                    arrowType: result.arrowType
                };
                const newLabel = result.label;
                // Find existing custom connection
                const idx = this.customConnections.findIndex(c => c.id === connection.id);
                if (idx >= 0) {
                    this.customConnections[idx].style = newStyle;
                    this.customConnections[idx].label = newLabel;
                }
                else {
                    // Add as new custom connection
                    this.customConnections.push({
                        id: connection.id,
                        sourceId,
                        targetId,
                        style: newStyle,
                        label: newLabel
                    });
                }
                this.recordSnapshot(); // Record state after connection update
            }
            else if (result.action === 'delete') {
                // Remove custom connection if exists
                const idx = this.customConnections.findIndex(c => c.id === connection.id);
                if (idx >= 0) {
                    this.customConnections.splice(idx, 1);
                    this.recordSnapshot(); // Record state after connection deletion
                }
            }
            // Re-render connections to reflect changes
            this.render();
        }
        catch (err) {
            console.error('Connection customization error:', err);
            // Silently handle cancellation
        }
    }
    ensureDefs() {
        if (this.svgLayer.querySelector("defs"))
            return;
        const defs = document.createElementNS(VisualMindMap.SVG_NS, "defs");
        // Default triangle arrowhead
        const marker = document.createElementNS(VisualMindMap.SVG_NS, "marker");
        marker.setAttribute("id", VisualMindMap.ARROW_ID);
        marker.setAttribute("markerWidth", "8");
        marker.setAttribute("markerHeight", "8");
        marker.setAttribute("refX", "6");
        marker.setAttribute("refY", "3");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "strokeWidth");
        const path = document.createElementNS(VisualMindMap.SVG_NS, "path");
        path.setAttribute("d", "M0 0 L6 3 L0 6 Z");
        path.setAttribute("fill", "var(--mm-connection-color, #ced4da)");
        marker.appendChild(path);
        defs.appendChild(marker);
        // Circle arrowhead
        const markerCircle = marker.cloneNode(true);
        markerCircle.setAttribute('id', 'mm-arrow-circle');
        markerCircle.removeChild(markerCircle.firstChild);
        const circle = document.createElementNS(VisualMindMap.SVG_NS, 'circle');
        circle.setAttribute('cx', '3');
        circle.setAttribute('cy', '3');
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', 'var(--mm-connection-color, #ced4da)');
        markerCircle.appendChild(circle);
        defs.appendChild(markerCircle);
        // Diamond arrowhead
        const markerDiamond = marker.cloneNode(true);
        markerDiamond.setAttribute('id', 'mm-arrow-diamond');
        markerDiamond.removeChild(markerDiamond.firstChild);
        const diamond = document.createElementNS(VisualMindMap.SVG_NS, 'path');
        diamond.setAttribute('d', 'M3,0 L6,3 L3,6 L0,3 Z');
        diamond.setAttribute('fill', 'var(--mm-connection-color, #ced4da)');
        markerDiamond.appendChild(diamond);
        defs.appendChild(markerDiamond);
        this.svgLayer.appendChild(defs);
    }
    makePathD(x1, y1, x2, y2) {
        const dx = (x2 - x1) * 0.3, dy = (y2 - y1) * 0.3;
        const c1x = x1 + dx, c1y = y1 + dy;
        const c2x = x2 - dx, c2y = y2 - dy;
        return `M${x1},${y1} C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`;
    }
    createSVGPath(id, x1, y1, x2, y2, style, isCustom, onClick) {
        const p = document.createElementNS(VisualMindMap.SVG_NS, "path");
        // Always draw straight lines for connections
        p.setAttribute("d", `M${x1},${y1} L${x2},${y2}`);
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", style.color || "var(--mm-connection-color, #ced4da)");
        p.setAttribute("stroke-width", (style.width ?? 4).toString());
        if (style.dasharray)
            p.setAttribute("stroke-dasharray", style.dasharray);
        // Handle arrowhead visibility and type
        if (style.arrowHead !== false) {
            const atype = style.arrowType || 'triangle';
            let markerId = VisualMindMap.ARROW_ID;
            if (atype === 'circle')
                markerId = 'mm-arrow-circle';
            else if (atype === 'diamond')
                markerId = 'mm-arrow-diamond';
            p.setAttribute("marker-end", `url(#${markerId})`);
        }
        p.style.cursor = "pointer";
        p.style.pointerEvents = "all";
        p.style.transition = "stroke .25s, stroke-width .25s";
        p.addEventListener("mouseenter", () => {
            p.setAttribute("stroke-width", ((style.width ?? 4) * 1.5).toString());
            p.setAttribute("stroke", "var(--mm-highlight, #4dabf7)");
        });
        p.addEventListener("mouseleave", () => {
            p.setAttribute("stroke-width", (style.width ?? 4).toString());
            p.setAttribute("stroke", style.color || "var(--mm-connection-color, #ced4da)");
        });
        p.addEventListener("click", onClick);
        if (isCustom)
            p.dataset.connectionId = id;
        p.dataset.connectionType = isCustom ? "custom" : "hierarchical";
        this.svgLayer.appendChild(p);
        return p;
    }
    // rename & simplify edge-point calculation
    edgePoint(source, target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const ang = Math.atan2(dy, dx);
        const w = this.MindNode_WIDTH; // node width constant
        const h = 40; // fixed node-height used elsewhere
        return {
            x: source.x + Math.cos(ang) * (w / 2),
            y: source.y + Math.sin(ang) * (h / 2),
        };
    }
    // rewritten to clear SVG and repaint all Bézier connections
    renderConnections() {
        this.svgLayer.innerHTML = "";
        this.ensureDefs();
        this.canvas.querySelectorAll('.connection-label').forEach(l => l.remove());
        const walk = (n) => {
            if (n.hidden)
                return;
            n.children.forEach(ch => {
                if (ch.hidden)
                    return;
                if (!this.customConnections.some(cc => cc.sourceId === n.id && cc.targetId === ch.id)) {
                    this.drawLine(n, ch);
                }
                walk(ch);
            });
        };
        walk(this.mindMap.root);
        this.customConnections.forEach(cc => {
            const s = this.findMindNode(cc.sourceId), t = this.findMindNode(cc.targetId);
            if (s && t && !s.hidden && !t.hidden)
                this.drawCustomConnection(s, t, cc);
        });
    }
    // simplify connection-update hooks
    updateConnectionsForNode(_n) { this.renderConnections(); }
    updateAllConnectionsForNode(_id) { this.renderConnections(); }
    /**
     * Export the mindmap as an SVG file
     * Creates a downloadable SVG representation of the current mindmap state
     */
    exportAsSVG() {
        try {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const nodeDivs = this.canvas.querySelectorAll('[data-mind-node-id]');
            const MindNodes = this.getAllNodes();
            if (MindNodes.length === 0) {
                console.warn('No nodes to export');
                return;
            }
            // Capture node dimensions from DOM
            const nodeDimensions = new Map();
            nodeDivs.forEach(div => {
                const nodeIdStr = div.dataset.mindNodeId;
                if (nodeIdStr) {
                    const nodeId = parseInt(nodeIdStr);
                    if (!isNaN(nodeId)) {
                        nodeDimensions.set(nodeId, {
                            width: div.offsetWidth,
                            height: div.offsetHeight
                        });
                    }
                }
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
                        line.setAttribute("x1", parent.x.toString());
                        line.setAttribute("y1", (parent.y + parentDims.height / 2).toString());
                        line.setAttribute("x2", child.x.toString());
                        line.setAttribute("y2", (child.y - childDims.height / 2).toString());
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
                        const sourceRect = { x: source.x, y: source.y, width: this.MindNode_WIDTH, height: sourceDims.height };
                        const targetRect = { x: target.x, y: target.y, width: this.MindNode_WIDTH, height: targetDims.height };
                        const start = this.calculateEdgePoint(sourceRect, targetRect);
                        const end = this.calculateEdgePoint(targetRect, sourceRect);
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute("x1", start.x.toString());
                        line.setAttribute("y1", start.y.toString());
                        line.setAttribute("x2", end.x.toString());
                        line.setAttribute("y2", end.y.toString());
                        line.setAttribute("stroke", conn.style?.color || "#ced4da");
                        line.setAttribute("stroke-width", (conn.style?.width || 6).toString());
                        if (conn.style?.dasharray) {
                            line.setAttribute("stroke-dasharray", conn.style.dasharray);
                        }
                        svg.appendChild(line);
                        if (conn.label) {
                            const midX = (start.x + end.x) / 2;
                            const midY = (start.y + end.y) / 2;
                            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                            text.setAttribute("x", midX.toString());
                            text.setAttribute("y", midY.toString());
                            text.setAttribute("text-anchor", "middle");
                            text.setAttribute("font-family", "Arial, sans-serif");
                            text.setAttribute("font-size", "12px");
                            text.setAttribute("fill", styles_1.CSS_VARS.text);
                            text.textContent = conn.label;
                            svg.appendChild(text);
                        }
                    }
                }
            });
            // Draw nodes
            nodeDivs.forEach(div => {
                const nodeId = parseInt(div.dataset.mindNodeId);
                const mindNode = this.findMindNode(nodeId);
                if (!mindNode)
                    return;
                const dims = nodeDimensions.get(nodeId);
                if (!dims)
                    return;
                const x = mindNode.x - dims.width / 2;
                const y = mindNode.y - dims.height / 2;
                // Node rectangle with background color
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", x.toString());
                rect.setAttribute("y", y.toString());
                rect.setAttribute("width", dims.width.toString());
                rect.setAttribute("height", dims.height.toString());
                rect.setAttribute("rx", "8");
                const bgColor = this.extractSolidColor(div.style.backgroundColor) || "#ffffff";
                rect.setAttribute("fill", bgColor);
                rect.setAttribute("stroke", styles_1.CSS_VARS.border);
                rect.setAttribute("stroke-width", "1");
                svg.appendChild(rect);
                // Node label
                const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", mindNode.x.toString());
                label.setAttribute("y", (y + 24).toString());
                label.setAttribute("text-anchor", "middle");
                label.setAttribute("font-family", "Arial, sans-serif");
                label.setAttribute("font-size", "14px");
                label.setAttribute("fill", styles_1.CSS_VARS.text);
                label.setAttribute("font-weight", "600");
                label.textContent = mindNode.label;
                svg.appendChild(label);
                // Node description if expanded
                if (this.descriptionExpanded.get(nodeId)) {
                    const descLines = this.wrapText(mindNode.description || "", dims.width - 20, 12);
                    const desc = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    desc.setAttribute("x", mindNode.x.toString());
                    desc.setAttribute("y", (y + 40).toString());
                    desc.setAttribute("text-anchor", "middle");
                    desc.setAttribute("font-family", "Arial, sans-serif");
                    desc.setAttribute("font-size", "12px");
                    desc.setAttribute("fill", styles_1.CSS_VARS.textSecondary);
                    descLines.forEach((line, i) => {
                        const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                        tspan.setAttribute("x", mindNode.x.toString());
                        tspan.setAttribute("dy", i === 0 ? "0" : "1.2em");
                        tspan.textContent = line;
                        desc.appendChild(tspan);
                    });
                    svg.appendChild(desc);
                }
                // Add image if available
                if (mindNode.imageUrl) {
                    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                    img.setAttribute("href", mindNode.imageUrl);
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
        catch (error) {
            console.error('Error exporting SVG:', error);
            throw new Error(`Failed to export SVG: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Added helper method to wrap text into multiple lines
    wrapText(text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || "";
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const testWidth = testLine.length * fontSize * 0.6; // Approximate width
            if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            }
            else {
                currentLine = testLine;
            }
        }
        if (currentLine)
            lines.push(currentLine);
        return lines;
    }
    // Public method to export mindmap data as JSON (unified format)
    toJSON() {
        const modelData = JSON.parse(this.mindMap.toJSON());
        // NEW: Traverse all nodes to ensure imageUrl is always set
        const traverse = (node) => {
            if (!node)
                return; // added guard for undefined
            if (!('imageUrl' in node)) {
                node.imageUrl = "";
            }
            node.children && node.children.forEach((child) => traverse(child));
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
    /**
     * Initialize a basic mindmap with a root node called "root"
     * Used as a fallback when no valid data is available
     */
    initializeBasicMindmap() {
        // Create a basic root node
        const basicRoot = new mindmap_1.MindNode(0, 'root');
        this.mindMap.root = basicRoot;
        // Reset to default settings
        this.canvasSize = { width: 100000, height: 100000 };
        this.virtualCenter = { x: 50000, y: 50000 };
        this.manuallyPositionedNodes = new Set();
        this.customConnections = [];
        this.offsetX = 0;
        this.offsetY = 0;
        this.setZoom(1);
    }
    /**
     * Import mindmap data from JSON (unified format)
     * Accepts either a JSON string or a parsed object
     * @param data - JSON string or object containing mindmap data
     * Falls back to basic mindmap with root node "root" if data is invalid
     */
    fromJSON(data) {
        try {
            if (!data) {
                throw new Error('No data provided to fromJSON');
            }
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid data format');
            }
            if (!parsed.model || !parsed.model.root) {
                throw new Error('Missing required model data');
            }
            this.mindMap.fromJSON(JSON.stringify(parsed.model));
            // Ensure each node has an imageUrl property after import
            const allNodes = this.getAllNodes();
            allNodes.forEach(node => {
                if (!node.imageUrl) {
                    node.imageUrl = "";
                }
            });
            // Restore canvas size with defaults
            this.canvasSize = parsed.canvasSize || { width: 100000, height: 100000 };
            this.virtualCenter = parsed.virtualCenter || { x: 50000, y: 50000 };
            this.manuallyPositionedNodes = new Set(parsed.manuallyPositioned || []);
            // Restore custom connections with validation
            this.customConnections = (parsed.customConnections || []).map((conn) => ({
                ...conn,
                style: {
                    color: conn.style?.color || '#ced4da',
                    width: conn.style?.width || 6,
                    dasharray: conn.style?.dasharray || ''
                }
            }));
            // Restore viewport if available
            if (parsed.viewport) {
                this.offsetX = parsed.viewport.offsetX || 0;
                this.offsetY = parsed.viewport.offsetY || 0;
                this.setZoom(parsed.viewport.zoom || 1);
            }
            this.spreadImportedLayout(this.IMPORT_SPREAD_FACTOR);
            this.validateManualPositions();
            this.render();
        }
        catch (error) {
            console.warn('Error importing mindmap from JSON, falling back to basic mindmap:', error);
            this.initializeBasicMindmap();
            this.render();
        }
    }
    /**
     * Import mindmap data from JSON while maintaining the active viewport
     * Similar to fromJSON but uses renderNoCenter to keep the current view
     * @param data - JSON string or object containing mindmap data
     * Falls back to basic mindmap with root node "root" if data is invalid
     */
    fromJSONWhileActive(data) {
        try {
            if (!data) {
                throw new Error('No data provided to fromJSONWhileActive');
            }
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid data format');
            }
            if (!parsed.model || !parsed.model.root) {
                throw new Error('Missing required model data');
            }
            this.mindMap.fromJSON(JSON.stringify(parsed.model));
            // Ensure each node has an imageUrl property after import
            const allNodes = this.getAllNodes();
            allNodes.forEach(node => {
                if (!node.imageUrl) {
                    node.imageUrl = "";
                }
            });
            this.canvasSize = parsed.canvasSize || { width: 100000, height: 100000 };
            this.virtualCenter = parsed.virtualCenter || { x: 50000, y: 50000 };
            this.manuallyPositionedNodes = new Set(parsed.manuallyPositioned || []);
            this.customConnections = (parsed.customConnections || []).map((conn) => ({
                ...conn,
                style: {
                    color: conn.style?.color || '#ced4da',
                    width: conn.style?.width || 6,
                    dasharray: conn.style?.dasharray || ''
                }
            }));
            if (parsed.viewport) {
                this.offsetX = parsed.viewport.offsetX || 0;
                this.offsetY = parsed.viewport.offsetY || 0;
                this.setZoom(parsed.viewport.zoom || 1);
            }
            this.spreadImportedLayout(this.IMPORT_SPREAD_FACTOR);
            this.validateManualPositions();
            this.renderNoCenter();
        }
        catch (error) {
            console.warn('Error importing mindmap from JSON, falling back to basic mindmap:', error);
            this.initializeBasicMindmap();
            this.renderNoCenter();
        }
    }
    // New helper to validate manual positions
    validateManualPositions() {
        const allNodes = new Map();
        const traverse = (node) => {
            allNodes.set(node.id, node);
            node.children.forEach(child => traverse(child));
        };
        traverse(this.mindMap.root);
        // Clean up invalid references
        this.manuallyPositionedNodes = new Set(Array.from(this.manuallyPositionedNodes).filter(id => allNodes.has(id)));
        // Ensure positions exist for manual nodes
        allNodes.forEach(node => {
            if (this.manuallyPositionedNodes.has(node.id)) {
                if (typeof node.x !== "number" || typeof node.y !== "number") {
                    console.warn(`Node ${node.id} marked as manual but missing coordinates, resetting`);
                    node.x = this.virtualCenter.x;
                    node.y = this.virtualCenter.y;
                }
            }
        });
    }
    enableFreeformDragging() {
        let isDraggingNode = false;
        let currentDraggedNode = null;
        let startX = 0;
        let startY = 0;
        let nodeOffsetX = 0;
        let nodeOffsetY = 0;
        let dragStartPosition = { x: 0, y: 0 };
        // --- long-press support ---
        let longPressTimer = null;
        let longPressTriggered = false;
        const LONG_PRESS_MS = 400; // press-and-hold delay
        const MOVE_CANCEL_PX = 10; // finger wiggle tolerance
        let touchStartPosition = { x: 0, y: 0 }; // Track initial touch position
        // When dragging starts
        const handleDragStart = (clientX, clientY, nodeDiv) => {
            dragStartPosition = {
                x: parseFloat(nodeDiv.style.left),
                y: parseFloat(nodeDiv.style.top)
            };
            // Mark all descendants as non-manual on drag start
            const nodeId = parseInt(nodeDiv.dataset.mindNodeId);
            this.markDescendantsAsManual(nodeId, false);
        };
        // When dragging ends
        const handleDragEnd = (nodeDiv) => {
            const nodeId = parseInt(nodeDiv.dataset.mindNodeId);
            this.updateSubtreeConnections(nodeId);
        };
        // Mouse events (unchanged)
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.draggingMode)
                return;
            const target = e.target;
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
            if (!this.draggingMode || !isDraggingNode || !currentDraggedNode)
                return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const rawX = (e.clientX - rect.left - this.offsetX) / this.zoomLevel - nodeOffsetX;
            const rawY = (e.clientY - rect.top - this.offsetY) / this.zoomLevel - nodeOffsetY;
            let x = Math.max(0, Math.min(this.canvasSize.width - currentDraggedNode.offsetWidth, rawX));
            let y = Math.max(0, Math.min(this.canvasSize.height - currentDraggedNode.offsetHeight, rawY));
            if (this.gridEnabled) {
                const snapped = this.snapToGrid(x, y);
                x = snapped.x;
                y = snapped.y;
            }
            currentDraggedNode.style.left = `${x}px`;
            currentDraggedNode.style.top = `${y}px`;
            this.updateConnectionsForNode(currentDraggedNode);
        });
        const mouseUpDragHandler = (e) => {
            if (!this.draggingMode)
                return;
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
        };
        document.addEventListener('mouseup', mouseUpDragHandler);
        // No cleanup needed as this is tied to canvas lifecycle
        /* ─────  touchstart  ───── */
        this.canvas.addEventListener("touchstart", (e) => {
            if (e.touches.length !== 1)
                return; // ignore multi-touch here
            const target = e.target;
            if (!target.dataset.mindNodeId)
                return;
            const touch = e.touches[0];
            touchStartPosition.x = touch.clientX;
            touchStartPosition.y = touch.clientY;
            /* schedule the long-press */
            longPressTimer = window.setTimeout(() => {
                // launch drag
                longPressTriggered = true;
                isDraggingNode = true;
                currentDraggedNode = target;
                target.style.cursor = "grabbing";
                const rect = this.canvas.getBoundingClientRect();
                nodeOffsetX =
                    (touchStartPosition.x - rect.left - this.offsetX) / this.zoomLevel -
                        parseFloat(target.style.left);
                nodeOffsetY =
                    (touchStartPosition.y - rect.top - this.offsetY) / this.zoomLevel -
                        parseFloat(target.style.top);
                handleDragStart(touchStartPosition.x, touchStartPosition.y, target);
            }, LONG_PRESS_MS);
        }, { passive: true });
        /* ─────  touchmove  ───── */
        let dragRafId = null;
        let lastDragEvent = null;
        const handleDragMove = () => {
            if (!lastDragEvent || !isDraggingNode || !currentDraggedNode) {
                dragRafId = null;
                return;
            }
            const touch = lastDragEvent.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const rawX = (touch.clientX - rect.left - this.offsetX) / this.zoomLevel -
                nodeOffsetX;
            const rawY = (touch.clientY - rect.top - this.offsetY) / this.zoomLevel -
                nodeOffsetY;
            let x = Math.max(0, Math.min(this.canvasSize.width - currentDraggedNode.offsetWidth, rawX));
            let y = Math.max(0, Math.min(this.canvasSize.height - currentDraggedNode.offsetHeight, rawY));
            if (this.gridEnabled) {
                const snapped = this.snapToGrid(x, y);
                x = snapped.x;
                y = snapped.y;
            }
            currentDraggedNode.style.left = `${x}px`;
            currentDraggedNode.style.top = `${y}px`;
            this.updateConnectionsForNode(currentDraggedNode);
            dragRafId = null;
        };
        this.canvas.addEventListener("touchmove", (e) => {
            if (e.touches.length !== 1)
                return;
            const touch = e.touches[0];
            // 1️⃣ If we haven’t triggered yet → cancel long-press if finger moved too much
            if (!longPressTriggered && longPressTimer !== null) {
                const dx = touch.clientX - touchStartPosition.x;
                const dy = touch.clientY - touchStartPosition.y;
                if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                return;
            }
            // 2️⃣ If long-press is active → run the usual drag loop
            if (isDraggingNode && currentDraggedNode) {
                e.preventDefault();
                lastDragEvent = e;
                if (!dragRafId) {
                    dragRafId = requestAnimationFrame(handleDragMove);
                }
            }
        }, { passive: false });
        /* ─────  touchend / touchcancel  ───── */
        ["touchend", "touchcancel"].forEach((evt) => this.canvas.addEventListener(evt, () => {
            // abort pending long-press without drag
            if (!longPressTriggered && longPressTimer !== null) {
                clearTimeout(longPressTimer);
            }
            longPressTimer = null;
            // cancel pending drag animation frame
            if (dragRafId) {
                cancelAnimationFrame(dragRafId);
                dragRafId = null;
            }
            lastDragEvent = null;
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
        }));
    }
    // Updated markDescendantsAsManual method to prevent infinite recursion
    markDescendantsAsManual(nodeId, manual, visited = new Set()) {
        if (visited.has(nodeId))
            return;
        visited.add(nodeId);
        const node = this.findMindNode(nodeId);
        if (!node)
            return;
        if (manual) {
            this.manuallyPositionedNodes.add(nodeId);
        }
        else {
            this.manuallyPositionedNodes.delete(nodeId);
        }
        node.children.forEach(child => this.markDescendantsAsManual(child.id, manual, visited));
    }
    // Helper to update connections for a node subtree.
    updateSubtreeConnections(nodeId) {
        // For simplicity, update all connections after a drag operation.
        this.renderConnections();
    }
    updateNodePositionInModel(nodeDiv) {
        const nodeId = parseInt(nodeDiv.dataset.mindNodeId);
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
        this.updateAllConnectionsForNode(nodeId);
    }
    /**
     * Apply a remote operation to the mindmap
     * Used for collaborative editing or undo/redo functionality
     * @param operation - The operation object containing type and relevant data
     */
    applyRemoteOperation(operation) {
        if (!operation || typeof operation !== 'object') {
            console.warn('Invalid operation provided to applyRemoteOperation');
            return;
        }
        console.log('Remote operation received:', operation);
        try {
            switch (operation.type) {
                case 'node_move':
                    if (!operation.nodeId || operation.newX === undefined || operation.newY === undefined) {
                        console.warn('Invalid node_move operation: missing required fields');
                        return;
                    }
                    this.updateNodeCoordinates(this.mindMap.root, Number(operation.nodeId), Number(operation.newX), Number(operation.newY));
                    break;
                case 'node_add':
                    if (!operation.parentId || !operation.label) {
                        console.warn('Invalid node_add operation: missing required fields');
                        return;
                    }
                    const newNode = this.mindMap.addMindNode(operation.parentId, operation.label);
                    // Override the new node's ID with the provided one for consistency.
                    if (operation.nodeId !== undefined) {
                        newNode.id = operation.nodeId;
                    }
                    break;
                case 'node_delete':
                    if (!operation.nodeId) {
                        console.warn('Invalid node_delete operation: missing nodeId');
                        return;
                    }
                    this.mindMap.deleteMindNode(operation.nodeId);
                    break;
                case 'node_update':
                    if (!operation.nodeId || !operation.newLabel) {
                        console.warn('Invalid node_update operation: missing required fields');
                        return;
                    }
                    this.mindMap.updateMindNode(operation.nodeId, operation.newLabel, operation.newDescription);
                    break;
                case 'node_props':
                    if (!operation.nodeId || !operation.props) {
                        console.warn('Invalid node_props operation: missing required fields');
                        return;
                    }
                    this.mindMap.updateMindNodeProperties(operation.nodeId, operation.props || {});
                    break;
                default:
                    console.warn('Unhandled operation type:', operation.type);
                    return;
            }
            console.log('Updated mind map state:', this.mindMap);
            this.render();
        }
        catch (error) {
            console.error('Error applying remote operation:', error, operation);
        }
    }
    /**
     * Apply an array of operations sequentially. Each operation has the same
     * format accepted by {@link applyRemoteOperation}.
     */
    applyOperations(operations) {
        operations.forEach(op => this.applyRemoteOperation(op));
    }
    // New method to emit an event with payload
    emit(event, payload) {
        const listeners = this.eventListeners[event];
        if (listeners) {
            listeners.forEach(callback => callback(payload));
        }
    }
    // New method to broadcast an operation
    broadcastOperation(operation) {
        this.emit('operation', operation);
    }
    // New method to subscribe to an event
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    updateNodeCoordinates(node, targetId, x, y) {
        if (node.id === targetId) {
            node.x = x;
            node.y = y;
            this.manuallyPositionedNodes.add(node.id); // Mark as manually positioned
            return true;
        }
        return node.children.some(child => this.updateNodeCoordinates(child, targetId, x, y));
    }
    /**
     * Find a node by its ID in the mindmap tree
     * @param id - The unique identifier of the node to find
     * @returns The found MindNode or null if not found
     */
    findMindNode(id) {
        if (id === undefined || id === null || isNaN(id)) {
            console.warn('Invalid node ID provided to findMindNode:', id);
            return null;
        }
        let found = null;
        const traverse = (node) => {
            if (!node)
                return; // Safety check for null nodes
            if (node.id === id) {
                found = node;
                return;
            }
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(child => traverse(child));
            }
        };
        traverse(this.mindMap.root);
        return found;
    }
    // Updated showImportModal with modern styling
    async showImportModal() {
        return new Promise((resolve) => {
            const modalOverlay = document.createElement("div");
            Object.assign(modalOverlay.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100vw",
                height: "100vh",
                background: styles_1.CSS_VARS['overlay-bg'],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: "2147483647", // updated z-index for fullscreen modals
                backdropFilter: "blur(12px)",
                transition: `opacity ${styles_1.CSS_VARS.transition.slow}`,
                opacity: "0"
            });
            const modal = document.createElement("div");
            Object.assign(modal.style, {
                background: styles_1.CSS_VARS['modal-bg'],
                padding: "32px",
                borderRadius: styles_1.CSS_VARS.radius.xl,
                boxShadow: styles_1.CSS_VARS.shadow.xl,
                width: "90%",
                maxWidth: "600px",
                position: "relative",
                zIndex: "2147483648",
                border: `1px solid ${styles_1.CSS_VARS['modal-border']}`,
                color: styles_1.CSS_VARS['modal-text'],
                transform: "scale(0.9)",
                transition: `all ${styles_1.CSS_VARS.transition.spring}`,
                opacity: "0"
            });
            // Enhanced animation
            setTimeout(() => {
                modalOverlay.style.opacity = "1";
                modal.style.opacity = "1";
                modal.style.transform = "scale(1)";
            }, 10);
            // Cleanup helper to remove the modal overlay
            const cleanup = () => {
                modalOverlay.style.opacity = "0";
                modal.style.transform = "scale(0.9)";
                setTimeout(() => modalOverlay.remove(), 300);
            };
            // Close button using consistent helper
            const closeButton = (0, styles_1.createCloseIcon)(() => {
                cleanup();
                resolve(null);
            });
            closeButton.style.position = "absolute";
            closeButton.style.top = "16px";
            closeButton.style.right = "16px";
            const title = document.createElement("h3");
            title.textContent = "Import JSON Data";
            Object.assign(title.style, {
                margin: "0 0 24px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: styles_1.CSS_VARS['modal-text']
            });
            const textArea = document.createElement("textarea");
            Object.assign(textArea.style, {
                width: "100%",
                height: "300px",
                padding: "16px",
                border: `2px solid ${styles_1.CSS_VARS['input-border']}`,
                borderRadius: styles_1.CSS_VARS.radius.lg,
                fontFamily: "monospace",
                fontSize: "13px",
                resize: "vertical",
                marginBottom: "24px",
                background: styles_1.CSS_VARS['input-bg'],
                color: styles_1.CSS_VARS['input-text'],
                transition: `all ${styles_1.CSS_VARS.transition.normal}`,
                outline: "none",
                boxShadow: styles_1.CSS_VARS.shadow.xs
            });
            textArea.placeholder = "Paste your JSON data here...";
            // Add focus effect
            textArea.addEventListener('focus', () => {
                textArea.style.borderColor = styles_1.CSS_VARS['input-focus'];
                textArea.style.boxShadow = `${styles_1.CSS_VARS.shadow.sm}, 0 0 0 3px rgba(77, 171, 247, 0.1)`;
            });
            textArea.addEventListener('blur', () => {
                textArea.style.borderColor = styles_1.CSS_VARS['input-border'];
                textArea.style.boxShadow = styles_1.CSS_VARS.shadow.xs;
            });
            const buttonGroup = document.createElement("div");
            Object.assign(buttonGroup.style, {
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end"
            });
            const cancelButton = (0, styles_1.createButton)("secondary");
            cancelButton.textContent = "Cancel";
            cancelButton.style.background = "none";
            cancelButton.style.border = `1px solid ${styles_1.CSS_VARS.border}`;
            cancelButton.style.color = styles_1.CSS_VARS.text;
            const importButton = (0, styles_1.createButton)("primary");
            importButton.textContent = "Import Data";
            importButton.style.background = styles_1.CSS_VARS.primary;
            importButton.style.color = "white";
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
            const parent = document.fullscreenElement || this.container;
            parent.appendChild(modalOverlay);
            modalOverlay.addEventListener("click", (e) => {
                if (e.target === modalOverlay) {
                    cleanup();
                    resolve(null);
                }
            });
        });
    }
    /**
     * Get all nodes in the mindmap tree
     * @returns Array of all MindNode objects in the tree
     */
    getAllNodes() {
        const nodes = [];
        const traverse = (node) => {
            if (!node)
                return; // Safety check for null nodes
            nodes.push(node);
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(child => traverse(child));
            }
        };
        traverse(this.mindMap.root);
        return nodes;
    }
    // New helper method to calculate the bounding box of all nodes
    calculateBoundingBox(nodes) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            const x = node.x;
            const y = node.y;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
        return { minX, minY, maxX, maxY };
    }
    // Helper to calculate the edge point between two rectangles (for SVG export)
    calculateEdgePoint(source, target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx);
        return {
            x: source.x + Math.cos(angle) * (source.width / 2),
            y: source.y + Math.sin(angle) * (source.height / 2),
        };
    }
    // NEW: Method to add a custom connection between any two nodes
    addCustomConnection(sourceId, targetId, style, label) {
        const source = this.findMindNode(sourceId);
        const target = this.findMindNode(targetId);
        if (!source || !target) {
            throw new Error("Invalid node id(s) for custom connection.");
        }
        const connection = {
            id: this.generateConnectionId(),
            sourceId,
            targetId,
            style,
            label,
        };
        this.customConnections.push(connection);
        this.renderConnections();
    }
    // Updated connection mode activation: change cursor and add deactivation method
    activateConnectionMode() {
        this.connectionModeActive = true;
        this.pendingConnectionSource = null;
        this.container.style.cursor = "crosshair";
        this.container.dispatchEvent(new CustomEvent("connectionModeChanged", { detail: true }));
    }
    deactivateConnectionMode() {
        this.connectionModeActive = false;
        this.pendingConnectionSource = null;
        this.container.style.cursor = "grab";
        this.container.dispatchEvent(new CustomEvent("connectionModeChanged", { detail: false }));
    }
    // NEW: UUID generator for connection ids
    generateConnectionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    // NEW: Helper method to update a MindNode's image URL by traversing the tree.
    updateMindNodeImage(MindNodeId, imageUrl) {
        function traverse(node) {
            if (node.id === MindNodeId) {
                node.imageUrl = imageUrl;
                return true;
            }
            return node.children.some((child) => traverse(child));
        }
        return traverse(this.mindMap.root);
    }
    // New public re-centering function
    reCenter() {
        this.setZoom(1);
        const containerCenterX = this.container.clientWidth / 2;
        const containerCenterY = this.container.clientHeight / 2;
        this.offsetX = containerCenterX - this.virtualCenter.x * this.zoomLevel;
        this.offsetY = containerCenterY - this.virtualCenter.y * this.zoomLevel;
        this.updateCanvasTransform();
    }
    // NEW: Method to toggle theme (now uses themeManager)
    toggleTheme() {
        config_1.themeManager.toggleTheme();
    }
    // Handle theme changes from themeManager
    handleThemeChange(theme) {
        // Update canvas grid pattern based on theme
        if (this.canvas) {
            const gridOpacity = theme === 'dark' ? '0.2' : '0.3';
            this.canvas.style.backgroundImage = `
        radial-gradient(circle, rgba(148, 163, 184, ${gridOpacity}) 1px, transparent 1px)
      `;
        }
        // Apply smooth theme transition
        this.container.style.transition = "background-color 0.3s ease, color 0.3s ease";
        if (this.canvas) {
            this.canvas.style.transition = "background-image 0.3s ease";
        }
        // Re-render to apply theme changes to all nodes
        this.render();
        // Emit theme change event
        this.container.dispatchEvent(new CustomEvent("themeChanged", {
            detail: { theme }
        }));
    }
    // NEW: Function to apply remote changes based on JSON diff
    applyRemoteChanges(remoteJson) {
        const remoteState = JSON.parse(remoteJson);
        const remoteModel = remoteState.model.root;
        const localModel = JSON.parse(this.mindMap.toJSON()).root;
        const operations = [];
        // Helper to recursively diff nodes
        const diffNodes = (local, remote) => {
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
            const localChildrenMap = {};
            (local.children || []).forEach((child) => {
                localChildrenMap[child.id] = child;
            });
            const remoteChildrenMap = {};
            (remote.children || []).forEach((child) => {
                remoteChildrenMap[child.id] = child;
            });
            // Process remote children: additions or diff existing nodes recursively
            (remote.children || []).forEach((rChild) => {
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
                }
                else {
                    diffNodes(localChildrenMap[rChild.id], rChild);
                }
            });
            // Process deletions: any local child not present remotely
            (local.children || []).forEach((lChild) => {
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
    switchToFullscreen() {
        if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
        }
        else if (this.container.mozRequestFullScreen) { // Firefox
            this.container.mozRequestFullScreen();
        }
        else if (this.container.webkitRequestFullscreen) { // Chrome, Safari and Opera
            this.container.webkitRequestFullscreen();
        }
        else if (this.container.msRequestFullscreen) { // IE/Edge
            this.container.msRequestFullscreen();
        }
    }
    /**
     * Add a new child node to the specified parent node
     * @param parentId - The ID of the parent node
     * @param label - The label text for the new node
     * @returns The newly created MindNode or null if parent not found or label is empty
     */
    addNode(parentId, label) {
        if (!label || label.trim() === '') {
            console.warn('Cannot add node with empty label');
            return null;
        }
        const parent = this.findMindNode(parentId);
        if (!parent) {
            console.error(`Parent node with ID ${parentId} not found`);
            return null;
        }
        this.recordSnapshot();
        const node = this.mindMap.addMindNode(parentId, label);
        this.reCenter();
        this.render();
        return node;
    }
    /**
     * Update an existing node's text and optional description
     * @param id - The ID of the node to update
     * @param newText - The new text for the node (cannot be empty)
     * @param newDescription - Optional new description for the node
     */
    updateNode(id, newText, newDescription) {
        if (!newText || newText.trim() === '') {
            console.warn('Cannot update node with empty text');
            return;
        }
        const node = this.findMindNode(id);
        if (!node) {
            console.error(`Node with ID ${id} not found`);
            return;
        }
        this.recordSnapshot();
        this.mindMap.updateMindNode(id, newText, newDescription ?? "");
        this.render();
    }
    /**
     * Delete a node and all its descendants from the mindmap
     * Root node cannot be deleted
     * @param id - The ID of the node to delete
     */
    deleteNode(id) {
        const node = this.findMindNode(id);
        if (!node) {
            console.error(`Node with ID ${id} not found`);
            return;
        }
        // Prevent deletion of root node
        if (id === this.mindMap.root.id) {
            console.warn('Cannot delete root node');
            return;
        }
        this.recordSnapshot();
        this.mindMap.deleteMindNode(id);
        this.render();
    }
    /* ----------   Touch-gesture helpers   ---------- */
    getTouchesDistance(t) {
        const dx = t[0].clientX - t[1].clientX;
        const dy = t[0].clientY - t[1].clientY;
        return Math.hypot(dx, dy);
    }
    getTouchesCenter(t) {
        return {
            x: (t[0].clientX + t[1].clientX) / 2,
            y: (t[0].clientY + t[1].clientY) / 2,
        };
    }
    // ---------------------------------------------------------------------------
    //  ⚙️ NEW CODE — utility to spread a whole tree around the virtual centre
    // ---------------------------------------------------------------------------
    spreadImportedLayout(factor) {
        const traverse = (node) => {
            const dx = node.x - this.virtualCenter.x;
            const dy = node.y - this.virtualCenter.y;
            node.x = this.virtualCenter.x + dx * factor;
            node.y = this.virtualCenter.y + dy * factor;
            node.children.forEach(traverse);
        };
        traverse(this.mindMap.root);
    }
    // replaced custom connector
    drawCustomConnection(src, trg, c) {
        const s = this.edgePoint(src, trg);
        const t = this.edgePoint(trg, src);
        // Render the custom connection path and attach click handler
        this.createSVGPath(c.id, s.x, s.y, t.x, t.y, c.style || {}, true, (ev) => { ev.stopPropagation(); this.handleConnectionClick(c, ev); });
        // Render label if present
        if (c.label) {
            const midX = (s.x + t.x) / 2;
            const midY = (s.y + t.y) / 2;
            const lbl = new ConnectionLabel_1.ConnectionLabel(c.label);
            lbl.setPosition(midX, midY);
            lbl.el.classList.add("connection-label");
            this.canvas.appendChild(lbl.el);
        }
    }
    // NEW: Grid system methods
    initializeGrid() {
        // Size grid canvas to container viewport, not the infinite canvas
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        this.gridCanvas.width = containerWidth;
        this.gridCanvas.height = containerHeight;
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.renderGrid();
    }
    renderGrid() {
        if (!this.gridVisible) {
            this.gridCanvas.style.display = 'none';
            return;
        }
        this.gridCanvas.style.display = 'block';
        const ctx = this.gridCtx;
        if (!ctx)
            return;
        // Get viewport dimensions
        const viewportWidth = this.container.clientWidth;
        const viewportHeight = this.container.clientHeight;
        // Update canvas size to match viewport
        if (this.gridCanvas.width !== viewportWidth || this.gridCanvas.height !== viewportHeight) {
            this.gridCanvas.width = viewportWidth;
            this.gridCanvas.height = viewportHeight;
        }
        ctx.clearRect(0, 0, viewportWidth, viewportHeight);
        // Use CSS variable for grid color (theme-aware)
        const gridColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--mm-grid-color').trim() || 'rgba(200, 200, 200, 0.3)';
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        // Calculate the grid spacing in viewport pixels (accounts for zoom)
        const gridSpacing = this.GRID_SIZE * this.zoomLevel;
        // Calculate the offset of the grid in viewport coordinates
        // The grid origin (0,0 in canvas coords) is at (-virtualCenter.x, -virtualCenter.y) in canvas space
        // After transform, it's at: offsetX + (-virtualCenter.x) * zoomLevel, offsetY + (-virtualCenter.y) * zoomLevel
        let gridOffsetX = (this.offsetX - this.virtualCenter.x * this.zoomLevel) % gridSpacing;
        let gridOffsetY = (this.offsetY - this.virtualCenter.y * this.zoomLevel) % gridSpacing;
        // Fix negative offsets - JavaScript modulo can return negative values
        if (gridOffsetX < 0)
            gridOffsetX += gridSpacing;
        if (gridOffsetY < 0)
            gridOffsetY += gridSpacing;
        ctx.beginPath();
        // Draw vertical lines (use 0.5 offset for crisp rendering)
        for (let x = gridOffsetX; x <= viewportWidth; x += gridSpacing) {
            ctx.moveTo(Math.floor(x) + 0.5, 0);
            ctx.lineTo(Math.floor(x) + 0.5, viewportHeight);
        }
        // Draw horizontal lines (use 0.5 offset for crisp rendering)
        for (let y = gridOffsetY; y <= viewportHeight; y += gridSpacing) {
            ctx.moveTo(0, Math.floor(y) + 0.5);
            ctx.lineTo(viewportWidth, Math.floor(y) + 0.5);
        }
        ctx.stroke();
    }
    // NEW: grid snapping helper method
    snapToGrid(x, y) {
        return {
            x: Math.round(x / this.GRID_SIZE) * this.GRID_SIZE,
            y: Math.round(y / this.GRID_SIZE) * this.GRID_SIZE
        };
    }
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        this.renderGrid();
    }
    toggleGridSnapping() {
        this.gridEnabled = !this.gridEnabled;
        this.render();
    }
    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     * Call this when the VisualMindMap instance is no longer needed
     */
    destroy() {
        // Unsubscribe from theme changes
        if (this.themeUnsubscribe) {
            this.themeUnsubscribe();
        }
        // Remove all registered event listeners
        this.eventListenerCleanup.forEach(cleanup => cleanup());
        this.eventListenerCleanup = [];
        // Clear internal state
        this.eventListeners = {};
        this.customConnections = [];
        this.historyStack = [];
        this.redoStack = [];
        this.descriptionExpanded.clear();
        this.manuallyPositionedNodes.clear();
        this.gridOccupancy.clear();
        this.nodePositions.clear();
    }
}
exports.VisualMindMap = VisualMindMap;
VisualMindMap.SVG_NS = "http://www.w3.org/2000/svg";
VisualMindMap.ARROW_ID = "mm-arrow";
