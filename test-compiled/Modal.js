import { createBaseElement, createInput, createButton, CSS_VARS, extractSolidColor, animateElement, createCloseIcon } from "./styles";
import { TextEditor } from "./TextEditor";
export function showStyleModal(defaultText, defaultBg, defaultDesc, defaultImageUrl = "", defaultShape = "rectangle") {
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
        const modal = createBaseElement('div', {
            background: CSS_VARS['modal-bg'],
            padding: "32px",
            borderRadius: CSS_VARS.radius.xxl,
            boxShadow: `${CSS_VARS.shadow.xxl}, 0 0 60px rgba(77, 171, 247, 0.1)`,
            width: "90%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflowY: "auto",
            transform: "scale(0.8) translateY(40px)",
            transition: `all ${CSS_VARS.transition.spring}`,
            opacity: "0",
            border: `1px solid ${CSS_VARS['modal-border']}`,
            backdropFilter: 'blur(20px)'
        });
        // Enhanced animation
        setTimeout(() => {
            modalOverlay.style.opacity = "1";
            modal.style.opacity = "1";
            modal.style.transform = "scale(1) translateY(0)";
        }, 10); // Header
        const header = createBaseElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: CSS_VARS.spacing.xxxl,
            paddingBottom: CSS_VARS.spacing.xl,
            borderBottom: `2px solid ${CSS_VARS['modal-border']}`
        });
        const title = createBaseElement('h3', {
            margin: "0",
            fontSize: "28px",
            fontWeight: "700",
            color: CSS_VARS.primary,
            lineHeight: "1.3"
        });
        title.textContent = "Edit Node Style";
        const closeIcon = createCloseIcon(() => {
            modalOverlay.style.opacity = '0';
            modal.style.transform = 'scale(0.8) translateY(40px)';
            setTimeout(() => modalOverlay.remove(), 300);
        });
        header.appendChild(title);
        header.appendChild(closeIcon);
        modal.appendChild(header); // Form Elements
        const createFormGroup = (labelText, input) => {
            const group = createBaseElement('div', {
                marginBottom: CSS_VARS.spacing.xxl
            });
            const label = createBaseElement('label', {
                display: 'block',
                marginBottom: CSS_VARS.spacing.lg,
                fontWeight: '600',
                color: CSS_VARS.text,
                fontSize: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: '0.8'
            });
            label.textContent = labelText;
            group.appendChild(label);
            group.appendChild(input);
            // Add animation to the group
            setTimeout(() => {
                animateElement(group, 'slideInFromLeft', 300);
            }, Math.random() * 100);
            return group;
        };
        // Text Input with enhanced styling
        const textInput = createInput();
        textInput.value = defaultText;
        textInput.style.padding = "16px 20px";
        textInput.style.borderRadius = CSS_VARS.radius.lg;
        textInput.style.border = `2px solid ${CSS_VARS.border}`;
        textInput.style.background = CSS_VARS['input-bg'];
        textInput.style.color = CSS_VARS['input-text'];
        textInput.style.fontSize = "16px";
        textInput.style.fontWeight = "500";
        modal.appendChild(createFormGroup("Node Label", textInput));
        // Color Inputs
        const colorGroup = createBaseElement('div', {
            display: 'flex',
            gap: '12px',
            marginBottom: '16px'
        });
        const colorInput = createInput("color");
        colorInput.style.height = "48px";
        colorInput.style.flex = "0 0 48px";
        colorInput.style.borderRadius = "8px";
        colorInput.style.overflow = "hidden";
        colorInput.value = extractSolidColor(defaultBg) || CSS_VARS.background;
        const bgInput = createInput();
        bgInput.value = defaultBg;
        bgInput.style.padding = "12px 16px";
        bgInput.style.borderRadius = "8px";
        bgInput.style.border = `1px solid ${CSS_VARS.border}`;
        bgInput.style.background = CSS_VARS['input-bg'];
        bgInput.style.color = CSS_VARS['input-text'];
        bgInput.placeholder = "Background color or gradient";
        colorInput.addEventListener("input", () => (bgInput.value = colorInput.value));
        bgInput.addEventListener("input", () => {
            const style = new Option().style;
            style.backgroundColor = bgInput.value;
            if (style.backgroundColor !== "") {
                colorInput.value = extractSolidColor(bgInput.value) || CSS_VARS.background;
            }
        });
        colorGroup.appendChild(colorInput);
        colorGroup.appendChild(bgInput);
        modal.appendChild(createFormGroup("Node Color", colorGroup)); // Description - using TextEditor component
        const textEditor = new TextEditor({
            placeholder: "Enter a detailed description...",
            initialValue: defaultDesc,
            maxHeight: "200px",
            onChange: (content) => {
                // Optional: handle real-time changes
            }
        });
        textEditor.getElement().style.background = CSS_VARS['input-bg'];
        textEditor.getElement().style.color = CSS_VARS['input-text'];
        modal.appendChild(createFormGroup("Description", textEditor.getElement()));
        // Image URL
        const imageUrlInput = createInput();
        imageUrlInput.placeholder = "Image URL";
        imageUrlInput.value = defaultImageUrl;
        imageUrlInput.style.padding = "12px 16px";
        imageUrlInput.style.borderRadius = "8px";
        imageUrlInput.style.border = `1px solid ${CSS_VARS.border}`;
        imageUrlInput.style.background = CSS_VARS['input-bg'];
        imageUrlInput.style.color = CSS_VARS['input-text'];
        modal.appendChild(createFormGroup("Image URL", imageUrlInput));
        // Shape selection
        const shapeSelect = document.createElement('select');
        ['rectangle', 'circle', 'ellipse', 'diamond'].forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
            if (s === defaultShape)
                opt.selected = true;
            shapeSelect.appendChild(opt);
        });
        shapeSelect.style.background = CSS_VARS['input-bg'];
        shapeSelect.style.color = CSS_VARS['input-text'];
        modal.appendChild(createFormGroup('Shape', shapeSelect));
        // Buttons
        const buttonGroup = createBaseElement('div', {
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "24px"
        });
        const cancelButton = createButton("secondary");
        cancelButton.textContent = "Cancel";
        Object.assign(cancelButton.style, {
            background: "none",
            border: `1px solid ${CSS_VARS.border}`,
            color: CSS_VARS.text
        });
        cancelButton.addEventListener("mouseover", () => cancelButton.style.background = CSS_VARS.backgroundSecondary);
        cancelButton.addEventListener("mouseout", () => cancelButton.style.background = "none");
        cancelButton.addEventListener("click", () => modalOverlay.remove());
        const saveButton = createButton("primary");
        saveButton.textContent = "Save Changes";
        Object.assign(saveButton.style, {
            background: CSS_VARS.primary,
            border: "none",
            color: 'white',
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
                description: textEditor.getContent(),
                imageUrl: imageUrlInput.value,
                shape: shapeSelect.value
            });
        });
        buttonGroup.appendChild(cancelButton);
        buttonGroup.appendChild(saveButton);
        modal.appendChild(buttonGroup);
        modalOverlay.appendChild(modal);
        const parent = document.fullscreenElement || document.body;
        parent.appendChild(modalOverlay);
        textInput.focus();
    });
}
export function showInputModal(titleText, labelText, defaultValue = "") {
    return new Promise(resolve => {
        const overlay = createBaseElement('div', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: CSS_VARS['overlay-bg'],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10000',
            backdropFilter: 'blur(12px)',
            transition: `opacity ${CSS_VARS.transition.slow}`,
            opacity: '0'
        });
        const modal = createBaseElement('div', {
            background: CSS_VARS['modal-bg'],
            padding: '24px',
            borderRadius: CSS_VARS.radius.xl,
            boxShadow: CSS_VARS.shadow.xl,
            width: '90%',
            maxWidth: '400px',
            border: `1px solid ${CSS_VARS['modal-border']}`,
            color: CSS_VARS['modal-text'],
            transform: 'scale(0.9)',
            transition: `all ${CSS_VARS.transition.spring}`,
            opacity: '0'
        });
        // Enhanced animation
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);
        const header = createBaseElement('h3', {
            margin: '0 0 16px',
            fontSize: '20px',
            fontWeight: '600',
            color: CSS_VARS['modal-text']
        });
        header.textContent = titleText;
        const input = createInput();
        input.value = defaultValue;
        input.style.width = '100%';
        input.style.padding = '12px 16px';
        input.style.marginBottom = '16px';
        input.style.background = CSS_VARS['input-bg'];
        input.style.color = CSS_VARS['input-text'];
        input.style.border = `2px solid ${CSS_VARS['input-border']}`;
        input.style.borderRadius = CSS_VARS.radius.md;
        const btnGroup = createBaseElement('div', {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
        });
        const cancelBtn = createButton('secondary');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = 'none';
        cancelBtn.style.border = `1px solid ${CSS_VARS.border}`;
        cancelBtn.style.color = CSS_VARS.text;
        cancelBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => overlay.remove(), 300);
            resolve(null);
        });
        const okBtn = createButton('primary');
        okBtn.textContent = 'OK';
        okBtn.style.background = CSS_VARS.primary;
        okBtn.style.color = 'white';
        okBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => overlay.remove(), 300);
            resolve(input.value);
        });
        btnGroup.appendChild(cancelBtn);
        btnGroup.appendChild(okBtn);
        modal.appendChild(header);
        modal.appendChild(input);
        modal.appendChild(btnGroup);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        input.focus();
    });
}
export function showAddNodeModal(titleText, defaultLabel = "", defaultDescription = "", labelPlaceholder = "Node Label") {
    return new Promise(resolve => {
        const overlay = createBaseElement('div', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: CSS_VARS['overlay-bg'],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10000',
            backdropFilter: 'blur(12px)',
            transition: `opacity ${CSS_VARS.transition.slow}`,
            opacity: '0'
        });
        const modal = createBaseElement('div', {
            background: CSS_VARS['modal-bg'],
            padding: '24px',
            borderRadius: CSS_VARS.radius.xl,
            boxShadow: CSS_VARS.shadow.xl,
            width: '90%',
            maxWidth: '400px',
            color: CSS_VARS['modal-text'],
            border: `1px solid ${CSS_VARS['modal-border']}`,
            transform: 'scale(0.9)',
            transition: `all ${CSS_VARS.transition.spring}`,
            opacity: '0'
        });
        // Enhanced animation
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);
        const header = createBaseElement('h3', {
            margin: '0 0 16px',
            fontSize: '20px',
            fontWeight: '600',
            color: CSS_VARS['modal-text']
        });
        header.textContent = titleText;
        const labelInput = createInput();
        labelInput.value = defaultLabel;
        labelInput.placeholder = labelPlaceholder;
        labelInput.style.width = '100%';
        labelInput.style.padding = '12px 16px';
        labelInput.style.marginBottom = '16px';
        labelInput.style.background = CSS_VARS['input-bg'];
        labelInput.style.color = CSS_VARS['input-text'];
        labelInput.style.border = `2px solid ${CSS_VARS['input-border']}`;
        labelInput.style.borderRadius = CSS_VARS.radius.md;
        const descInput = createBaseElement('textarea', {
            width: '100%',
            padding: `${CSS_VARS.spacing.lg} ${CSS_VARS.spacing.xl}`,
            border: `2px solid ${CSS_VARS['input-border']}`,
            borderRadius: CSS_VARS.radius.md,
            fontSize: '14px',
            fontWeight: '500',
            transition: `all ${CSS_VARS.transition.normal}`,
            background: CSS_VARS['input-bg'],
            color: CSS_VARS['input-text'],
            outline: 'none',
            boxShadow: CSS_VARS.shadow.xs,
            resize: 'vertical',
            marginBottom: '16px'
        });
        descInput.rows = 3;
        descInput.value = defaultDescription;
        descInput.placeholder = 'Node Description (optional)';
        descInput.addEventListener('focus', () => {
            descInput.style.borderColor = CSS_VARS['input-focus'];
            descInput.style.boxShadow = `${CSS_VARS.shadow.sm}, 0 0 0 3px rgba(77, 171, 247, 0.1)`;
            descInput.style.transform = 'translateY(-1px)';
        });
        descInput.addEventListener('blur', () => {
            descInput.style.borderColor = CSS_VARS['input-border'];
            descInput.style.boxShadow = CSS_VARS.shadow.xs;
            descInput.style.transform = 'translateY(0)';
        });
        const btnGroup = createBaseElement('div', {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
        });
        const cancelBtn = createButton('secondary');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = 'none';
        cancelBtn.style.border = `1px solid ${CSS_VARS.border}`;
        cancelBtn.style.color = CSS_VARS.text;
        cancelBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => overlay.remove(), 300);
            resolve(null);
        });
        const okBtn = createButton('primary');
        okBtn.textContent = 'Add';
        okBtn.style.background = CSS_VARS.primary;
        okBtn.style.color = 'white';
        okBtn.addEventListener('click', () => {
            const label = labelInput.value.trim();
            const description = descInput.value.trim();
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => overlay.remove(), 300);
            if (!label) {
                resolve(null);
            }
            else {
                resolve({ label, description });
            }
        });
        btnGroup.appendChild(cancelBtn);
        btnGroup.appendChild(okBtn);
        modal.appendChild(header);
        modal.appendChild(labelInput);
        modal.appendChild(descInput);
        modal.appendChild(btnGroup);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        labelInput.focus();
    });
}
