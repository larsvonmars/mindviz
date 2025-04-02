import { MindNode } from "./mindmap";

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
	const nodeDiv = document.createElement("div");

	// Base styling
	Object.assign(nodeDiv.style, {
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
		textAlign: "center"
	});

	// Header containing label and (optional) toggle button
	const header = document.createElement("div");
	Object.assign(header.style, {
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
		toggleButton.innerHTML = descriptionExpanded ? 
			`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M6 9l6 6 6-6"/>
			</svg>` :
			`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M9 6l6 6-6 6"/>
			</svg>`;
		toggleButton.style.cursor = 'pointer';
		toggleButton.addEventListener('click', (e) => {
			e.stopPropagation();
			onToggleDescription();
		});
		header.appendChild(toggleButton);
	}
	nodeDiv.appendChild(header);

	// Description container
	if (mindNode.description) {
		const descContainer = document.createElement("div");
		Object.assign(descContainer.style, {
			maxHeight: descriptionExpanded ? '1000px' : '0',
			overflow: 'hidden',
			transition: 'max-height 0.3s ease, opacity 0.2s ease',
			opacity: descriptionExpanded ? '1' : '0',
			marginTop: '8px'
		});
		const descContent = document.createElement("div");
		descContent.textContent = mindNode.description;
		Object.assign(descContent.style, {
			fontSize: "12px",
			color: "var(--mm-description-text, #636e72)",
			lineHeight: "1.4",
			padding: "8px",
			background: "var(--mm-description-bg, #f8f9fa)",
			borderRadius: "6px",
			whiteSpace: "pre-wrap",
			overflowWrap: "break-word",
			maxWidth: "200px"
		});
		descContainer.appendChild(descContent);
		nodeDiv.appendChild(descContainer);
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