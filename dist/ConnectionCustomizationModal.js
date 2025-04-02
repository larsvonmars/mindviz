"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showConnectionCustomizationModal = showConnectionCustomizationModal;
function showConnectionCustomizationModal(defaults) {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement("div");
        Object.assign(modalOverlay.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)", // updated style
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "10000",
            backdropFilter: "blur(2px)", // new
            transition: "opacity 0.3s ease", // new
            opacity: "0" // new
        });
        const modalContainer = document.createElement("div");
        Object.assign(modalContainer.style, {
            background: "var(--mm-modal-bg, #fff)", // updated style
            padding: "32px", // updated
            borderRadius: "16px", // updated
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)", // updated
            width: "90%", // updated
            maxWidth: "440px", // updated
            transform: "scale(0.95)", // new
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // new
            opacity: "0" // new
        });
        // Fade in animation (new)
        setTimeout(() => {
            modalOverlay.style.opacity = "1";
            modalContainer.style.opacity = "1";
            modalContainer.style.transform = "scale(1)";
        }, 10);
        const title = document.createElement("h3");
        title.innerText = `Customize Connection (${defaults.sourceId} → ${defaults.targetId})`;
        title.style.marginBottom = "16px";
        modalContainer.appendChild(title);
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = defaults.color || "#ced4da";
        colorInput.style.width = "100%";
        colorInput.style.marginBottom = "10px";
        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.placeholder = "Line Width (e.g. 2)";
        widthInput.value = defaults.width?.toString() || "2";
        widthInput.style.width = "100%";
        widthInput.style.marginBottom = "10px";
        const dashInput = document.createElement("input");
        dashInput.type = "text";
        dashInput.placeholder = "Dash Pattern (optional, e.g. 5,5)";
        dashInput.value = defaults.dasharray || "";
        dashInput.style.width = "100%";
        dashInput.style.marginBottom = "10px";
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.placeholder = "Connection Label (optional)";
        labelInput.value = defaults.label || "";
        labelInput.style.width = "100%";
        labelInput.style.marginBottom = "10px";
        modalContainer.appendChild(colorInput);
        modalContainer.appendChild(widthInput);
        modalContainer.appendChild(dashInput);
        modalContainer.appendChild(labelInput);
        const buttonContainer = document.createElement("div");
        Object.assign(buttonContainer.style, {
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
        });
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";
        deleteButton.style.padding = "8px 12px";
        deleteButton.style.background = "#dc3545";
        deleteButton.style.color = "#fff";
        deleteButton.addEventListener("click", () => {
            document.body.removeChild(modalOverlay);
            resolve({ action: "delete" });
        });
        const cancelButton = document.createElement("button");
        cancelButton.innerText = "Cancel";
        cancelButton.style.padding = "8px 12px";
        cancelButton.addEventListener("click", () => {
            document.body.removeChild(modalOverlay);
            resolve({
                action: "update",
                color: defaults.color || "#ced4da",
                width: defaults.width || 2,
                dasharray: defaults.dasharray || "",
                label: defaults.label || "",
            });
        });
        const okButton = document.createElement("button");
        okButton.innerText = "OK";
        okButton.style.padding = "8px 12px";
        okButton.addEventListener("click", () => {
            document.body.removeChild(modalOverlay);
            resolve({
                action: "update",
                color: colorInput.value,
                width: parseFloat(widthInput.value),
                dasharray: dashInput.value,
                label: labelInput.value,
            });
        });
        buttonContainer.append(deleteButton, cancelButton, okButton);
        modalContainer.appendChild(buttonContainer);
        modalOverlay.appendChild(modalContainer);
        document.body.appendChild(modalOverlay);
    });
}
