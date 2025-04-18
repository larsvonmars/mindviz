"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showStyleModal = showStyleModal;
const styles_1 = require("./styles");
function showStyleModal(defaultText, defaultBg, defaultDesc, defaultImageUrl = "") {
    return new Promise((resolve) => {
        const modalOverlay = (0, styles_1.createBaseElement)('div', {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "10000",
            backdropFilter: "blur(8px)",
            transition: "opacity 0.3s ease-out",
            opacity: "0"
        });
        const modal = (0, styles_1.createBaseElement)('div', {
            background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
            width: "90%",
            maxWidth: "440px",
            transform: "scale(0.95)",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            opacity: "0",
            border: "1px solid rgba(255, 255, 255, 0.2)"
        });
        // Animation
        setTimeout(() => {
            modalOverlay.style.opacity = "1";
            modal.style.opacity = "1";
            modal.style.transform = "scale(1)";
        }, 10);
        // Header
        const header = (0, styles_1.createBaseElement)('div', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
        });
        const title = (0, styles_1.createBaseElement)('h3', {
            margin: "0",
            fontSize: "24px",
            fontWeight: "700",
            color: "#2d3436",
            lineHeight: "1.3"
        });
        title.textContent = "Edit Node Style";
        const closeIcon = document.createElement('div');
        closeIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
        </svg>`;
        closeIcon.style.cursor = 'pointer';
        closeIcon.style.opacity = '0.7';
        closeIcon.addEventListener('click', () => modalOverlay.remove());
        closeIcon.addEventListener('mouseover', () => closeIcon.style.opacity = '1');
        closeIcon.addEventListener('mouseout', () => closeIcon.style.opacity = '0.7');
        header.appendChild(title);
        header.appendChild(closeIcon);
        modal.appendChild(header);
        // Form Elements
        const createFormGroup = (labelText, input) => {
            const group = (0, styles_1.createBaseElement)('div', {
                marginBottom: '16px'
            });
            const label = (0, styles_1.createBaseElement)('label', {
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#2d3436',
                fontSize: '14px'
            });
            label.textContent = labelText;
            group.appendChild(label);
            group.appendChild(input);
            return group;
        };
        // Text Input
        const textInput = (0, styles_1.createInput)();
        textInput.value = defaultText;
        textInput.style.padding = "12px 16px";
        textInput.style.borderRadius = "8px";
        textInput.style.border = "1px solid #e9ecef";
        textInput.style.background = "#fff";
        modal.appendChild(createFormGroup("Node Label", textInput));
        // Color Inputs
        const colorGroup = (0, styles_1.createBaseElement)('div', {
            display: 'flex',
            gap: '12px',
            marginBottom: '16px'
        });
        const colorInput = (0, styles_1.createInput)("color");
        colorInput.style.height = "48px";
        colorInput.style.flex = "0 0 48px";
        colorInput.style.borderRadius = "8px";
        colorInput.style.overflow = "hidden";
        colorInput.value = (0, styles_1.extractSolidColor)(defaultBg) || "#ffffff";
        const bgInput = (0, styles_1.createInput)();
        bgInput.value = defaultBg;
        bgInput.style.padding = "12px 16px";
        bgInput.style.borderRadius = "8px";
        bgInput.style.border = "1px solid #e9ecef";
        bgInput.style.background = "#fff";
        bgInput.placeholder = "Background color or gradient";
        colorInput.addEventListener("input", () => (bgInput.value = colorInput.value));
        bgInput.addEventListener("input", () => {
            const style = new Option().style;
            style.backgroundColor = bgInput.value;
            if (style.backgroundColor !== "") {
                colorInput.value = (0, styles_1.extractSolidColor)(bgInput.value) || "#ffffff";
            }
        });
        colorGroup.appendChild(colorInput);
        colorGroup.appendChild(bgInput);
        modal.appendChild(createFormGroup("Node Color", colorGroup));
        // Description
        const descTextarea = (0, styles_1.createBaseElement)('textarea', {
            width: "100%",
            padding: "12px 16px",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            fontSize: "14px",
            minHeight: "100px",
            resize: "vertical",
            transition: "all 0.2s ease",
            background: "#fff",
            color: "#495057"
        });
        descTextarea.value = defaultDesc;
        modal.appendChild(createFormGroup("Description", descTextarea));
        // Image URL
        const imageUrlInput = (0, styles_1.createInput)();
        imageUrlInput.placeholder = "Image URL";
        imageUrlInput.value = defaultImageUrl;
        imageUrlInput.style.padding = "12px 16px";
        imageUrlInput.style.borderRadius = "8px";
        imageUrlInput.style.border = "1px solid #e9ecef";
        imageUrlInput.style.background = "#fff";
        modal.appendChild(createFormGroup("Image URL", imageUrlInput));
        // Buttons
        const buttonGroup = (0, styles_1.createBaseElement)('div', {
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "24px"
        });
        const cancelButton = (0, styles_1.createButton)("secondary");
        cancelButton.textContent = "Cancel";
        Object.assign(cancelButton.style, {
            background: "none",
            border: "1px solid #e9ecef",
            color: "#2d3436"
        });
        cancelButton.addEventListener("mouseover", () => cancelButton.style.background = "#f8f9fa");
        cancelButton.addEventListener("mouseout", () => cancelButton.style.background = "none");
        cancelButton.addEventListener("click", () => modalOverlay.remove());
        const saveButton = (0, styles_1.createButton)("primary");
        saveButton.textContent = "Save Changes";
        Object.assign(saveButton.style, {
            background: "linear-gradient(135deg, #6c5ce7, #4b4bff)",
            border: "none",
            color: "white",
            fontWeight: "600",
            padding: "12px 24px",
            borderRadius: "8px"
        });
        saveButton.addEventListener("mouseover", () => {
            saveButton.style.transform = "translateY(-1px)";
            saveButton.style.boxShadow = "0 4px 12px rgba(108, 92, 231, 0.4)";
        });
        saveButton.addEventListener("mouseout", () => {
            saveButton.style.transform = "none";
            saveButton.style.boxShadow = "none";
        });
        saveButton.addEventListener("click", () => {
            modalOverlay.remove();
            resolve({
                text: textInput.value,
                background: bgInput.value,
                description: descTextarea.value,
                imageUrl: imageUrlInput.value
            });
        });
        buttonGroup.appendChild(cancelButton);
        buttonGroup.appendChild(saveButton);
        modal.appendChild(buttonGroup);
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        textInput.focus();
    });
}
