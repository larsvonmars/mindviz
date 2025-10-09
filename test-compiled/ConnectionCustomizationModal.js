import { createBaseElement, CSS_VARS, createCloseIcon, createButton } from "./styles";
export function showConnectionCustomizationModal(defaults) {
    return new Promise((resolve) => {
        const modalOverlay = createBaseElement('div', {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: CSS_VARS['overlay-bg'],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "10000",
            backdropFilter: "blur(12px)",
            transition: `opacity ${CSS_VARS.transition.slow}`,
            opacity: "0"
        });
        const modalContainer = createBaseElement('div', {
            background: CSS_VARS['modal-bg'],
            padding: "24px",
            borderRadius: CSS_VARS.radius.xl,
            boxShadow: CSS_VARS.shadow.xl,
            width: "90%",
            maxWidth: "440px",
            transform: "scale(0.9)",
            transition: `all ${CSS_VARS.transition.spring}`,
            opacity: "0",
            border: `1px solid ${CSS_VARS['modal-border']}`,
            color: CSS_VARS['modal-text']
        });
        setTimeout(() => {
            modalOverlay.style.opacity = "1";
            modalContainer.style.opacity = "1";
            modalContainer.style.transform = "scale(1)";
        }, 10);
        // Header
        const header = createBaseElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
        });
        const title = createBaseElement('h3', {
            margin: "0",
            fontSize: "24px",
            fontWeight: "700",
            color: CSS_VARS['modal-text'],
            lineHeight: "1.3"
        });
        title.textContent = `Customize Connection (${defaults.sourceId} → ${defaults.targetId})`;
        const closeIcon = createCloseIcon(() => {
            modalOverlay.style.opacity = '0';
            modalContainer.style.transform = 'scale(0.9)';
            setTimeout(() => modalOverlay.remove(), 300);
        });
        header.appendChild(title);
        header.appendChild(closeIcon);
        modalContainer.appendChild(header);
        // Inputs
        const createStyledInput = (input, labelText) => {
            const group = createBaseElement('div', {
                marginBottom: '16px'
            });
            const label = createBaseElement('label', {
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: CSS_VARS['modal-text'],
                fontSize: '14px'
            });
            label.textContent = labelText;
            Object.assign(input.style, {
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${CSS_VARS['input-border']}`,
                borderRadius: CSS_VARS.radius.md,
                background: CSS_VARS['input-bg'],
                color: CSS_VARS['input-text'],
                transition: `all ${CSS_VARS.transition.normal}`,
                outline: 'none',
                fontSize: '14px'
            });
            // Add focus effect
            input.addEventListener('focus', () => {
                input.style.borderColor = CSS_VARS['input-focus'];
                input.style.boxShadow = `${CSS_VARS.shadow.sm}, 0 0 0 3px rgba(77, 171, 247, 0.1)`;
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = CSS_VARS['input-border'];
                input.style.boxShadow = 'none';
            });
            group.appendChild(label);
            group.appendChild(input);
            return group;
        };
        // Color Input
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = defaults.color || CSS_VARS['connection-color'];
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
        const typeGroup = createBaseElement('div', { marginBottom: '16px' });
        const typeLabel = createBaseElement('label', {
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: CSS_VARS['modal-text'],
            fontSize: '14px'
        });
        typeLabel.textContent = 'Arrowhead Type';
        const arrowTypeSelect = document.createElement('select');
        ['triangle', 'circle', 'diamond'].forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val.charAt(0).toUpperCase() + val.slice(1);
            arrowTypeSelect.appendChild(opt);
        });
        arrowTypeSelect.value = defaults.arrowType || 'triangle';
        Object.assign(arrowTypeSelect.style, {
            width: '100%',
            padding: '12px 16px',
            border: `2px solid ${CSS_VARS['input-border']}`,
            borderRadius: CSS_VARS.radius.md,
            background: CSS_VARS['input-bg'],
            color: CSS_VARS['input-text'],
            transition: `all ${CSS_VARS.transition.normal}`,
            outline: 'none',
            fontSize: '14px',
            cursor: 'pointer'
        });
        // Add focus effect
        arrowTypeSelect.addEventListener('focus', () => {
            arrowTypeSelect.style.borderColor = CSS_VARS['input-focus'];
            arrowTypeSelect.style.boxShadow = `${CSS_VARS.shadow.sm}, 0 0 0 3px rgba(77, 171, 247, 0.1)`;
        });
        arrowTypeSelect.addEventListener('blur', () => {
            arrowTypeSelect.style.borderColor = CSS_VARS['input-border'];
            arrowTypeSelect.style.boxShadow = 'none';
        });
        typeGroup.append(typeLabel, arrowTypeSelect);
        modalContainer.appendChild(typeGroup);
        // Buttons
        const buttonContainer = createBaseElement('div', {
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px"
        });
        const deleteButton = createButton('danger');
        deleteButton.textContent = "Delete";
        deleteButton.style.background = CSS_VARS.danger;
        deleteButton.style.color = 'white';
        deleteButton.addEventListener("click", () => {
            modalOverlay.style.opacity = '0';
            modalContainer.style.transform = 'scale(0.9)';
            setTimeout(() => modalOverlay.remove(), 300);
            resolve({ action: "delete" });
        });
        const cancelButton = createButton('secondary');
        cancelButton.textContent = "Cancel";
        cancelButton.style.background = 'none';
        cancelButton.style.border = `1px solid ${CSS_VARS.border}`;
        cancelButton.style.color = CSS_VARS.text;
        cancelButton.addEventListener("click", () => {
            modalOverlay.style.opacity = '0';
            modalContainer.style.transform = 'scale(0.9)';
            setTimeout(() => modalOverlay.remove(), 300);
        });
        const okButton = createButton('primary');
        okButton.textContent = "OK";
        okButton.style.background = CSS_VARS.primary;
        okButton.style.color = 'white';
        okButton.addEventListener("click", () => {
            modalOverlay.style.opacity = '0';
            modalContainer.style.transform = 'scale(0.9)';
            setTimeout(() => modalOverlay.remove(), 300);
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
