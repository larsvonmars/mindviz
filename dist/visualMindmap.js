"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualMindMap = void 0;
class VisualMindMap {
    constructor(container, mindMap) {
        this.selectedNodeDiv = null; // new property for selection
        this.currentActionButtons = null; // new property for action buttons
        // Constants for layout
        this.NODE_WIDTH = 80;
        this.HORIZONTAL_GAP = 20;
        this.VERTICAL_GAP = 100;
        this.container = container;
        this.mindMap = mindMap;
        // Ensure the container is positioned relative so we can use absolute positioning for nodes.
        this.container.style.position = "relative";
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
        // Clear the container.
        this.container.innerHTML = "";
        const centerX = this.container.clientWidth / 2;
        const centerY = this.container.clientHeight / 2;
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
        nodeDiv.style.background = "linear-gradient(to bottom right, #e0f7fa, #ffffff)";
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
        // Append the node div to the container.
        this.container.appendChild(nodeDiv);
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
        // Create a container for the action buttons.
        const actionDiv = document.createElement("div");
        actionDiv.style.position = "absolute";
        const left = parseInt(nodeDiv.style.left);
        const top = parseInt(nodeDiv.style.top) + 35; // position below the node
        actionDiv.style.left = left + "px";
        actionDiv.style.top = top + "px";
        // Create "Add Child" button.
        const addButton = document.createElement("button");
        addButton.innerText = "Add Child";
        addButton.style.marginRight = "5px";
        addButton.style.backgroundColor = "#d0eaff"; // new background for button
        addButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const nodeId = parseInt(nodeDiv.dataset.nodeId);
            const newLabel = await this.showModal("Enter label for new child node:");
            if (newLabel) {
                this.mindMap.addNode(nodeId, newLabel);
                this.render();
            }
        });
        // Create "Delete Node" button.
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete Node";
        deleteButton.style.marginRight = "5px";
        deleteButton.style.backgroundColor = "#d0eaff"; // new background for button
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
        // Create "Edit Text" button.
        const editButton = document.createElement("button");
        editButton.innerText = "Edit Text";
        editButton.style.backgroundColor = "#d0eaff"; // new background for button
        editButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const nodeId = parseInt(nodeDiv.dataset.nodeId);
            const newText = await this.showModal("Enter new text for the node:", nodeDiv.innerText);
            if (newText) {
                this.mindMap.updateNode(nodeId, newText);
                this.render();
            }
        });
        actionDiv.appendChild(addButton);
        actionDiv.appendChild(deleteButton);
        actionDiv.appendChild(editButton);
        this.container.appendChild(actionDiv);
        this.currentActionButtons = actionDiv;
    }
    // NEW: Custom modal to replace browser prompt
    showModal(promptText, defaultText = "") {
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
            const modalContainer = document.createElement("div");
            modalContainer.style.background = "#fff";
            modalContainer.style.padding = "20px";
            modalContainer.style.borderRadius = "8px";
            modalContainer.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
            modalContainer.style.minWidth = "200px";
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
        // Append the line to the container.
        this.container.appendChild(line);
    }
}
exports.VisualMindMap = VisualMindMap;
