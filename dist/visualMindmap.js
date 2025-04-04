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
const Modal_1 = require("./Modal");
const MindNodeComponent_1 = require("./MindNodeComponent");
const Toolbar_1 = require("./Toolbar");
const ConnectionCustomizationModal_1 = require("./ConnectionCustomizationModal");
const ConnectionLabel_1 = require("./components/ConnectionLabel");
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
    constructor(container, mindMap) {
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
        // Constants for layout
        this.MindNode_WIDTH = 80;
        this.HORIZONTAL_GAP = 80; // increased gap to prevent overlap
        this.VERTICAL_GAP = 200; // increased gap to prevent overlap
        // NEW: Properties for custom connections
        this.customConnections = [];
        this.connectionIdCounter = 1;
        // NEW: Properties for connection mode
        this.connectionModeActive = false;
        this.pendingConnectionSource = null;
        // Container styling
        if (!container.style.width)
            container.style.width = "100%";
        if (!container.style.height)
            container.style.height = "800px";
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
        const toolbar = (0, Toolbar_1.createToolbar)(this);
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
            if (this.draggingMode)
                return;
            isPanning = true;
            startX = e.clientX;
            startY = e.clientY;
            container.style.cursor = "grabbing";
        });
        document.addEventListener("mousemove", (e) => {
            if (this.draggingMode || !isPanning)
                return;
            const dx = (e.clientX - startX) / this.zoomLevel;
            const dy = (e.clientY - startY) / this.zoomLevel;
            this.offsetX += dx;
            this.offsetY += dy;
            this.updateCanvasTransform();
            startX = e.clientX;
            startY = e.clientY;
        });
        document.addEventListener("mouseup", () => {
            if (this.draggingMode)
                return;
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
        document.addEventListener("keydown", (e) => {
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
        });
    }
    updateCanvasTransform() {
        this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
    }
    // NEW: Method to set zoom level and update the canvas transform
    setZoom(zoom) {
        this.zoomLevel = zoom;
        this.updateCanvasTransform();
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
    // Updated render method to use the new layout.
    render() {
        // Clear the canvas (not the container) for re-rendering.
        this.canvas.innerHTML = "";
        const centerX = this.canvas.clientWidth / 2;
        const centerY = this.canvas.clientHeight / 2;
        if (this.currentLayout === 'radial') {
            this.radialLayout(this.mindMap.root, this.virtualCenter.x, this.virtualCenter.y, 0, 0, 2 * Math.PI);
        }
        else {
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
    // New radial layout method: positions MindNode using polar coordinates.
    radialLayout(MindNode, centerX, centerY, depth, minAngle, maxAngle) {
        if (this.manuallyPositionedNodes.has(MindNode.id)) {
            // Position children relative to manual node
            if (MindNode.expanded && MindNode.children.length > 0) {
                const angleStep = (2 * Math.PI) / MindNode.children.length;
                let currentAngle = 0;
                const radius = this.VERTICAL_GAP * (depth > 0 ? 1.5 : 1); // Increased spread
                MindNode.children.forEach(child => {
                    if (!this.manuallyPositionedNodes.has(child.id)) {
                        child.x = MindNode.x + radius * Math.cos(currentAngle);
                        child.y = MindNode.y + radius * Math.sin(currentAngle);
                        currentAngle += angleStep;
                    }
                });
            }
            return;
        }
        if (depth === 0) {
            MindNode.x = centerX;
            MindNode.y = centerY;
        }
        else {
            const radius = this.VERTICAL_GAP * depth; // radial gap
            const angle = (minAngle + maxAngle) / 2;
            MindNode.x = centerX + radius * Math.cos(angle);
            MindNode.y = centerY + radius * Math.sin(angle);
        }
        // Process children only if expanded
        if (!MindNode.expanded || MindNode.children.length === 0)
            return;
        const angleStep = (maxAngle - minAngle) / MindNode.children.length;
        let currentAngle = minAngle;
        for (let child of MindNode.children) {
            this.radialLayout(child, centerX, centerY, depth + 1, currentAngle, currentAngle + angleStep);
            currentAngle += angleStep;
        }
    }
    // NEW: Helper method to compute the subtree width for treeLayout.
    computeSubtreeWidth(node) {
        if (node.children.length === 0)
            return this.MindNode_WIDTH;
        const childWidths = node.children.map(child => this.computeSubtreeWidth(child));
        return childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * this.HORIZONTAL_GAP;
    }
    // Updated treeLayout method: set nodes positions so they do not overlap.
    treeLayout(node, x, y) {
        if (this.manuallyPositionedNodes.has(node.id)) {
            // Position children relative to manual node
            if (node.expanded && node.children.length > 0) {
                let startX = node.x - (node.children.length * this.HORIZONTAL_GAP) / 2;
                node.children.forEach(child => {
                    if (!this.manuallyPositionedNodes.has(child.id)) {
                        child.x = startX;
                        child.y = node.y + this.VERTICAL_GAP;
                        startX += this.HORIZONTAL_GAP + this.MindNode_WIDTH;
                    }
                });
            }
            return;
        }
        node.x = x;
        node.y = y;
        // Process children only if expanded
        if (!node.expanded || node.children.length === 0)
            return;
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
    renderMindNode(MindNode) {
        const nodeX = MindNode.x;
        const nodeY = MindNode.y;
        const isExpanded = this.descriptionExpanded.get(MindNode.id) || false;
        const MindNodeDiv = (0, MindNodeComponent_1.createMindNodeElement)({
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
        MindNodeDiv.style.left = (MindNode.x - eleWidth / 2) + "px";
        // Draw lines and recursively render child MindNodes.
        for (let child of MindNode.children) {
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
            this.selectedMindNodeDiv.style.border = "1px solid #dee2e6";
        }
        MindNodeDiv.style.border = "2px solid #4dabf7";
        this.selectedMindNodeDiv = MindNodeDiv;
        if (this.currentActionButtons)
            this.currentActionButtons.remove();
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
            const newLabel = await this.showModal("Enter label for new child MindNode:");
            if (newLabel) {
                const parentNode = this.findMindNode(parentId);
                if (!parentNode)
                    return;
                // Temporarily remove parent's manual flag:
                this.manuallyPositionedNodes.delete(parentNode.id);
                const newNode = this.mindMap.addMindNode(parentId, newLabel);
                // Set position relative to parent's current position
                newNode.x = parentNode.x + this.HORIZONTAL_GAP;
                newNode.y = parentNode.y;
                // Re-mark the parent as manually positioned:
                this.manuallyPositionedNodes.add(parentNode.id);
                // Force a full re-render after adding the new child:
                this.clear();
                this.render();
            }
        });
        const deleteButton = createButton("Delete MindNode", (e) => {
            e.stopPropagation();
            const MindNodeId = parseInt(MindNodeDiv.dataset.mindNodeId);
            this.recordSnapshot(); // record state before deletion
            try {
                this.mindMap.deleteMindNode(MindNodeId);
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
            const defaultText = node.label; // Use only the label for the title field
            const defaultBg = MindNodeDiv.style.background;
            const defaultDesc = node.description || '';
            const defaultImageUrl = node.imageUrl || "";
            const result = await (0, Modal_1.showStyleModal)(defaultText, defaultBg, defaultDesc, defaultImageUrl);
            if (result) {
                this.mindMap.updateMindNode(MindNodeId, result.text, result.description);
                this.updateMindNodeBackground(MindNodeId, result.background);
                this.updateMindNodeImage(MindNodeId, result.imageUrl);
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
    // NEW: Custom modal to replace browser prompt
    showModal(promptText, defaultText = "") {
        // If in test mode, bypass the modal and return the preset reply.
        if (window.__TEST_MODE__) {
            return Promise.resolve(window.__TEST_PROMPT_REPLY__ || null);
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
    // Modified drawLine method:
    drawLine(parent, child) {
        const parentRect = {
            x: parent.x,
            y: parent.y,
            width: this.MindNode_WIDTH,
            height: 40
        };
        const childRect = {
            x: child.x,
            y: child.y,
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
        const existingCustom = this.customConnections.find(c => c.sourceId === parent.id && c.targetId === child.id);
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
            }
            else {
                const tempConnection = {
                    id: `temp-${line.dataset.source}-${line.dataset.target}`,
                    sourceId: parseInt(line.dataset.source),
                    targetId: parseInt(line.dataset.target),
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
    calculateEdgePoint(source, target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx);
        return {
            x: source.x + Math.cos(angle) * (source.width / 2),
            y: source.y + Math.sin(angle) * (source.height / 2)
        };
    }
    // Enhanced connection click handler:
    handleConnectionClick(conn, line) {
        const isCustom = line.classList.contains("custom-connection");
        const connectionId = line.dataset.connectionId;
        const connection = isCustom
            ? this.customConnections.find(c => c.id === connectionId)
            : {
                id: `temp-${line.dataset.source}-${line.dataset.target}`,
                sourceId: parseInt(line.dataset.source),
                targetId: parseInt(line.dataset.target),
                style: { color: "#ced4da", width: 6, dasharray: "" }
            };
        if (!connection)
            return;
        // Properly pass the current connection data to the modal
        const defaults = {
            sourceId: connection.sourceId,
            targetId: connection.targetId,
            color: connection.style?.color || "#ced4da",
            width: connection.style?.width || 6,
            dasharray: connection.style?.dasharray || "",
            label: connection.label || ""
        };
        (0, ConnectionCustomizationModal_1.showConnectionCustomizationModal)(defaults).then(result => {
            if (result.action === "delete") {
                if (isCustom) {
                    this.customConnections = this.customConnections.filter(c => c.id !== connectionId);
                }
                line.remove();
            }
            else if (result.action === "update") {
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
                }
                else {
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
    renderConnections() {
        // Clear existing hierarchical and custom connection elements, plus connection labels.
        this.canvas.querySelectorAll('.connection, .custom-connection, .connection-label').forEach(c => c.remove());
        // Render all hierarchical connections if no custom connection exists
        const renderHierarchical = (node) => {
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
            if (source && target)
                this.drawCustomConnection(source, target, conn);
        });
    }
    // New method to allow users to set a custom canvas size.
    setCanvasSize(width, height) {
        this.canvas.style.width = width;
        this.canvas.style.height = height;
    }
    // Added public function 'clear' to empty the canvas.
    clear() {
        this.canvas.innerHTML = "";
    }
    // NEW: Method to automatically expand the canvas when MindNodes approach boundaries.
    autoExpandCanvas() {
        const buffer = 2000; // Expansion buffer in pixels
        const MindNodes = this.canvas.querySelectorAll('[data-mind-node-id]');
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
            if (shouldExpand.right)
                this.offsetX -= widthDiff;
            if (shouldExpand.bottom)
                this.offsetY -= heightDiff;
            this.canvasSize = { width: newWidth, height: newHeight };
            this.canvas.style.width = `${newWidth}px`;
            this.canvas.style.height = `${newHeight}px`;
            this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
        }
    }
    // Updated exportAsSVG method
    exportAsSVG() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const nodeDivs = this.canvas.querySelectorAll('[data-mind-node-id]');
        const MindNodes = this.getAllMindNodes();
        // Capture node dimensions from DOM
        const nodeDimensions = new Map();
        nodeDivs.forEach(div => {
            const nodeId = parseInt(div.dataset.mindNodeId);
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
                        text.setAttribute("fill", "#2d3436");
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
            rect.setAttribute("stroke", "#e0e0e0");
            rect.setAttribute("stroke-width", "1");
            svg.appendChild(rect);
            // Node label
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", mindNode.x.toString());
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
                desc.setAttribute("x", mindNode.x.toString());
                desc.setAttribute("y", (y + 40).toString());
                desc.setAttribute("text-anchor", "middle");
                desc.setAttribute("font-family", "Arial, sans-serif");
                desc.setAttribute("font-size", "12px");
                desc.setAttribute("fill", "#636e72");
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
    // Public method to import mindmap data from JSON (unified format)
    fromJSON(jsonData) {
        const data = JSON.parse(jsonData);
        this.mindMap.fromJSON(JSON.stringify(data.model));
        // NEW: Ensure each node has an imageUrl property after import
        const allNodes = this.getAllMindNodes();
        allNodes.forEach(node => {
            if (!node.imageUrl) {
                node.imageUrl = "";
            }
        });
        this.canvasSize = data.canvasSize;
        this.virtualCenter = data.virtualCenter;
        this.manuallyPositionedNodes = new Set(data.manuallyPositioned || []);
        this.customConnections = (data.customConnections || []).map((conn) => ({
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
        // When dragging starts
        const handleDragStart = (e, nodeDiv) => {
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
                handleDragStart(e, target);
            }
        });
        document.addEventListener('mousemove', (e) => {
            if (!this.draggingMode || !isDraggingNode || !currentDraggedNode)
                return;
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
        });
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
        // NEW: Re-render all connections when a node moves.
        this.updateAllConnectionsForNode(nodeId);
    }
    updateAllConnectionsForNode(nodeId) {
        // Simply re-render all connections.
        this.renderConnections();
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
    updateConnectionsForNode(nodeDiv) {
        const connections = this.canvas.querySelectorAll('.connection');
        connections.forEach(conn => {
            if (conn instanceof HTMLElement &&
                (conn.dataset.source === nodeDiv.dataset.mindNodeId ||
                    conn.dataset.target === nodeDiv.dataset.mindNodeId)) {
                conn.remove();
            }
        });
        const nodeId = parseInt(nodeDiv.dataset.mindNodeId);
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
    findMindNode(id) {
        let found = null;
        const traverse = (node) => {
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
    async showImportModal() {
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
            modalOverlay.addEventListener("click", (e) => {
                if (e.target === modalOverlay) {
                    cleanup();
                    resolve(null);
                }
            });
        });
    }
    // New helper method to get all MindNodes in the mind map
    getAllMindNodes() {
        const nodes = [];
        const traverse = (node) => {
            nodes.push(node);
            node.children.forEach(child => traverse(child));
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
    drawCustomConnection(source, target, connection) {
        const start = this.calculateEdgePoint({ x: source.x, y: source.y, width: this.MindNode_WIDTH, height: 40 }, { x: target.x, y: target.y, width: this.MindNode_WIDTH, height: 40 });
        const end = this.calculateEdgePoint({ x: target.x, y: target.y, width: this.MindNode_WIDTH, height: 40 }, { x: source.x, y: source.y, width: this.MindNode_WIDTH, height: 40 });
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
            const label = new ConnectionLabel_1.ConnectionLabel(connection.label);
            label.setPosition((start.x + end.x) / 2, (start.y + end.y) / 2);
            // Add a class so the connection label is cleared on re-render.
            label.el.classList.add("connection-label");
            this.canvas.appendChild(label.el);
        }
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
}
exports.VisualMindMap = VisualMindMap;
