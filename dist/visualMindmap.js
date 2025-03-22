"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualMindMap = void 0;
class VisualMindMap {
    constructor(container, mindMap) {
        this.selectedNodeDiv = null; // new property for selection
        this.currentActionButtons = null; // new property for action buttons
        this.offsetX = 0; // panning offset X
        this.offsetY = 0; // panning offset Y
        // Constants for layout
        this.NODE_WIDTH = 80;
        this.HORIZONTAL_GAP = 20;
        this.VERTICAL_GAP = 100;
        // Set default container size if not provided
        if (!container.style.width) {
            container.style.width = "800px";
        }
        if (!container.style.height) {
            container.style.height = "600px";
        }
        container.style.border = "2px solid #000";
        container.style.overflow = "hidden";
        container.style.cursor = "grab";
        container.style.position = "relative";
        this.container = container;
        this.mindMap = mindMap;
        // Create an inner canvas div to hold the mindmap elements.
        this.canvas = document.createElement("div");
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.width = "1600px"; // default canvas size (can be customized)
        this.canvas.style.height = "1200px"; // default canvas size (can be customized)
        this.canvas.style.border = "2px dashed #000"; // clear border for canvas
        // Append canvas to container.
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
            if (!isPanning)
                return;
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
        // Apply radial layout with full circle for the root.
        this.radialLayout(this.mindMap.root, centerX, centerY, 0, 0, 2 * Math.PI);
        // Render nodes (and connecting lines).
        this.renderNode(this.mindMap.root);
    }
    // New radial layout method: positions node using polar coordinates.
    radialLayout(node, centerX, centerY, depth, minAngle, maxAngle) {
        if (depth === 0) {
            node.x = centerX;
            node.y = centerY;
        }
        else {
            const radius = this.VERTICAL_GAP * depth; // radial gap
            const angle = (minAngle + maxAngle) / 2;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        }
        if (node.children.length === 0)
            return;
        const angleStep = (maxAngle - minAngle) / node.children.length;
        let currentAngle = minAngle;
        for (let child of node.children) {
            this.radialLayout(child, centerX, centerY, depth + 1, currentAngle, currentAngle + angleStep);
            currentAngle += angleStep;
        }
    }
    // Render a node and its children as DOM elements.
    renderNode(node) {
        // Create a div element for the node.
        const nodeDiv = document.createElement("div");
        nodeDiv.innerText = node.label;
        nodeDiv.dataset.nodeId = node.id.toString(); // store node id in dataset
        nodeDiv.style.position = "absolute";
        // Positioning the node.
        // Initially position using node.x; will adjust after measuring width.
        nodeDiv.style.left = (node.x) + "px";
        nodeDiv.style.top = node.y + "px";
        // Remove fixed dimensions and overflow control
        // nodeDiv.style.width = "80px";
        // nodeDiv.style.height = "30px";
        // nodeDiv.style.overflow = "hidden";
        // nodeDiv.style.textOverflow = "ellipsis";
        // nodeDiv.style.whiteSpace = "nowrap";
        // New styling to size node to text:
        nodeDiv.style.padding = "5px 10px";
        nodeDiv.style.display = "inline-block";
        nodeDiv.style.whiteSpace = "nowrap";
        // Ensure nodes appear above lines.
        nodeDiv.style.zIndex = "1";
        // Improved styling:
        nodeDiv.style.background = node.background || "linear-gradient(to bottom right, #e0f7fa, #ffffff)";
        nodeDiv.style.border = "1px solid #444";
        nodeDiv.style.borderRadius = "8px";
        nodeDiv.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
        nodeDiv.style.textAlign = "center";
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
        // Append the node div to the canvas.
        this.canvas.appendChild(nodeDiv);
        // Adjust left to center the node based on its dynamic width.
        const nodeWidth = nodeDiv.offsetWidth;
        nodeDiv.style.left = (node.x - nodeWidth / 2) + "px";
        // Draw lines from this node to each child.
        for (let child of node.children) {
            this.drawLine(node, child);
            // Recursively render child nodes.
            this.renderNode(child);
        }
    }
    // New helper method for selecting a node.
    selectNode(nodeDiv) {
        // Deselect previous node if any.
        if (this.selectedNodeDiv) {
            this.selectedNodeDiv.style.border = "1px solid #000";
        }
        // Highlight the clicked node.
        nodeDiv.style.border = "2px solid blue";
        this.selectedNodeDiv = nodeDiv;
        // Remove existing action buttons if any.
        if (this.currentActionButtons) {
            this.currentActionButtons.remove();
        }
        // Create a container for the action buttons with context menu styling:
        const actionDiv = document.createElement("div");
        actionDiv.style.position = "absolute";
        actionDiv.style.background = "#fff";
        actionDiv.style.border = "1px solid #ccc";
        actionDiv.style.borderRadius = "4px";
        actionDiv.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
        actionDiv.style.zIndex = "10000"; // high z-index for context menu
        const left = parseInt(nodeDiv.style.left);
        const top = parseInt(nodeDiv.style.top) + 35; // position below the node
        actionDiv.style.left = left + "px";
        actionDiv.style.top = top + "px";
        // Create "Add Child" button with uniform context menu styling:
        const addButton = document.createElement("button");
        addButton.innerText = "Add Child";
        addButton.style.margin = "0";
        addButton.style.padding = "5px 10px";
        addButton.style.width = "100%";
        addButton.style.background = "#fff";
        addButton.style.border = "none";
        addButton.style.textAlign = "left";
        addButton.style.cursor = "pointer";
        addButton.addEventListener("mouseover", () => { addButton.style.background = "#f0f0f0"; });
        addButton.addEventListener("mouseout", () => { addButton.style.background = "#fff"; });
        addButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const nodeId = parseInt(nodeDiv.dataset.nodeId);
            const newLabel = await this.showModal("Enter label for new child node:");
            if (newLabel) {
                this.mindMap.addNode(nodeId, newLabel);
                this.render();
            }
        });
        // Create "Delete Node" button:
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete Node";
        deleteButton.style.margin = "0";
        deleteButton.style.padding = "5px 10px";
        deleteButton.style.width = "100%";
        deleteButton.style.background = "#fff";
        deleteButton.style.border = "none";
        deleteButton.style.textAlign = "left";
        deleteButton.style.cursor = "pointer";
        deleteButton.addEventListener("mouseover", () => { deleteButton.style.background = "#f0f0f0"; });
        deleteButton.addEventListener("mouseout", () => { deleteButton.style.background = "#fff"; });
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const nodeId = parseInt(nodeDiv.dataset.nodeId);
            try {
                this.mindMap.deleteNode(nodeId);
                this.render();
            }
            catch (err) {
                alert(err);
            }
        });
        // Create "Edit Node" button:
        const editButton = document.createElement("button");
        editButton.innerText = "Edit Node"; // changed text
        editButton.style.margin = "0";
        editButton.style.padding = "5px 10px";
        editButton.style.width = "100%";
        editButton.style.background = "#fff";
        editButton.style.border = "none";
        editButton.style.textAlign = "left";
        editButton.style.cursor = "pointer";
        editButton.addEventListener("mouseover", () => { editButton.style.background = "#f0f0f0"; });
        editButton.addEventListener("mouseout", () => { editButton.style.background = "#fff"; });
        editButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const nodeId = parseInt(nodeDiv.dataset.nodeId);
            const defaultText = nodeDiv.innerText;
            const defaultBg = nodeDiv.style.background;
            const result = await this.showEditModal(defaultText, defaultBg);
            if (result) {
                if (result.text) {
                    this.mindMap.updateNode(nodeId, result.text);
                }
                if (result.background !== undefined) {
                    this.updateNodeBackground(nodeId, result.background);
                }
                this.render();
            }
        });
        // NEW: Create "Set Background" button:
        const setBackgroundButton = document.createElement("button");
        setBackgroundButton.innerText = "Set Background";
        setBackgroundButton.style.margin = "0";
        setBackgroundButton.style.padding = "5px 10px";
        setBackgroundButton.style.width = "100%";
        setBackgroundButton.style.background = "#fff";
        setBackgroundButton.style.border = "none";
        setBackgroundButton.style.textAlign = "left";
        setBackgroundButton.style.cursor = "pointer";
        setBackgroundButton.addEventListener("mouseover", () => { setBackgroundButton.style.background = "#f0f0f0"; });
        setBackgroundButton.addEventListener("mouseout", () => { setBackgroundButton.style.background = "#fff"; });
        setBackgroundButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const nodeId = parseInt(nodeDiv.dataset.nodeId);
            // Use the current background as the default.
            const currentBg = nodeDiv.style.background;
            const newBg = await this.showModal("Enter background CSS for the node:", currentBg);
            if (newBg !== null) {
                this.updateNodeBackground(nodeId, newBg);
                this.render();
            }
        });
        actionDiv.appendChild(addButton);
        actionDiv.appendChild(deleteButton);
        actionDiv.appendChild(editButton);
        actionDiv.appendChild(setBackgroundButton); // NEW button appended
        this.canvas.appendChild(actionDiv);
        this.currentActionButtons = actionDiv;
    }
    // NEW: New modal that combines editing text and background in one modal.
    showEditModal(defaultText, defaultBg) {
        return new Promise((resolve) => {
            const modalOverlay = document.createElement("div");
            modalOverlay.style.position = "fixed";
            modalOverlay.style.top = "0";
            modalOverlay.style.left = "0";
            modalOverlay.style.width = "100vw";
            modalOverlay.style.height = "100vh";
            modalOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            modalOverlay.style.display = "flex";
            modalOverlay.style.alignItems = "center";
            modalOverlay.style.justifyContent = "center";
            modalOverlay.style.zIndex = "10000";
            const modalContainer = document.createElement("div");
            modalContainer.style.background = "#fff";
            modalContainer.style.padding = "20px";
            modalContainer.style.borderRadius = "8px";
            modalContainer.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
            modalContainer.style.minWidth = "200px";
            modalContainer.style.zIndex = "10001";
            // Text input
            const textPrompt = document.createElement("div");
            textPrompt.innerText = "Enter new text for the node:";
            textPrompt.style.marginBottom = "5px";
            modalContainer.appendChild(textPrompt);
            const textInput = document.createElement("input");
            textInput.type = "text";
            textInput.value = defaultText;
            textInput.style.width = "100%";
            textInput.style.marginBottom = "10px";
            modalContainer.appendChild(textInput);
            // Background input
            const bgPrompt = document.createElement("div");
            bgPrompt.innerText = "Enter background CSS for the node:";
            bgPrompt.style.marginBottom = "5px";
            modalContainer.appendChild(bgPrompt);
            const bgInput = document.createElement("input");
            bgInput.type = "text";
            bgInput.value = defaultBg;
            bgInput.style.width = "100%";
            bgInput.style.marginBottom = "10px";
            modalContainer.appendChild(bgInput);
            // Buttons container.
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
    // NEW: Helper method to update a node's background by traversing the tree.
    updateNodeBackground(nodeId, background) {
        function traverse(node) {
            if (node.id === nodeId) {
                node.background = background;
                return true;
            }
            for (let child of node.children) {
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
            modalOverlay.style.position = "fixed";
            modalOverlay.style.top = "0";
            modalOverlay.style.left = "0";
            modalOverlay.style.width = "100vw";
            modalOverlay.style.height = "100vh";
            modalOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            modalOverlay.style.display = "flex";
            modalOverlay.style.alignItems = "center";
            modalOverlay.style.justifyContent = "center";
            modalOverlay.style.zIndex = "10000"; // highest z-index for modal overlay
            const modalContainer = document.createElement("div");
            modalContainer.style.background = "#fff";
            modalContainer.style.padding = "20px";
            modalContainer.style.borderRadius = "8px";
            modalContainer.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
            modalContainer.style.minWidth = "200px";
            modalContainer.style.zIndex = "10001"; // above modal overlay
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
    drawLine(parent, child) {
        const line = document.createElement("div");
        line.style.position = "absolute";
        // Ensure lines stay behind nodes.
        line.style.zIndex = "0";
        // Compute the center coordinates of parent and child nodes.
        const x1 = parent.x;
        const y1 = parent.y + 15; // 15 is half of the node's height
        const x2 = child.x;
        const y2 = child.y + 15;
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
        // Append the line to the canvas.
        this.canvas.appendChild(line);
    }
    // New method to allow users to set a custom canvas size.
    setCanvasSize(width, height) {
        this.canvas.style.width = width;
        this.canvas.style.height = height;
    }
}
exports.VisualMindMap = VisualMindMap;
