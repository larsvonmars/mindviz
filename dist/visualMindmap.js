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
class VisualMindMap {
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
        // Constants for layout
        this.MindNode_WIDTH = 80;
        this.HORIZONTAL_GAP = 80; // increased gap to prevent overlap
        this.VERTICAL_GAP = 200; // increased gap to prevent overlap
        // Update re-center icon to a simple cross
        this.reCenterIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`;
        // Container styling
        if (!container.style.width)
            container.style.width = "1500px";
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
        // Create modern toolbar container
        const toolbar = document.createElement("div");
        Object.assign(toolbar.style, {
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "50px",
            background: "var(--mm-toolbar-bg, #fff)",
            borderBottom: "1px solid var(--mm-border-color-light, #f0f0f0)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: "16px",
            zIndex: "1100",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        });
        container.appendChild(toolbar);
        // NEW: Define SVG icons for toolbar actions
        const reCenterIcon = this.reCenterIcon;
        const exportSvgIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`;
        const clearAllIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
        const zoomOutIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/></svg>`;
        const zoomInIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>`;
        const draggingModeIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`;
        // NEW: Updated button style for icon buttons
        const buttonStyle = {
            padding: "6px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "6px",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        };
        // NEW: Helper to create icon buttons with hover effects and ARIA labels
        const createButton = (html, onClick) => {
            const button = document.createElement("button");
            button.innerHTML = html;
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
            const svg = button.querySelector("svg");
            if (svg) {
                svg.style.width = "20px";
                svg.style.height = "20px";
            }
            return button;
        };
        // NEW: Toolbar buttons with icon replacements
        const recenterBtn = createButton(reCenterIcon, () => {
            this.setZoom(1);
            const containerCenterX = container.clientWidth / 2;
            const containerCenterY = container.clientHeight / 2;
            this.offsetX = containerCenterX - this.virtualCenter.x * this.zoomLevel;
            this.offsetY = containerCenterY - this.virtualCenter.y * this.zoomLevel;
            this.updateCanvasTransform();
        });
        recenterBtn.setAttribute("aria-label", "Re-center map");
        toolbar.appendChild(recenterBtn);
        const exportBtn = createButton(exportSvgIcon, () => this.exportAsSVG());
        exportBtn.setAttribute("aria-label", "Export as SVG");
        toolbar.appendChild(exportBtn);
        const clearBtn = createButton(clearAllIcon, () => {
            this.mindMap.root.children = [];
            this.render();
        });
        clearBtn.setAttribute("aria-label", "Clear all nodes");
        toolbar.appendChild(clearBtn);
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
            this.currentLayout = layoutSelect.value;
            this.render();
        });
        toolbar.appendChild(layoutSelect);
        // NEW: Zoom controls and percentage display
        const zoomContainer = document.createElement("div");
        Object.assign(zoomContainer.style, {
            display: "flex",
            gap: "8px",
            marginLeft: "auto",
            alignItems: "center"
        });
        const zoomOutBtn = createButton(zoomOutIcon, () => this.setZoom(this.zoomLevel / 1.2));
        zoomOutBtn.setAttribute("aria-label", "Zoom out");
        const zoomInBtn = createButton(zoomInIcon, () => this.setZoom(this.zoomLevel * 1.2));
        zoomInBtn.setAttribute("aria-label", "Zoom in");
        zoomContainer.append(zoomOutBtn, zoomInBtn);
        this.zoomLevelDisplay = document.createElement("span");
        this.zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        Object.assign(this.zoomLevelDisplay.style, {
            fontSize: "14px",
            color: "#666",
            minWidth: "50px",
            textAlign: "center"
        });
        zoomContainer.appendChild(this.zoomLevelDisplay);
        toolbar.appendChild(zoomContainer);
        const dragModeBtn = createButton(draggingModeIcon, () => {
            this.draggingMode = !this.draggingMode;
            const svg = dragModeBtn.querySelector("svg");
            if (svg) {
                svg.style.stroke = this.draggingMode ? "#4dabf7" : "currentColor";
            }
            dragModeBtn.setAttribute("aria-label", this.draggingMode ? "Disable dragging mode" : "Enable dragging mode");
            this.container.setAttribute('dragging-mode', String(this.draggingMode));
        });
        toolbar.appendChild(dragModeBtn);
        // NEW: Import JSON button in the toolbar
        const importJsonIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16v16H4z"/><path d="M8 12h8M12 8v8"/></svg>`;
        const importBtn = createButton(importJsonIcon, async () => {
            const jsonData = await this.showImportModal();
            if (jsonData) {
                try {
                    this.fromJSON(jsonData);
                }
                catch (error) {
                    alert("Invalid JSON data!");
                }
            }
        });
        importBtn.setAttribute("aria-label", "Import JSON");
        toolbar.appendChild(importBtn);
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
    }
    setZoom(newZoom) {
        this.zoomLevel = Math.min(Math.max(newZoom, 0.2), 3);
        this.updateCanvasTransform();
        if (this.zoomLevelDisplay) {
            this.zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }
    updateCanvasTransform() {
        this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
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
        // Clear the canvas instead of the container.
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
    // Render a MindNode and its children as DOM elements.
    renderMindNode(MindNode) {
        const MindNodeDiv = document.createElement("div");
        MindNodeDiv.dataset.mindNodeId = String(MindNode.id); // <-- New line for assigning id
        // Modern node styling
        Object.assign(MindNodeDiv.style, {
            position: "absolute",
            left: `${MindNode.x}px`,
            top: `${MindNode.y}px`,
            padding: "12px 20px",
            display: "inline-block",
            zIndex: "1",
            background: MindNode.background || "var(--mm-node-bg, #ffffff)",
            border: "1px solid var(--mm-node-border-color, #e0e0e0)",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--mm-node-text, #2d3436)",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            minWidth: "120px",
            textAlign: "center"
        });
        // Updated header with label and toggle button
        const header = document.createElement("div");
        Object.assign(header.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
        });
        const label = document.createElement("span");
        label.textContent = MindNode.label;
        header.appendChild(label);
        if (MindNode.description) {
            const toggleButton = document.createElement("div");
            const isExpanded = this.descriptionExpanded.get(MindNode.id) || false;
            toggleButton.innerHTML = isExpanded ?
                `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 9l6 6 6-6"/>
            </svg>` :
                `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 6l6 6-6 6"/>
            </svg>`;
            toggleButton.style.cursor = 'pointer';
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const current = this.descriptionExpanded.get(MindNode.id) || false;
                this.descriptionExpanded.set(MindNode.id, !current);
                this.render();
            });
            header.appendChild(toggleButton);
        }
        MindNodeDiv.appendChild(header);
        // Updated description container (toggle removed)
        if (MindNode.description) {
            const descContainer = document.createElement("div");
            const isExpanded = this.descriptionExpanded.get(MindNode.id) || false;
            Object.assign(descContainer.style, {
                maxHeight: isExpanded ? '1000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, opacity 0.2s ease',
                opacity: isExpanded ? '1' : '0',
                marginTop: '8px'
            });
            const descContent = document.createElement("div");
            descContent.textContent = MindNode.description;
            Object.assign(descContent.style, {
                fontSize: "12px",
                color: "var(--mm-description-text, #636e72)",
                lineHeight: "1.4",
                padding: "8px",
                background: "var(--mm-description-bg, #f8f9fa)",
                borderRadius: "6px",
                whiteSpace: "pre-wrap", // new: allow line breaks
                overflowWrap: "break-word", // new: break long words
                maxWidth: "200px" // new: limit description width
            });
            descContainer.appendChild(descContent);
            MindNodeDiv.appendChild(descContainer);
        }
        // Hover effects
        MindNodeDiv.addEventListener("mouseover", () => {
            MindNodeDiv.style.transform = "translateY(-3px) scale(1.02)";
            MindNodeDiv.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.1)";
        });
        MindNodeDiv.addEventListener("mouseout", () => {
            MindNodeDiv.style.transform = "translateY(0) scale(1)";
            MindNodeDiv.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
        });
        // Add click event listener for MindNode selection.
        MindNodeDiv.addEventListener("click", (e) => {
            if (this.draggingMode) {
                e.stopPropagation();
                return; // Skip selection in dragging mode
            }
            e.stopPropagation();
            this.selectMindNode(e, MindNodeDiv); // updated to pass the event
        });
        // Append the MindNode div to the canvas.
        this.canvas.appendChild(MindNodeDiv);
        // Adjust left to center the MindNode based on its dynamic width.
        const MindNodeWidth = MindNodeDiv.offsetWidth;
        MindNodeDiv.style.left = (MindNode.x - MindNodeWidth / 2) + "px";
        // Draw lines from this MindNode to each child.
        for (let child of MindNode.children) {
            this.drawLine(MindNode, child);
            // Recursively render child MindNodes.
            this.renderMindNode(child);
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
            const newLabel = await this.showModal("Enter label for new child MindNode:");
            if (newLabel) {
                const parentNode = this.findMindNode(parentId);
                if (!parentNode)
                    return;
                const newNode = this.mindMap.addMindNode(parentId, newLabel);
                // Set position relative to parent's current position
                newNode.x = parentNode.x + this.HORIZONTAL_GAP;
                newNode.y = parentNode.y;
                // Mark as manually positioned
                this.manuallyPositionedNodes.add(newNode.id);
                // Partial render instead of full re-render
                this.renderMindNode(newNode);
                this.drawLine(parentNode, newNode);
            }
        });
        const deleteButton = createButton("Delete MindNode", (e) => {
            e.stopPropagation();
            const MindNodeId = parseInt(MindNodeDiv.dataset.mindNodeId);
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
            const defaultText = MindNodeDiv.innerText;
            const defaultBg = MindNodeDiv.style.background;
            const result = await this.showStyleModal(defaultText, defaultBg, mindmap_1.MindNode.description || '');
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
    // Updated showStyleModal method with modern styling
    async showStyleModal(defaultText, defaultBg, defaultDesc) {
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
                backdropFilter: "blur(2px)",
                transition: "opacity 0.3s ease",
                opacity: "0"
            });
            const modal = document.createElement("div");
            Object.assign(modal.style, {
                background: "var(--mm-modal-bg, #fff)",
                padding: "32px",
                borderRadius: "16px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                width: "90%",
                maxWidth: "440px",
                transform: "scale(0.95)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: "0"
            });
            // Fade in animation
            setTimeout(() => {
                modalOverlay.style.opacity = "1";
                modal.style.opacity = "1";
                modal.style.transform = "scale(1)";
            }, 10);
            // Header
            const header = document.createElement("h3");
            header.textContent = "Edit Node Style";
            Object.assign(header.style, {
                margin: "0 0 24px 0",
                fontSize: "20px",
                fontWeight: "600",
                color: "var(--header-text-color, #2d3436)",
                position: "relative",
                paddingBottom: "12px"
            });
            // Header underline
            const headerUnderline = document.createElement("div");
            Object.assign(headerUnderline.style, {
                position: "absolute",
                bottom: "0",
                left: "0",
                width: "48px",
                height: "3px",
                background: "var(--accent-color, #4dabf7)",
                borderRadius: "2px"
            });
            header.appendChild(headerUnderline);
            // Form groups helper
            const createFormGroup = (labelText, input) => {
                const group = document.createElement("div");
                Object.assign(group.style, { marginBottom: "20px" });
                const label = document.createElement("label");
                label.textContent = labelText;
                Object.assign(label.style, {
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#495057"
                });
                group.appendChild(label);
                group.appendChild(input);
                return group;
            };
            // Text Input
            const textInput = document.createElement("input");
            Object.assign(textInput.style, {
                width: "100%",
                padding: "12px 16px",
                border: "1px solid var(--mm-input-border, #e9ecef)",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                background: "var(--mm-input-bg, #fff)",
                color: "var(--mm-input-text, #495057)"
            });
            textInput.value = defaultText;
            textInput.addEventListener("focus", () => {
                textInput.style.borderColor = "#4dabf7";
                textInput.style.boxShadow = "0 0 0 3px rgba(77, 171, 247, 0.2)";
            });
            textInput.addEventListener("blur", () => {
                textInput.style.borderColor = "#e9ecef";
                textInput.style.boxShadow = "none";
            });
            // Color Picker Group
            const colorGroup = document.createElement("div");
            Object.assign(colorGroup.style, {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "12px",
                marginBottom: "20px"
            });
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            Object.assign(colorInput.style, {
                width: "100%",
                height: "48px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                cursor: "pointer"
            });
            colorInput.value = this.extractSolidColor(defaultBg) || "#ffffff";
            const bgInput = document.createElement("input");
            bgInput.type = "text";
            bgInput.placeholder = "CSS background value";
            Object.assign(bgInput.style, {
                width: "100%",
                padding: "12px 16px",
                border: "1px solid var(--mm-input-border, #e9ecef)",
                borderRadius: "8px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                background: "var(--mm-input-bg, #fff)",
                color: "var(--mm-input-text, #495057)"
            });
            bgInput.value = defaultBg;
            bgInput.addEventListener("focus", () => {
                bgInput.style.borderColor = "#4dabf7";
                bgInput.style.boxShadow = "0 0 0 3px rgba(77, 171, 247, 0.2)";
            });
            bgInput.addEventListener("blur", () => {
                bgInput.style.borderColor = "#e9ecef";
                bgInput.style.boxShadow = "none";
            });
            // Color input interactions
            colorInput.addEventListener("input", () => (bgInput.value = colorInput.value));
            bgInput.addEventListener("input", () => {
                if (this.isValidColor(bgInput.value)) {
                    colorInput.value = this.extractSolidColor(bgInput.value) || "#ffffff";
                }
            });
            // Description Textarea
            const descTextarea = document.createElement("textarea");
            Object.assign(descTextarea.style, {
                width: "100%",
                padding: "12px 16px",
                border: "1px solid var(--mm-input-border, #e9ecef)",
                borderRadius: "8px",
                fontSize: "14px",
                minHeight: "100px",
                resize: "vertical",
                transition: "all 0.2s ease",
                background: "var(--mm-input-bg, #fff)",
                color: "var(--mm-input-text, #495057)"
            });
            descTextarea.value = defaultDesc;
            descTextarea.addEventListener("focus", () => {
                descTextarea.style.borderColor = "#4dabf7";
                descTextarea.style.boxShadow = "0 0 0 3px rgba(77, 171, 247, 0.2)";
            });
            descTextarea.addEventListener("blur", () => {
                descTextarea.style.borderColor = "#e9ecef";
                descTextarea.style.boxShadow = "none";
            });
            // Button Group
            const buttonGroup = document.createElement("div");
            Object.assign(buttonGroup.style, {
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "24px"
            });
            const cancelButton = document.createElement("button");
            Object.assign(cancelButton, {
                textContent: "Cancel",
                style: {
                    padding: "12px 20px",
                    border: "1px solid var(--mm-input-border, #e9ecef)",
                    borderRadius: "8px",
                    background: "none",
                    cursor: "pointer",
                    color: "var(--mm-input-text, #495057)",
                    transition: "all 0.2s ease",
                    fontWeight: "500"
                }
            });
            cancelButton.addEventListener("mouseover", () => {
                cancelButton.style.background = "#f8f9fa";
            });
            cancelButton.addEventListener("mouseout", () => {
                cancelButton.style.background = "none";
            });
            const saveButton = document.createElement("button");
            Object.assign(saveButton, {
                textContent: "Save Changes",
                style: {
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: "8px",
                    background: "var(--mm-primary, #4dabf7)",
                    color: "var(--mm-primary-contrast, #fff)",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "all 0.2s ease"
                }
            });
            saveButton.addEventListener("mouseover", () => {
                saveButton.style.background = "var(--mm-primary-hover, #4dabf7)";
            });
            saveButton.addEventListener("mouseout", () => {
                saveButton.style.background = "var(--mm-primary, #4dabf7)";
            });
            cancelButton.addEventListener("click", () => {
                modalOverlay.style.opacity = "0";
                modal.style.opacity = "0";
                modal.style.transform = "scale(0.95)";
                setTimeout(() => {
                    document.body.removeChild(modalOverlay);
                    resolve(null);
                }, 300);
            });
            saveButton.addEventListener("click", () => {
                document.body.removeChild(modalOverlay);
                resolve({
                    text: textInput.value,
                    background: bgInput.value,
                    description: descTextarea.value
                });
            });
            modal.addEventListener("keydown", (e) => {
                if (e.key === "Escape")
                    cancelButton.click();
                if (e.key === "Enter" && e.ctrlKey)
                    saveButton.click();
            });
            modal.appendChild(header);
            modal.appendChild(createFormGroup("Node Text", textInput));
            modal.appendChild(createFormGroup("Description", descTextarea));
            const colorFormGroup = document.createElement("div");
            colorFormGroup.appendChild(createFormGroup("Background Color", colorInput));
            colorFormGroup.appendChild(createFormGroup("Custom Background", bgInput));
            modal.appendChild(colorFormGroup);
            buttonGroup.append(cancelButton, saveButton);
            modal.appendChild(buttonGroup);
            modalOverlay.appendChild(modal);
            document.body.appendChild(modalOverlay);
            textInput.focus();
        });
    }
    // New method: unified modal for editing text and styles with a color picker.
    async showStyleModalOld(defaultText, defaultBg, defaultDesc) {
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
            const textInput = textGroup.querySelector('input');
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
            const colorInput = colorGroup.querySelector('input[type="color"]');
            const bgInput = colorGroup.querySelector('input[type="text"]');
            // Sync color inputs
            colorInput.addEventListener('input', () => bgInput.value = colorInput.value);
            bgInput.addEventListener('input', () => {
                if (this.isValidColor(bgInput.value)) {
                    colorInput.value = this.extractSolidColor(bgInput.value) || '#ffffff';
                }
            });
            // Description Group (new)
            const descGroup = document.createElement("div");
            descGroup.innerHTML = `
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
          Description
        </label>
        <textarea style="width: 100%; padding: 8px; margin-bottom: 16px; border: 1px solid #dee2e6; border-radius: 4px; resize: vertical; min-height: 60px;">${defaultDesc}</textarea>
      `;
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
                    background: bgInput.value,
                    description: descGroup.querySelector('textarea').value
                });
            });
            buttonGroup.append(cancelButton, saveButton);
            modal.append(textGroup, colorGroup, descGroup, buttonGroup);
            modalOverlay.appendChild(modal);
            document.body.appendChild(modalOverlay);
        });
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
    // NEW: New modal that combines editing text and background in one modal.
    showEditModal(defaultText, defaultBg) {
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
                const result = { text: textInput.value, background: bgInput.value };
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
    // Draw a simple line between two MindNodes using a rotated div.
    drawLine(parent, child) {
        // Calculate positions using node dimensions and edge detection
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
    calculateEdgePoint(source, target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx);
        return {
            x: source.x + Math.cos(angle) * (source.width / 2),
            y: source.y + Math.sin(angle) * (source.height / 2)
        };
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
    // Modified exportAsSVG method
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
        // Draw connections first (under nodes)
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
                    line.setAttribute("stroke-width", "2");
                    svg.appendChild(line);
                }
            });
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
        return JSON.stringify({
            model: JSON.parse(this.mindMap.toJSON()),
            canvasSize: this.canvasSize,
            virtualCenter: this.virtualCenter,
            manuallyPositioned: Array.from(this.manuallyPositionedNodes),
            viewport: {
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                zoom: this.zoomLevel
            },
            version: "1.2"
        }, null, 2);
    }
    // Public method to import mindmap data from JSON (unified format)
    fromJSON(jsonData) {
        const data = JSON.parse(jsonData);
        // Load the MindMap model using its unified fromJSON method.
        this.mindMap.fromJSON(JSON.stringify(data.model));
        this.canvasSize = data.canvasSize;
        this.virtualCenter = data.virtualCenter;
        this.manuallyPositionedNodes = new Set(data.manuallyPositioned || []);
        // Restore viewport state
        if (data.viewport) {
            this.offsetX = data.viewport.offsetX;
            this.offsetY = data.viewport.offsetY;
            this.setZoom(data.viewport.zoom);
        }
        // Verify node positions exist in model
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
            }
            isDraggingNode = false;
            currentDraggedNode = null;
        });
    }
    // Helper to mark (or unmark) a node and its descendants as manually positioned.
    markDescendantsAsManual(nodeId, manual) {
        const node = this.findMindNode(nodeId);
        if (!node)
            return;
        if (manual)
            this.manuallyPositionedNodes.add(nodeId);
        else
            this.manuallyPositionedNodes.delete(nodeId);
        node.children.forEach(child => this.markDescendantsAsManual(child.id, manual));
    }
    // Helper to update connections for a node subtree.
    updateSubtreeConnections(nodeId) {
        // For simplicity, update all connections after a drag operation.
        this.renderConnections();
    }
    updateNodePositionInModel(nodeDiv) {
        const nodeId = parseInt(nodeDiv.dataset.mindNodeId);
        const x = parseFloat(nodeDiv.style.left) + nodeDiv.offsetWidth / 2;
        const y = parseFloat(nodeDiv.style.top);
        this.updateNodeCoordinates(this.mindMap.root, nodeId, x, y);
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
    // New method to update connection drawings without recalculating layout
    renderConnections() {
        // Remove existing connections
        const connections = this.canvas.querySelectorAll('.connection');
        connections.forEach(conn => conn.remove());
        // Recursively draw connections starting from the root node
        const drawConns = (node) => {
            node.children.forEach(child => {
                this.drawLine(node, child);
                drawConns(child);
            });
        };
        drawConns(this.mindMap.root);
    }
}
exports.VisualMindMap = VisualMindMap;
