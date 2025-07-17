import { createBaseElement, createInput, createButton, CSS_VARS, extractSolidColor, animateElement } from "./styles";
import { TextEditor } from "./TextEditor";

export function showStyleModal(defaultText: string, defaultBg: string, defaultDesc: string, defaultImageUrl: string = "", defaultShape: string = "rectangle"): Promise<{ text: string, background: string, description: string, imageUrl: string, shape: string } | null> {
    return new Promise((resolve) => {        const modalOverlay = createBaseElement<HTMLDivElement>('div', {
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
            transition: `opacity ${CSS_VARS.transition.slow}`,
            opacity: "0"
        });

        const modal = createBaseElement<HTMLDivElement>('div', {
            background: `linear-gradient(145deg, ${CSS_VARS.background}, ${CSS_VARS.backgroundSecondary})`,
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
            border: `1px solid ${CSS_VARS.borderLight}`,
            backdropFilter: 'blur(20px)'
        });

        // Enhanced animation
        setTimeout(() => {
            modalOverlay.style.opacity = "1";
            modal.style.opacity = "1";
            modal.style.transform = "scale(1) translateY(0)";
        }, 10);        // Header
        const header = createBaseElement<HTMLDivElement>('div', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: CSS_VARS.spacing.xxxl,
            paddingBottom: CSS_VARS.spacing.xl,
            borderBottom: `2px solid ${CSS_VARS.borderLight}`
        });        const title = createBaseElement<HTMLHeadingElement>('h3', {
            margin: "0",
            fontSize: "28px",
            fontWeight: "700",
            color: CSS_VARS.text,
            lineHeight: "1.3",
            background: `linear-gradient(135deg, ${CSS_VARS.primary}, ${CSS_VARS.primaryHover})`,
            backgroundClip: 'text',
            webkitBackgroundClip: 'text',
            webkitTextFillColor: 'transparent'
        });
        title.textContent = "Edit Node Style";

        const closeIcon = createBaseElement<HTMLDivElement>('div', {
            cursor: 'pointer',
            opacity: '0.7',
            padding: CSS_VARS.spacing.md,
            borderRadius: CSS_VARS.radius.md,
            transition: `all ${CSS_VARS.transition.fast}`,
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
            closeIcon.style.background = CSS_VARS.danger;
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
        modal.appendChild(header);        // Form Elements
        const createFormGroup = (labelText: string, input: HTMLElement) => {
            const group = createBaseElement<HTMLDivElement>('div', {
                marginBottom: CSS_VARS.spacing.xxl
            });
            const label = createBaseElement<HTMLLabelElement>('label', {
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
        textInput.style.background = CSS_VARS.background;
        textInput.style.fontSize = "16px";
        textInput.style.fontWeight = "500";
        modal.appendChild(createFormGroup("Node Label", textInput));

        // Color Inputs
        const colorGroup = createBaseElement<HTMLDivElement>('div', {
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
        bgInput.style.background = CSS_VARS.background;
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
        modal.appendChild(createFormGroup("Node Color", colorGroup));        // Description - using TextEditor component
        const textEditor = new TextEditor({
            placeholder: "Enter a detailed description...",
            initialValue: defaultDesc,
            maxHeight: "200px",
            onChange: (content) => {
                // Optional: handle real-time changes
            }
        });
        modal.appendChild(createFormGroup("Description", textEditor.getElement()));

        // Image URL
        const imageUrlInput = createInput();
        imageUrlInput.placeholder = "Image URL";
        imageUrlInput.value = defaultImageUrl;
        imageUrlInput.style.padding = "12px 16px";
        imageUrlInput.style.borderRadius = "8px";
        imageUrlInput.style.border = `1px solid ${CSS_VARS.border}`;
        imageUrlInput.style.background = CSS_VARS.background;
        modal.appendChild(createFormGroup("Image URL", imageUrlInput));

        // Shape selection
        const shapeSelect = document.createElement('select');
        ['rectangle', 'circle', 'ellipse', 'diamond'].forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
            if (s === defaultShape) opt.selected = true;
            shapeSelect.appendChild(opt);
        });
        modal.appendChild(createFormGroup('Shape', shapeSelect));

        // Buttons
        const buttonGroup = createBaseElement<HTMLDivElement>('div', {
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
            background: `linear-gradient(135deg, ${CSS_VARS.primary}, ${CSS_VARS.primaryHover})`,
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
        });        saveButton.addEventListener("click", () => {
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

export function showInputModal(
  titleText: string,
  labelText: string,
  defaultValue: string = ""
): Promise<string | null> {
  return new Promise(resolve => {
    const overlay = createBaseElement<HTMLDivElement>('div', {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '10000', backdropFilter: 'blur(8px)' });
    const modal = createBaseElement<HTMLDivElement>('div', {
      background: CSS_VARS.background, padding: '24px', borderRadius: '12px', boxShadow: '0 12px 24px rgba(0,0,0,0.2)', width: '90%', maxWidth: '400px'
    });
    const header = createBaseElement<HTMLHeadingElement>('h3', { margin: '0 0 16px', fontSize: '20px', color: CSS_VARS.text });
    header.textContent = titleText;
    const input = createInput();
    input.value = defaultValue;
    input.style.width = '100%'; input.style.padding = '8px'; input.style.marginBottom = '16px';
    const btnGroup = createBaseElement<HTMLDivElement>('div', { display: 'flex', justifyContent: 'flex-end', gap: '8px' });
    const cancelBtn = createButton('secondary'); cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { overlay.remove(); resolve(null); });
    const okBtn = createButton('primary'); okBtn.textContent = 'OK';
    okBtn.addEventListener('click', () => { overlay.remove(); resolve(input.value); });
    btnGroup.appendChild(cancelBtn); btnGroup.appendChild(okBtn);
    modal.appendChild(header);
    modal.appendChild(input);
    modal.appendChild(btnGroup);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    input.focus();
  });
}