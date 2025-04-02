import { VisualMindMap } from "./visualMindmap";
import { showConnectionModal } from "./CustomConnectionModal";

export function createToolbar(vmm: VisualMindMap): HTMLElement {
  // Enhanced SVG icons with refined attributes (except for draggingMode, undo, redo)

  const reCenterIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  `;

  const exportSvgIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      <polyline points="8,12 12,8 16,12"></polyline>
      <line x1="12" y1="16" x2="12" y2="8"></line>
    </svg>
  `;

  const clearAllIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      <line x1="3" y1="3" x2="21" y2="21"></line>
    </svg>
  `;

  const zoomOutIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="8" y1="11" x2="14" y2="11"></line>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;

  const zoomInIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;

  // Use the original dragging mode icon
  const draggingModeIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>
  `;

  const importJsonIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      <polyline points="8,12 12,16 16,12"></polyline>
      <line x1="12" y1="8" x2="12" y2="16"></line>
    </svg>
  `;

  // Simple undo arrow icon
  const undoIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 4 7 12 15 20"></polyline>
    </svg>
  `;

  // Simple redo arrow icon
  const redoIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9 4 17 12 9 20"></polyline>
    </svg>
  `;

  // Add custom connection icon
  const addConnectionIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 5L10 19"></path>
      <path d="M5 12L19 12"></path>
    </svg>
  `;

  // Updated common button style with improved aesthetics
  const buttonStyle = {
    padding: "8px",
    background: "var(--button-bg, #ffffff)",
    border: "1px solid var(--border-color, #e0e0e0)",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const createButton = (html: string, onClick: () => void): HTMLElement => {
    const button = document.createElement("button");
    button.innerHTML = html;
    Object.assign(button.style, buttonStyle);
    button.style.outline = "none";
    button.style.backgroundClip = "padding-box";
    button.addEventListener("click", onClick);
    button.addEventListener("mouseover", () => {
      button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
      button.style.transform = "translateY(-2px)";
    });
    button.addEventListener("mouseout", () => {
      button.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
      button.style.transform = "translateY(0)";
    });
    return button;
  };

  // Enhanced toolbar container styling
  const toolbar = document.createElement("div");
  Object.assign(toolbar.style, {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "60px",
    background: "var(--toolbar-bg, #f8f9fa)",
    borderBottom: "1px solid var(--border-color, #e0e0e0)",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: "20px",
    zIndex: "1100",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)"
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

  // Layout select dropdown
  const layoutSelect = document.createElement("select");
  Object.assign(layoutSelect.style, {
    padding: "8px",
    background: "var(--input-bg, #fff)",
    border: "1px solid var(--border-color, #e0e0e0)",
    borderRadius: "4px",
    fontSize: "14px",
    color: "#333"
  });
  layoutSelect.innerHTML = `
    <option value="radial">Radial Layout</option>
    <option value="tree">Tree Layout</option>
  `;
  layoutSelect.addEventListener("change", () => {
    vmm['currentLayout'] = layoutSelect.value as 'radial' | 'tree';
    vmm.render();
  });
  toolbar.appendChild(layoutSelect);

  // Zoom controls container
  const zoomContainer = document.createElement("div");
  Object.assign(zoomContainer.style, {
    display: "flex",
    gap: "10px",
    marginLeft: "auto",
    alignItems: "center"
  });
  const zoomOutBtn = createButton(zoomOutIcon, () => {
    vmm.setZoom(vmm['zoomLevel'] / 1.2);
    // Manually update the zoom level display
    vmm['zoomLevelDisplay'].textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
  });
  zoomOutBtn.setAttribute("aria-label", "Zoom out");

  const zoomInBtn = createButton(zoomInIcon, () => {
    vmm.setZoom(vmm['zoomLevel'] * 1.2);
    // Manually update the zoom level display
    vmm['zoomLevelDisplay'].textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
  });
  zoomInBtn.setAttribute("aria-label", "Zoom in");

  zoomContainer.append(zoomOutBtn, zoomInBtn);

  const zoomLevelDisplay = document.createElement("span");
  zoomLevelDisplay.textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
  Object.assign(zoomLevelDisplay.style, {
    fontSize: "14px",
    color: "#555",
    minWidth: "50px",
    textAlign: "center"
  });
  // Store display for later updates
  vmm['zoomLevelDisplay'] = zoomLevelDisplay;
  zoomContainer.appendChild(zoomLevelDisplay);
  toolbar.appendChild(zoomContainer);

  // Dragging mode toggle button using the original icon
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
      } catch (error) {
        alert("Invalid JSON data!");
      }
    }
  });
  importBtn.setAttribute("aria-label", "Import JSON");
  toolbar.appendChild(importBtn);

  // Undo button with simple left arrow
  const undoBtn = createButton(undoIcon, () => vmm.undo());
  undoBtn.setAttribute("aria-label", "Undo (Ctrl+Z)");
  toolbar.appendChild(undoBtn);

  // Redo button with simple right arrow
  const redoBtn = createButton(redoIcon, () => vmm.redo());
  redoBtn.setAttribute("aria-label", "Redo (Ctrl+Shift+Z)");
  toolbar.appendChild(redoBtn);

  // Add custom connection button to toolbar
  const addConnectionBtn = createButton(addConnectionIcon, async () => {
    const connectionData = await showConnectionModal(vmm['container']);
    if (connectionData) {
      try {
        vmm.addCustomConnection(
          connectionData.sourceId,
          connectionData.targetId,
          {
            color: connectionData.color,
            width: connectionData.width,
            dasharray: connectionData.dasharray
          },
          connectionData.label
        );
      } catch (error) {
        alert(error);
      }
    }
  });
  addConnectionBtn.setAttribute("aria-label", "Add Custom Connection");
  toolbar.appendChild(addConnectionBtn);

  return toolbar;
}
