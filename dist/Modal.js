"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showStyleModal = showStyleModal;
exports.showInputModal = showInputModal;
exports.showAddNodeModal = showAddNodeModal;
const styles_1 = require("./styles");
const TextEditor_1 = require("./TextEditor");
function showStyleModal(defaultText, defaultBg, defaultDesc, defaultImageUrl = "", defaultShape = "rectangle") {
    return new Promise((resolve) => {
        const modalOverlay = (0, styles_1.createBaseElement)('div', {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "10000",
            backdropFilter: "blur(12px)",
            transition: `opacity ${styles_1.CSS_VARS.transition.slow}`,
            opacity: "0"
        });
        const modal = (0, styles_1.createBaseElement)('div', {
            background: `linear-gradient(145deg, ${styles_1.CSS_VARS.background}, ${styles_1.CSS_VARS.backgroundSecondary})`,
            padding: "32px",
            borderRadius: styles_1.CSS_VARS.radius.xxl,
            boxShadow: `${styles_1.CSS_VARS.shadow.xxl}, 0 0 60px rgba(77, 171, 247, 0.1)`,
            width: "90%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflowY: "auto",
            transform: "scale(0.8) translateY(40px)",
            transition: `all ${styles_1.CSS_VARS.transition.spring}`,
            opacity: "0",
            border: `1px solid ${styles_1.CSS_VARS.borderLight}`,
            backdropFilter: 'blur(20px)'
        });
        // Dark theme modal override
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            modal.style.background = '#181a1b';
            modal.style.color = '#fff';
            modal.style.boxShadow = '0 0 60px #000';
            modal.style.border = '1px solid #222';
        }
        // Enhanced animation
        setTimeout(() => {
            modalOverlay.style.opacity = "1";
            modal.style.opacity = "1";
            modal.style.transform = "scale(1) translateY(0)";
        }, 10); // Header
        const header = (0, styles_1.createBaseElement)('div', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: styles_1.CSS_VARS.spacing.xxxl,
            paddingBottom: styles_1.CSS_VARS.spacing.xl,
            borderBottom: `2px solid ${styles_1.CSS_VARS.borderLight}`
        });
        const title = (0, styles_1.createBaseElement)('h3', {
            margin: "0",
            fontSize: "28px",
            fontWeight: "700",
            color: styles_1.CSS_VARS.text,
            lineHeight: "1.3",
            background: `linear-gradient(135deg, ${styles_1.CSS_VARS.primary}, ${styles_1.CSS_VARS.primaryHover})`,
            backgroundClip: 'text',
            webkitBackgroundClip: 'text',
            webkitTextFillColor: 'transparent'
        });
        title.textContent = "Edit Node Style";
        const closeIcon = (0, styles_1.createBaseElement)('div', {
            cursor: 'pointer',
            opacity: '0.7',
            padding: styles_1.CSS_VARS.spacing.md,
            borderRadius: styles_1.CSS_VARS.radius.md,
            transition: `all ${styles_1.CSS_VARS.transition.fast}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
        closeIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
        </svg>`;
        closeIcon.addEventListener('click', () => {
            modalOverlay.style.opacity = '0';
            modal.style.transform = 'scale(0.8) translateY(40px)';
            setTimeout(() => modalOverlay.remove(), 300);
        });
        closeIcon.addEventListener('mouseover', () => {
            closeIcon.style.opacity = '1';
            closeIcon.style.background = styles_1.CSS_VARS.danger;
            closeIcon.style.color = 'white';
            closeIcon.style.transform = 'scale(1.1)';
        });
        closeIcon.addEventListener('mouseout', () => {
            closeIcon.style.opacity = '0.7';
            closeIcon.style.background = 'transparent';
            closeIcon.style.color = 'inherit';
            closeIcon.style.transform = 'scale(1)';
        });
        header.appendChild(title);
        header.appendChild(closeIcon);
        modal.appendChild(header); // Form Elements
        const createFormGroup = (labelText, input) => {
            const group = (0, styles_1.createBaseElement)('div', {
                marginBottom: styles_1.CSS_VARS.spacing.xxl
            });
            const label = (0, styles_1.createBaseElement)('label', {
                display: 'block',
                marginBottom: styles_1.CSS_VARS.spacing.lg,
                fontWeight: '600',
                color: styles_1.CSS_VARS.text,
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
                (0, styles_1.animateElement)(group, 'slideInFromLeft', 300);
            }, Math.random() * 100);
            return group;
        };
        // Text Input with enhanced styling
        const textInput = (0, styles_1.createInput)();
        textInput.value = defaultText;
        textInput.style.padding = "16px 20px";
        textInput.style.borderRadius = styles_1.CSS_VARS.radius.lg;
        textInput.style.border = `2px solid ${styles_1.CSS_VARS.border}`;
        textInput.style.background = document.documentElement.getAttribute('data-theme') === 'dark' ? '#23272a' : styles_1.CSS_VARS.background;
        textInput.style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text;
        textInput.style.fontSize = "16px";
        textInput.style.fontWeight = "500";
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
        colorInput.value = (0, styles_1.extractSolidColor)(defaultBg) || styles_1.CSS_VARS.background;
        const bgInput = (0, styles_1.createInput)();
        bgInput.value = defaultBg;
        bgInput.style.padding = "12px 16px";
        bgInput.style.borderRadius = "8px";
        bgInput.style.border = `1px solid ${styles_1.CSS_VARS.border}`;
        bgInput.style.background = document.documentElement.getAttribute('data-theme') === 'dark' ? '#23272a' : styles_1.CSS_VARS.background;
        bgInput.style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text;
        bgInput.placeholder = "Background color or gradient";
        colorInput.addEventListener("input", () => (bgInput.value = colorInput.value));
        bgInput.addEventListener("input", () => {
            const style = new Option().style;
            style.backgroundColor = bgInput.value;
            if (style.backgroundColor !== "") {
                colorInput.value = (0, styles_1.extractSolidColor)(bgInput.value) || styles_1.CSS_VARS.background;
            }
        });
        colorGroup.appendChild(colorInput);
        colorGroup.appendChild(bgInput);
        modal.appendChild(createFormGroup("Node Color", colorGroup)); // Description - using TextEditor component
        const textEditor = new TextEditor_1.TextEditor({
            placeholder: "Enter a detailed description...",
            initialValue: defaultDesc,
            maxHeight: "200px",
            onChange: (content) => {
                // Optional: handle real-time changes
            }
        });
        textEditor.getElement().style.background = document.documentElement.getAttribute('data-theme') === 'dark' ? '#23272a' : styles_1.CSS_VARS.background;
        textEditor.getElement().style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text;
        modal.appendChild(createFormGroup("Description", textEditor.getElement()));
        // Image URL
        const imageUrlInput = (0, styles_1.createInput)();
        imageUrlInput.placeholder = "Image URL";
        imageUrlInput.value = defaultImageUrl;
        imageUrlInput.style.padding = "12px 16px";
        imageUrlInput.style.borderRadius = "8px";
        imageUrlInput.style.border = `1px solid ${styles_1.CSS_VARS.border}`;
        imageUrlInput.style.background = document.documentElement.getAttribute('data-theme') === 'dark' ? '#23272a' : styles_1.CSS_VARS.background;
        imageUrlInput.style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text;
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
        shapeSelect.style.background = document.documentElement.getAttribute('data-theme') === 'dark' ? '#23272a' : styles_1.CSS_VARS.background;
        shapeSelect.style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text;
        modal.appendChild(createFormGroup('Shape', shapeSelect));
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
            border: `1px solid ${styles_1.CSS_VARS.border}`,
            color: styles_1.CSS_VARS.text
        });
        cancelButton.addEventListener("mouseover", () => cancelButton.style.background = styles_1.CSS_VARS.backgroundSecondary);
        cancelButton.addEventListener("mouseout", () => cancelButton.style.background = "none");
        cancelButton.addEventListener("click", () => modalOverlay.remove());
        const saveButton = (0, styles_1.createButton)("primary");
        saveButton.textContent = "Save Changes";
        Object.assign(saveButton.style, {
            background: document.documentElement.getAttribute('data-theme') === 'dark' ? '#4dabf7' : `linear-gradient(135deg, ${styles_1.CSS_VARS.primary}, ${styles_1.CSS_VARS.primaryHover})`,
            border: "none",
            color: '#fff',
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
function showInputModal(titleText, labelText, defaultValue = "") {
    return new Promise(resolve => {
        const overlay = (0, styles_1.createBaseElement)('div', {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: '10000', backdropFilter: 'blur(8px)'
        });
        const modal = (0, styles_1.createBaseElement)('div', {
            background: styles_1.CSS_VARS.background, padding: '24px', borderRadius: '12px', boxShadow: '0 12px 24px rgba(0,0,0,0.2)', width: '90%', maxWidth: '400px'
        });
        const header = (0, styles_1.createBaseElement)('h3', { margin: '0 0 16px', fontSize: '20px', color: styles_1.CSS_VARS.text });
        header.textContent = titleText;
        const input = (0, styles_1.createInput)();
        input.value = defaultValue;
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.marginBottom = '16px';
        const btnGroup = (0, styles_1.createBaseElement)('div', { display: 'flex', justifyContent: 'flex-end', gap: '8px' });
        const cancelBtn = (0, styles_1.createButton)('secondary');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => { overlay.remove(); resolve(null); });
        const okBtn = (0, styles_1.createButton)('primary');
        okBtn.textContent = 'OK';
        okBtn.addEventListener('click', () => { overlay.remove(); resolve(input.value); });
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
function showAddNodeModal(titleText, defaultLabel = "", defaultDescription = "", labelPlaceholder = "Node Label") {
    return new Promise(resolve => {
        const overlay = (0, styles_1.createBaseElement)('div', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10000',
            backdropFilter: 'blur(8px)'
        });
        const modal = (0, styles_1.createBaseElement)('div', {
            background: document.documentElement.getAttribute('data-theme') === 'dark' ? '#181a1b' : styles_1.CSS_VARS.background,
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
            width: '90%',
            maxWidth: '400px',
            color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text
        });
        const header = (0, styles_1.createBaseElement)('h3', {
            margin: '0 0 16px',
            fontSize: '20px',
            color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text
        });
        header.textContent = titleText;
        const labelInput = (0, styles_1.createInput)();
        labelInput.value = defaultLabel;
        labelInput.placeholder = labelPlaceholder;
        labelInput.style.width = '100%';
        labelInput.style.padding = '8px';
        labelInput.style.marginBottom = '16px';
        labelInput.style.background = document.documentElement.getAttribute('data-theme') === 'dark' ? '#23272a' : styles_1.CSS_VARS.background;
        labelInput.style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text;
        const descInput = (0, styles_1.createBaseElement)('textarea', {
            width: '100%',
            padding: `${styles_1.CSS_VARS.spacing.lg} ${styles_1.CSS_VARS.spacing.xl}`,
            border: `2px solid ${styles_1.CSS_VARS['input-border']}`,
            borderRadius: styles_1.CSS_VARS.radius.md,
            fontSize: '14px',
            fontWeight: '500',
            transition: `all ${styles_1.CSS_VARS.transition.normal}`,
            background: document.documentElement.getAttribute('data-theme') === 'dark' ? '#23272a' : styles_1.CSS_VARS['input-bg'],
            color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS['input-text'],
            outline: 'none',
            boxShadow: styles_1.CSS_VARS.shadow.xs,
            resize: 'vertical',
            marginBottom: '16px'
        });
        descInput.rows = 3;
        descInput.value = defaultDescription;
        descInput.addEventListener('focus', () => {
            descInput.style.borderColor = styles_1.CSS_VARS['input-focus'];
            descInput.style.boxShadow = `${styles_1.CSS_VARS.shadow.sm}, 0 0 0 3px rgba(77, 171, 247, 0.1)`;
            descInput.style.transform = 'translateY(-1px)';
        });
        descInput.addEventListener('blur', () => {
            descInput.style.borderColor = styles_1.CSS_VARS['input-border'];
            descInput.style.boxShadow = styles_1.CSS_VARS.shadow.xs;
            descInput.style.transform = 'translateY(0)';
        });
        const btnGroup = (0, styles_1.createBaseElement)('div', {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px'
        });
        const cancelBtn = (0, styles_1.createButton)('secondary');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = document.documentElement.getAttribute('data-theme') === 'dark' ? '#23272a' : 'none';
        cancelBtn.style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : styles_1.CSS_VARS.text;
        cancelBtn.addEventListener('click', () => { overlay.remove(); resolve(null); });
        const okBtn = (0, styles_1.createButton)('primary');
        okBtn.textContent = 'Add';
        okBtn.style.background = document.documentElement.getAttribute('data-theme') === 'dark' ? '#4dabf7' : `linear-gradient(135deg, ${styles_1.CSS_VARS.primary}, ${styles_1.CSS_VARS.primaryHover})`;
        okBtn.style.color = '#fff';
        okBtn.addEventListener('click', () => {
            const label = labelInput.value.trim();
            const description = descInput.value.trim();
            overlay.remove();
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
