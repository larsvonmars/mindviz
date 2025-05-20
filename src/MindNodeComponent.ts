import { MindNode } from "./mindmap";
import { createBaseElement } from "./styles";

export interface MindNodeComponentOptions {
	mindNode: MindNode;
	x: number;
	y: number;
	descriptionExpanded: boolean;
	onToggleDescription: () => void;
	onClick: (e: MouseEvent, nodeElement: HTMLDivElement) => void;
}

export function createMindNodeElement(options: MindNodeComponentOptions): HTMLDivElement {
	const { mindNode, x, y, descriptionExpanded, onToggleDescription, onClick } = options;
	// Use utility to create the node container with base styles.
	const nodeDiv = createBaseElement<HTMLDivElement>('div', {
		position: "absolute",
		left: `${x}px`,
		top: `${y}px`,
		padding: "12px 20px",
		display: "inline-block",
		zIndex: "1",
		background: (mindNode as any).background || "var(--mm-node-bg, #ffffff)",
		border: "1px solid var(--mm-node-border-color, #e0e0e0)",
		borderRadius: "8px",
		boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
		fontSize: "14px",
		fontWeight: "600",
		color: "var(--mm-node-text, #2d3436)",
		cursor: "pointer",
		transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
		minWidth: "120px",
		textAlign: "center",
		touchAction: "none"
	});

	// Header containing label and (optional) toggle button
	// Create header using the utility.
	const header = createBaseElement<HTMLDivElement>('div', {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		justifyContent: 'center'
	});
	const label = document.createElement("span");
	label.textContent = mindNode.label;
	header.appendChild(label);

	if (mindNode.description) {
		const toggleButton = document.createElement("div");
		toggleButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M9 6l6 6-6 6"/>
			</svg>`;
		toggleButton.style.cursor = 'pointer';
		toggleButton.addEventListener('click', (e) => {
			e.stopPropagation();
			// Pass node title, description, and imageUrl (if any)
			openDescriptionModal(mindNode.label, mindNode.description, (mindNode as any).imageUrl);
		});
		header.appendChild(toggleButton);
	}
	nodeDiv.appendChild(header);

	// Removed the code for the inline description container:
	// if (mindNode.description) {
	// 	   ...existing inline description container code...
	// }

	// Add Image rendering if an imageUrl exists on the mindNode
	if ((options.mindNode as any).imageUrl) {
		const imgContainer = document.createElement("div");
		Object.assign(imgContainer.style, {
			marginTop: "8px",
			maxWidth: "100px", // reduced size from 200px
			borderRadius: "4px",
			overflow: "hidden"
		});
		
		const img = document.createElement("img");
		img.src = (options.mindNode as any).imageUrl;
		img.style.width = "100%";
		img.style.height = "auto";
		img.style.display = "block";
		img.onerror = () => { imgContainer.style.display = "none"; };
		
		imgContainer.appendChild(img);
		nodeDiv.appendChild(imgContainer);
	}

	// Hover effects
	nodeDiv.addEventListener("mouseover", () => {
		nodeDiv.style.transform = "translateY(-3px) scale(1.02)";
		nodeDiv.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.1)";
	});
	nodeDiv.addEventListener("mouseout", () => {
		nodeDiv.style.transform = "translateY(0) scale(1)";
		nodeDiv.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
	});

	// Click event for selection
	nodeDiv.addEventListener("click", (e) => {
		onClick(e, nodeDiv);
	});
	return nodeDiv;
}

// Modified modal function to accept and display title and image
function openDescriptionModal(title: string, description: string, imageUrl?: string): void {
    const modalOverlay = document.createElement('div');
    Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
        background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
        transform: 'scale(0.95)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        opacity: '0',
        border: '1px solid rgba(255, 255, 255, 0.2)'
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
        color: '#2d3436',
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
            backgroundColor: '#f8f9fa'
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
    }

    // Description text
    const textEl = document.createElement('div');
    Object.assign(textEl.style, {
        color: '#636e72',
        fontSize: '16px',
        lineHeight: '1.6',
        marginBottom: '24px',
        maxHeight: '40vh',
        overflowY: 'auto',
        paddingRight: '8px'
    });
    textEl.innerHTML = description.replace(/\n/g, '<br>');
    modalContent.appendChild(textEl);

    // Close button
    const closeButton = document.createElement('button');
    Object.assign(closeButton.style, {
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #6c5ce7, #4b4bff)',
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
        closeButton.style.boxShadow = '0 4px 12px rgba(108, 92, 231, 0.4)';
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