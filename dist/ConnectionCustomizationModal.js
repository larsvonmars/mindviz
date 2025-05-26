"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showConnectionCustomizationModal = showConnectionCustomizationModal;
const styles_1 = require("./styles");
function showConnectionCustomizationModal(defaults) {
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
        const modalContainer = (0, styles_1.createBaseElement)('div', {
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
        setTimeout(() => {
            modalOverlay.style.opacity = "1";
            modalContainer.style.opacity = "1";
            modalContainer.style.transform = "scale(1)";
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
        title.textContent = `Customize Connection (${defaults.sourceId} → ${defaults.targetId})`;
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
        modalContainer.appendChild(header);
        // Inputs
        const createStyledInput = (input, labelText) => {
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
            Object.assign(input.style, {
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                background: '#fff',
                transition: 'all 0.2s ease'
            });
            group.appendChild(label);
            group.appendChild(input);
            return group;
        };
        // Color Input
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = defaults.color || "#ced4da";
        modalContainer.appendChild(createStyledInput(colorInput, "Connection Color"));
        // Width Input
        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.placeholder = "Line Width (e.g. 2)";
        widthInput.value = defaults.width?.toString() || "2";
        modalContainer.appendChild(createStyledInput(widthInput, "Line Width"));
        // Dash Input
        const dashInput = document.createElement("input");
        dashInput.type = "text";
        dashInput.placeholder = "Dash Pattern (optional, e.g. 5,5)";
        dashInput.value = defaults.dasharray || "";
        modalContainer.appendChild(createStyledInput(dashInput, "Dash Pattern"));
        // Label Input
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.placeholder = "Connection Label (optional)";
        labelInput.value = defaults.label || "";
        modalContainer.appendChild(createStyledInput(labelInput, "Connection Label"));
        // Arrowhead Toggle
        const arrowHeadInput = document.createElement("input");
        arrowHeadInput.type = "checkbox";
        arrowHeadInput.checked = defaults.arrowHead !== false;
        modalContainer.appendChild(createStyledInput(arrowHeadInput, "Show Arrowhead"));
        // Arrowhead Type Selector
        const typeGroup = (0, styles_1.createBaseElement)('div', { marginBottom: '16px' });
        const typeLabel = (0, styles_1.createBaseElement)('label', { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3436', fontSize: '14px' });
        typeLabel.textContent = 'Arrowhead Type';
        const arrowTypeSelect = document.createElement('select');
        ['triangle', 'circle', 'diamond'].forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val.charAt(0).toUpperCase() + val.slice(1);
            arrowTypeSelect.appendChild(opt);
        });
        arrowTypeSelect.value = defaults.arrowType || 'triangle';
        Object.assign(arrowTypeSelect.style, { width: '100%', padding: '12px 16px', border: '1px solid #e9ecef', borderRadius: '8px', background: '#fff' });
        typeGroup.append(typeLabel, arrowTypeSelect);
        modalContainer.appendChild(typeGroup);
        // Buttons
        const buttonContainer = (0, styles_1.createBaseElement)('div', {
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px"
        });
        const createActionButton = (text, variant) => {
            const button = createButton(variant);
            button.textContent = text;
            Object.assign(button.style, {
                padding: "12px 24px",
                borderRadius: "8px",
                ...(variant === 'primary' && {
                    background: "linear-gradient(135deg, #6c5ce7, #4b4bff)",
                    border: "none",
                    color: "white"
                }),
                ...(variant === 'danger' && {
                    background: "linear-gradient(135deg, #ff7675, #ff4757)",
                    border: "none",
                    color: "white"
                }),
                ...(variant === 'secondary' && {
                    background: "none",
                    border: "1px solid #e9ecef",
                    color: "#2d3436"
                })
            });
            return button;
        };
        const deleteButton = createActionButton("Delete", 'danger');
        deleteButton.addEventListener("click", () => {
            modalOverlay.remove();
            resolve({ action: "delete" });
        });
        const cancelButton = createActionButton("Cancel", 'secondary');
        cancelButton.addEventListener("click", () => modalOverlay.remove());
        const okButton = createActionButton("OK", 'primary');
        okButton.addEventListener("click", () => {
            modalOverlay.remove();
            resolve({
                action: "update",
                color: colorInput.value,
                width: parseFloat(widthInput.value),
                dasharray: dashInput.value,
                label: labelInput.value,
                arrowHead: arrowHeadInput.checked,
                arrowType: arrowTypeSelect.value,
            });
        });
        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(okButton);
        modalContainer.appendChild(buttonContainer);
        modalOverlay.appendChild(modalContainer);
        const parent = document.fullscreenElement || document.body;
        parent.appendChild(modalOverlay);
    });
}
function createButton(variant) {
    const button = document.createElement('button');
    button.className = `btn-${variant}`;
    return button;
}
