"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showConnectionModal = showConnectionModal;
function showConnectionModal(canvas) {
    return new Promise((resolve) => {
        // Create modal overlay
        const modalOverlay = document.createElement("div");
        Object.assign(modalOverlay.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "10000",
        });
        // Create modal container
        const modalContainer = document.createElement("div");
        Object.assign(modalContainer.style, {
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
            minWidth: "300px",
        });
        // Title
        const title = document.createElement("h3");
        title.innerText = "Add Custom Connection";
        title.style.marginBottom = "16px";
        modalContainer.appendChild(title);
        // Instead of manual inputs, create selection buttons for source and target nodes.
        let sourceId = null;
        let targetId = null;
        const sourceButton = document.createElement("button");
        sourceButton.innerText = "Select Source Node";
        sourceButton.style.width = "100%";
        sourceButton.style.marginBottom = "10px";
        const targetButton = document.createElement("button");
        targetButton.innerText = "Select Target Node";
        targetButton.style.width = "100%";
        targetButton.style.marginBottom = "10px";
        modalContainer.appendChild(sourceButton);
        modalContainer.appendChild(targetButton);
        // Other input fields remain as before.
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = "#ced4da";
        colorInput.style.width = "100%";
        colorInput.style.marginBottom = "10px";
        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.placeholder = "Line Width (e.g. 2)";
        widthInput.value = "2";
        widthInput.style.width = "100%";
        widthInput.style.marginBottom = "10px";
        const dashInput = document.createElement("input");
        dashInput.type = "text";
        dashInput.placeholder = "Dash Pattern (optional, e.g. 5,5)";
        dashInput.style.width = "100%";
        dashInput.style.marginBottom = "10px";
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.placeholder = "Connection Label (optional)";
        labelInput.style.width = "100%";
        labelInput.style.marginBottom = "10px";
        modalContainer.appendChild(colorInput);
        modalContainer.appendChild(widthInput);
        modalContainer.appendChild(dashInput);
        modalContainer.appendChild(labelInput);
        // Button container
        const buttonContainer = document.createElement("div");
        Object.assign(buttonContainer.style, {
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
        });
        const cancelButton = document.createElement("button");
        cancelButton.innerText = "Cancel";
        cancelButton.style.padding = "8px 12px";
        const addButton = document.createElement("button");
        addButton.innerText = "Add";
        addButton.style.padding = "8px 12px";
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(addButton);
        modalContainer.appendChild(buttonContainer);
        modalOverlay.appendChild(modalContainer);
        document.body.appendChild(modalOverlay);
        // Helper: When selecting a node, attach a one‑time event listener to the canvas.
        function selectNode(callback) {
            alert("Please click on a node in the mindmap.");
            const handler = (e) => {
                const targetEl = e.target;
                const nodeEl = targetEl.closest("[data-mind-node-id]");
                if (nodeEl) {
                    const idStr = nodeEl.getAttribute("data-mind-node-id");
                    if (idStr) {
                        const id = parseInt(idStr);
                        callback(id);
                        canvas.removeEventListener("click", handler);
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }
            };
            canvas.addEventListener("click", handler);
        }
        // Wire up the selection buttons
        sourceButton.addEventListener("click", () => {
            selectNode((id) => {
                sourceId = id;
                sourceButton.innerText = `Source Node: ${id}`;
            });
        });
        targetButton.addEventListener("click", () => {
            selectNode((id) => {
                targetId = id;
                targetButton.innerText = `Target Node: ${id}`;
            });
        });
        // Cancel button
        cancelButton.addEventListener("click", () => {
            document.body.removeChild(modalOverlay);
            resolve(null);
        });
        // Add button: validate that both nodes have been selected.
        addButton.addEventListener("click", () => {
            if (sourceId === null || targetId === null) {
                alert("Please select both source and target nodes.");
                return;
            }
            const color = colorInput.value;
            const width = parseFloat(widthInput.value);
            const dasharray = dashInput.value;
            const label = labelInput.value;
            document.body.removeChild(modalOverlay);
            resolve({ sourceId, targetId, color, width, dasharray, label });
        });
    });
}
