"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolbar = createToolbar;
function createToolbar(vmm) {
    // Define SVG icons
    const reCenterIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`;
    const exportSvgIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>`;
    const clearAllIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2v2"/>
  </svg>`;
    const zoomOutIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35M8 11h6"/>
  </svg>`;
    const zoomInIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
  </svg>`;
    const draggingModeIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>`;
    const importJsonIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16v16H4z"/>
      <path d="M8 12h8M12 8v8"/>
  </svg>`;
    const undoIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="11 17 6 12 11 7"/>
    <path d="M20 20v-2a4 4 0 0 0-4-4H4"/>
  </svg>`;
    const redoIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="13 17 18 12 13 7"/>
    <path d="M4 4v2a4 4 0 0 1 4 4h12"/>
  </svg>`;
    // Common button style and helper
    const buttonStyle = {
        padding: "6px",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "6px",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        transition: "all 0.2s ease",
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    };
    const createButton = (html, onClick) => {
        const button = document.createElement("button");
        button.innerHTML = html;
        Object.assign(button.style, buttonStyle);
        button.addEventListener("click", onClick);
        button.addEventListener("mouseover", () => {
            button.style.boxShadow = "0 3px 6px rgba(0,0,0,0.15)";
            button.style.transform = "translateY(-1px)";
        });
        button.addEventListener("mouseout", () => {
            button.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            button.style.transform = "translateY(0)";
        });
        return button;
    };
    // Create toolbar container
    const toolbar = document.createElement("div");
    Object.assign(toolbar.style, {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        height: "50px",
        background: "var(--mm-toolbar-bg, #fff)",
        borderBottom: "1px solid var(--mm-border-color-light, #f0f0f0)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "16px",
        zIndex: "1100",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    });
    // Re-center button
    const recenterBtn = createButton(reCenterIcon, () => {
        vmm.setZoom(1);
        const container = vmm['container'];
        const containerCenterX = container.clientWidth / 2;
        const containerCenterY = container.clientHeight / 2;
        vmm['offsetX'] = containerCenterX - vmm['virtualCenter'].x * vmm['zoomLevel'];
        vmm['offsetY'] = containerCenterY - vmm['virtualCenter'].y * vmm['zoomLevel'];
        vmm['updateCanvasTransform']();
    });
    recenterBtn.setAttribute("aria-label", "Re-center map");
    toolbar.appendChild(recenterBtn);
    // Export as SVG button
    const exportBtn = createButton(exportSvgIcon, () => vmm.exportAsSVG());
    exportBtn.setAttribute("aria-label", "Export as SVG");
    toolbar.appendChild(exportBtn);
    // Clear all nodes button
    const clearBtn = createButton(clearAllIcon, () => {
        vmm['mindMap'].root.children = [];
        vmm.render();
    });
    clearBtn.setAttribute("aria-label", "Clear all nodes");
    toolbar.appendChild(clearBtn);
    // Layout select
    const layoutSelect = document.createElement("select");
    Object.assign(layoutSelect.style, {
        padding: "8px",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "14px",
        color: "#333"
    });
    layoutSelect.innerHTML = `
    <option value="radial">Radial</option>
    <option value="tree">Tree</option>
  `;
    layoutSelect.addEventListener("change", () => {
        vmm['currentLayout'] = layoutSelect.value;
        vmm.render();
    });
    toolbar.appendChild(layoutSelect);
    // Zoom controls and display
    const zoomContainer = document.createElement("div");
    Object.assign(zoomContainer.style, {
        display: "flex",
        gap: "8px",
        marginLeft: "auto",
        alignItems: "center"
    });
    const zoomOutBtn = createButton(zoomOutIcon, () => vmm.setZoom(vmm['zoomLevel'] / 1.2));
    zoomOutBtn.setAttribute("aria-label", "Zoom out");
    const zoomInBtn = createButton(zoomInIcon, () => vmm.setZoom(vmm['zoomLevel'] * 1.2));
    zoomInBtn.setAttribute("aria-label", "Zoom in");
    zoomContainer.append(zoomOutBtn, zoomInBtn);
    const zoomLevelDisplay = document.createElement("span");
    zoomLevelDisplay.textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
    Object.assign(zoomLevelDisplay.style, {
        fontSize: "14px",
        color: "#666",
        minWidth: "50px",
        textAlign: "center"
    });
    // store display for later update
    vmm['zoomLevelDisplay'] = zoomLevelDisplay;
    zoomContainer.appendChild(zoomLevelDisplay);
    toolbar.appendChild(zoomContainer);
    // Dragging mode toggle button
    const dragModeBtn = createButton(draggingModeIcon, () => {
        vmm['draggingMode'] = !vmm['draggingMode'];
        const svg = dragModeBtn.querySelector("svg");
        if (svg) {
            svg.style.stroke = vmm['draggingMode'] ? "#4dabf7" : "currentColor";
        }
        dragModeBtn.setAttribute("aria-label", vmm['draggingMode'] ? "Disable dragging mode" : "Enable dragging mode");
        vmm['container'].setAttribute('dragging-mode', String(vmm['draggingMode']));
    });
    toolbar.appendChild(dragModeBtn);
    // Import JSON button
    const importBtn = createButton(importJsonIcon, async () => {
        const jsonData = await vmm['showImportModal']();
        if (jsonData) {
            try {
                vmm.fromJSON(jsonData);
            }
            catch (error) {
                alert("Invalid JSON data!");
            }
        }
    });
    importBtn.setAttribute("aria-label", "Import JSON");
    toolbar.appendChild(importBtn);
    // Undo button
    const undoBtn = createButton(undoIcon, () => vmm.undo());
    undoBtn.setAttribute("aria-label", "Undo (Ctrl+Z)");
    toolbar.appendChild(undoBtn);
    // Redo button
    const redoBtn = createButton(redoIcon, () => vmm.redo());
    redoBtn.setAttribute("aria-label", "Redo (Ctrl+Shift+Z)");
    toolbar.appendChild(redoBtn);
    return toolbar;
}
