"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMindNodeElement = createMindNodeElement;
const styles_1 = require("./styles");
function createMindNodeElement(options) {
    const { mindNode, x, y, descriptionExpanded, onToggleDescription, onClick, shape } = options;
    // Use utility to create the node container with base styles.
    const nodeDiv = (0, styles_1.createBaseElement)('div', {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        padding: `${styles_1.CSS_VARS.spacing.lg} ${styles_1.CSS_VARS.spacing.xxl}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: styles_1.CSS_VARS.spacing.sm,
        zIndex: '1',
        background: mindNode.background || styles_1.CSS_VARS['node-bg'],
        border: `1px solid ${styles_1.CSS_VARS['node-border-color']}`,
        borderRadius: shape === 'rectangle' ? styles_1.CSS_VARS.radius.xl : styles_1.CSS_VARS.radius.full,
        boxShadow: styles_1.CSS_VARS.shadow.md,
        fontSize: '14px',
        fontWeight: '600',
        color: styles_1.CSS_VARS['node-text'],
        cursor: 'pointer',
        transition: `all ${styles_1.CSS_VARS.transition.normal}`,
        textAlign: 'center',
        touchAction: 'none',
        overflow: shape === 'diamond' ? 'hidden' : 'visible',
        backdropFilter: 'blur(6px)',
        minWidth: '80px',
        minHeight: '44px',
        userSelect: 'none'
    });
    // Enhanced shape styling
    if (shape === 'diamond') {
        nodeDiv.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        nodeDiv.style.transform = 'rotate(0deg)';
    }
    // Add hover effects
    nodeDiv.addEventListener('mouseenter', () => {
        nodeDiv.style.transform = `${shape === 'diamond' ? 'rotate(0deg) ' : ''}translateY(-3px) scale(1.05)`;
        nodeDiv.style.boxShadow = styles_1.CSS_VARS.shadow.lg;
        nodeDiv.style.borderColor = styles_1.CSS_VARS.primary;
    });
    nodeDiv.addEventListener('mouseleave', () => {
        nodeDiv.style.transform = `${shape === 'diamond' ? 'rotate(0deg) ' : ''}translateY(0) scale(1)`;
        nodeDiv.style.boxShadow = styles_1.CSS_VARS.shadow.md;
        nodeDiv.style.borderColor = styles_1.CSS_VARS['node-border-color'];
    });
    // Add entrance animation
    setTimeout(() => {
        (0, styles_1.animateElement)(nodeDiv, 'fadeInScale', 300);
    }, Math.random() * 200); // Stagger animations
    // Header containing label and (optional) toggle button
    // Create header using the utility.
    const header = (0, styles_1.createBaseElement)('div', {
        display: 'flex',
        alignItems: 'center',
        gap: styles_1.CSS_VARS.spacing.md,
        justifyContent: 'center',
        position: 'relative'
    });
    const label = document.createElement("span");
    label.textContent = mindNode.label;
    // Auto-fit text: wrap lines inside node width
    label.style.display = 'block';
    label.style.width = '100%';
    label.style.whiteSpace = 'pre-wrap';
    label.style.wordBreak = 'break-word';
    label.style.overflowWrap = 'break-word';
    label.style.textAlign = 'center';
    label.style.lineHeight = '1.4';
    label.style.transition = `color ${styles_1.CSS_VARS.transition.normal}`;
    header.appendChild(label);
    if (mindNode.description) {
        const toggleButton = (0, styles_1.createBaseElement)('div', {
            cursor: 'pointer',
            padding: styles_1.CSS_VARS.spacing.sm,
            borderRadius: styles_1.CSS_VARS.radius.sm,
            transition: `all ${styles_1.CSS_VARS.transition.fast}`,
            opacity: '0.7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
        toggleButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 6l6 6-6 6"/>
			</svg>`;
        toggleButton.addEventListener('mouseenter', () => {
            toggleButton.style.opacity = '1';
            toggleButton.style.background = styles_1.CSS_VARS.primaryLight;
            toggleButton.style.transform = 'scale(1.1)';
        });
        toggleButton.addEventListener('mouseleave', () => {
            toggleButton.style.opacity = '0.7';
            toggleButton.style.background = 'transparent';
            toggleButton.style.transform = 'scale(1)';
        });
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // Add click animation
            toggleButton.style.transform = 'scale(0.9)';
            setTimeout(() => {
                toggleButton.style.transform = 'scale(1.1)';
            }, 100);
            // Pass node title, description, and imageUrl (if any)
            openDescriptionModal(mindNode.label, mindNode.description, mindNode.imageUrl);
        });
        header.appendChild(toggleButton);
    }
    nodeDiv.appendChild(header);
    // Removed the code for the inline description container:
    // if (mindNode.description) {
    // 	   ...existing inline description container code...
    // }
    // Add Image rendering if an imageUrl exists on the mindNode
    if (options.mindNode.imageUrl) {
        const imgContainer = (0, styles_1.createBaseElement)('div', {
            marginTop: styles_1.CSS_VARS.spacing.md,
            maxWidth: "120px",
            borderRadius: styles_1.CSS_VARS.radius.lg,
            overflow: "hidden",
            boxShadow: styles_1.CSS_VARS.shadow.md,
            position: 'relative',
            transition: `all ${styles_1.CSS_VARS.transition.normal}`
        });
        const img = document.createElement("img");
        img.src = options.mindNode.imageUrl;
        Object.assign(img.style, {
            width: "100%",
            height: "auto",
            display: "block",
            transition: `all ${styles_1.CSS_VARS.transition.normal}`
        });
        img.onerror = () => { imgContainer.style.display = "none"; };
        // Add image hover effect
        imgContainer.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.05)';
        });
        imgContainer.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
        });
        imgContainer.appendChild(img);
        nodeDiv.appendChild(imgContainer);
    }
    // Hover effects
    nodeDiv.addEventListener("mouseover", () => {
        nodeDiv.style.transform = "translateY(-3px) scale(1.02)";
        nodeDiv.style.boxShadow = styles_1.CSS_VARS.shadow.lg;
    });
    nodeDiv.addEventListener("mouseout", () => {
        nodeDiv.style.transform = "translateY(0) scale(1)";
        nodeDiv.style.boxShadow = styles_1.CSS_VARS.shadow.md;
    });
    // Click event for selection
    nodeDiv.addEventListener("click", (e) => {
        onClick(e, nodeDiv);
    });
    return nodeDiv;
}
// Modified modal function to accept and display title and image
function openDescriptionModal(title, description, imageUrl) {
    const modalOverlay = document.createElement('div');
    Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: styles_1.CSS_VARS['overlay-bg'],
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '10000',
        opacity: '0',
        transition: 'opacity 0.3s ease-out'
    });
    // Animation trigger
    setTimeout(() => modalOverlay.style.opacity = '1', 10);
    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
        background: styles_1.CSS_VARS['modal-bg'],
        color: styles_1.CSS_VARS['modal-text'],
        padding: '24px',
        borderRadius: styles_1.CSS_VARS['modal-radius'],
        maxWidth: '500px',
        width: '90%',
        boxShadow: styles_1.CSS_VARS.shadow.xl,
        transform: 'scale(0.95)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        opacity: '0',
        border: `1px solid ${styles_1.CSS_VARS['modal-border']}`
    });
    // Content animation
    setTimeout(() => {
        modalContent.style.transform = 'scale(1)';
        modalContent.style.opacity = '1';
    }, 50);
    // Header section
    const header = document.createElement('div');
    Object.assign(header.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    });
    const titleEl = document.createElement('h2');
    Object.assign(titleEl.style, {
        margin: '0',
        fontSize: '24px',
        fontWeight: '700',
        color: styles_1.CSS_VARS.text,
        lineHeight: '1.3'
    });
    titleEl.textContent = title;
    // Close icon
    const closeIcon = document.createElement('div');
    closeIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
    </svg>`;
    closeIcon.style.cursor = 'pointer';
    closeIcon.style.opacity = '0.7';
    closeIcon.addEventListener('click', () => modalOverlay.remove());
    closeIcon.addEventListener('mouseover', () => closeIcon.style.opacity = '1');
    closeIcon.addEventListener('mouseout', () => closeIcon.style.opacity = '0.7');
    header.appendChild(titleEl);
    header.appendChild(closeIcon);
    modalContent.appendChild(header);
    // Image container
    if (imageUrl) {
        const imageContainer = document.createElement('div');
        Object.assign(imageContainer.style, {
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '16px',
            position: 'relative',
            // Removed aspectRatio to avoid cropping the image
            backgroundColor: styles_1.CSS_VARS.backgroundSecondary
        });
        const imageEl = document.createElement('img');
        Object.assign(imageEl.style, {
            width: '60%',
            height: 'auto',
            objectFit: 'contain', // changed from 'cover' to 'contain'
            transition: 'transform 0.3s ease'
        });
        imageEl.src = imageUrl;
        // Hover effect
        imageEl.addEventListener('mouseover', () => imageEl.style.transform = 'scale(1.03)');
        imageEl.addEventListener('mouseout', () => imageEl.style.transform = 'scale(1)');
        imageContainer.appendChild(imageEl);
        modalContent.appendChild(imageContainer);
    } // Description text
    const textEl = document.createElement('div');
    Object.assign(textEl.style, {
        color: styles_1.CSS_VARS.textSecondary,
        fontSize: '16px',
        lineHeight: '1.6',
        marginBottom: '24px',
        maxHeight: '40vh',
        overflowY: 'auto',
        paddingRight: '8px'
    });
    // Render HTML content if it contains HTML tags, otherwise treat as plain text
    if (description.includes('<') && description.includes('>')) {
        textEl.innerHTML = description;
    }
    else {
        textEl.innerHTML = description.replace(/\n/g, '<br>');
    }
    modalContent.appendChild(textEl);
    // Close button
    const closeButton = document.createElement('button');
    Object.assign(closeButton.style, {
        padding: '12px 24px',
        borderRadius: styles_1.CSS_VARS.radius.md,
        border: 'none',
        background: `linear-gradient(135deg, ${styles_1.CSS_VARS.primary}, ${styles_1.CSS_VARS.primaryHover})`,
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        fontSize: '16px'
    });
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => modalOverlay.remove());
    closeButton.addEventListener('mouseover', () => {
        closeButton.style.transform = 'translateY(-1px)';
        closeButton.style.boxShadow = styles_1.CSS_VARS.shadow.md;
    });
    closeButton.addEventListener('mouseout', () => {
        closeButton.style.transform = 'none';
        closeButton.style.boxShadow = 'none';
    });
    modalContent.appendChild(closeButton);
    modalOverlay.appendChild(modalContent);
    // Instead of:
    // document.body.appendChild(modalOverlay);
    // Use fullscreen element or document.body
    const parent = document.fullscreenElement || document.body;
    parent.appendChild(modalOverlay);
    // Close modal on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
}
