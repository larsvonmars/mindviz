"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMindNodeElement = createMindNodeElement;
const styles_1 = require("./styles");
function createMindNodeElement(options) {
    const { mindNode, x, y, descriptionExpanded, onToggleDescription, onClick } = options;
    // Use utility to create the node container with base styles.
    const nodeDiv = (0, styles_1.createBaseElement)('div', {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        padding: "12px 20px",
        display: "inline-block",
        zIndex: "1",
        background: mindNode.background || "var(--mm-node-bg, #ffffff)",
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
    // Create header using the utility.
    const header = (0, styles_1.createBaseElement)('div', {
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
        // Using a right arrow icon (could be adjusted as desired)
        toggleButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M9 6l6 6-6 6"/>
			</svg>`;
        toggleButton.style.cursor = 'pointer';
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openDescriptionModal(mindNode.description);
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
        const imgContainer = document.createElement("div");
        Object.assign(imgContainer.style, {
            marginTop: "8px",
            maxWidth: "200px",
            borderRadius: "4px",
            overflow: "hidden"
        });
        const img = document.createElement("img");
        img.src = options.mindNode.imageUrl;
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
// New helper function to open a modal displaying the full node description
function openDescriptionModal(description) {
    const modalOverlay = document.createElement('div');
    Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '10000'
    });
    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '80%',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    });
    const textEl = document.createElement('div');
    textEl.textContent = description;
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '12px';
    closeButton.addEventListener('click', () => {
        modalOverlay.remove();
    });
    modalContent.appendChild(textEl);
    modalContent.appendChild(closeButton);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}
