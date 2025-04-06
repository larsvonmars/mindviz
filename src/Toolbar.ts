import { VisualMindMap } from "./visualMindmap";
import { createBaseElement, createButton, CSS_VARS } from "./styles";

// --- Define SVG icons (unchanged)
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
const exportJsonIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">{}</text>
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
    <line x1="12" y="8" x2="12" y2="16"></line>
  </svg>
`;
const undoIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="15 4 7 12 15 20"></polyline>
  </svg>
`;
const redoIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="9 4 17 12 9 20"></polyline>
  </svg>
`;
const addConnectionIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10 5L10 19"></path>
    <path d="M5 12L19 12"></path>
  </svg>
`;

export function createToolbar(vmm: VisualMindMap): HTMLElement {
  // --- Create individual buttons with event listeners (desktop/mobile will reuse these)
  const recenterBtn = createButton('secondary');
  recenterBtn.innerHTML = reCenterIcon;
  recenterBtn.addEventListener("click", () => {
    // ...existing re-center logic...
    vmm.setZoom(1);
    const container = vmm['container'];
    const containerCenterX = container.clientWidth / 2;
    const containerCenterY = container.clientHeight / 2;
    vmm['offsetX'] = containerCenterX - vmm['virtualCenter'].x * vmm['zoomLevel'];
    vmm['offsetY'] = containerCenterY - vmm['virtualCenter'].y * vmm['zoomLevel'];
    vmm['updateCanvasTransform']();
  });
  recenterBtn.setAttribute("aria-label", "Re-center map");

  const exportBtn = createButton('secondary');
  exportBtn.innerHTML = exportSvgIcon;
  exportBtn.addEventListener("click", () => vmm.exportAsSVG());
  exportBtn.setAttribute("aria-label", "Export as SVG");

  const exportJsonBtn = createButton('secondary');
  exportJsonBtn.innerHTML = exportJsonIcon;
  exportJsonBtn.addEventListener("click", () => {
    const jsonData = vmm.toJSON();
    navigator.clipboard.writeText(jsonData).then(() => {
      alert("Mindmap JSON copied to clipboard");
    }).catch(() => {
      alert("Failed to copy mindmap JSON");
    });
  });
  exportJsonBtn.setAttribute("aria-label", "Copy JSON");

  const clearBtn = createButton('secondary');
  clearBtn.innerHTML = clearAllIcon;
  clearBtn.addEventListener("click", () => {
    vmm['mindMap'].root.children = [];
    vmm.render();
  });
  clearBtn.setAttribute("aria-label", "Clear all nodes");

  const layoutSelect = document.createElement("select");
  layoutSelect.classList.add('toolbar-select');
  Object.assign(layoutSelect.style, {
    padding: "8px",
    background: "var(--input-bg, #fff)",
    border: "1px solid var(--border-color, #e0e0e0)",
    borderRadius: "var(--border-radius, 4px)", // changed for consistent styling
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

  const zoomContainer = document.createElement("div");
  zoomContainer.classList.add('zoom-container');
  Object.assign(zoomContainer.style, {
    display: "flex",
    gap: "8px", // changed from "10px"
    alignItems: "center"
  });
  const zoomOutBtn = createButton('secondary');
  zoomOutBtn.innerHTML = zoomOutIcon;
  zoomOutBtn.addEventListener("click", () => {
    vmm.setZoom(vmm['zoomLevel'] / 1.2);
    vmm['zoomLevelDisplay'].textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
  });
  zoomOutBtn.setAttribute("aria-label", "Zoom out");

  const zoomInBtn = createButton('secondary');
  zoomInBtn.innerHTML = zoomInIcon;
  zoomInBtn.addEventListener("click", () => {
    vmm.setZoom(vmm['zoomLevel'] * 1.2);
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
  vmm['zoomLevelDisplay'] = zoomLevelDisplay;
  zoomContainer.appendChild(zoomLevelDisplay);

  const dragModeBtn = createButton('secondary');
  dragModeBtn.innerHTML = draggingModeIcon;
  dragModeBtn.addEventListener("click", () => {
    vmm['draggingMode'] = !vmm['draggingMode'];
    const svg = dragModeBtn.querySelector("svg");
    if (svg) {
      svg.style.stroke = vmm['draggingMode'] ? "#4dabf7" : "currentColor";
    }
    dragModeBtn.setAttribute("aria-label", vmm['draggingMode'] ? "Disable dragging mode" : "Enable dragging mode");
    vmm['container'].setAttribute('dragging-mode', String(vmm['draggingMode']));
  });

  // Updated theme toggle button creation:
  /* const themeToggleBtn = createButton('secondary');
  themeToggleBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path class="sun" d="M12 3V5M5 12H3M12 19v2M19 12h2M6.3 6.3l1.4 1.4M17.7 6.3l-1.4 1.4M6.3 17.7l1.4-1.4M17.7 17.7l-1.4-1.4"/>
      <circle class="moon" cx="12" cy="12" r="4" style="display: none;"/>
    </svg>
  `;
  themeToggleBtn.setAttribute("aria-label", "Toggle Theme");
  themeToggleBtn.style.padding = "6px"; // Tighter padding for icon button
  themeToggleBtn.style.transition = "all 0.3s ease";

  // Add hover effects
  themeToggleBtn.addEventListener("mouseenter", () => {
    themeToggleBtn.style.background = "var(--mm-primary-light)";
  });
  themeToggleBtn.addEventListener("mouseleave", () => {
    if (vmm['theme'] !== 'dark') {
      themeToggleBtn.style.background = "var(--button-bg)";
    }
  });
 */
  // Update theme toggle handler
  // Update theme toggle handler
  /* themeToggleBtn.addEventListener("click", () => {
    vmm.toggleTheme();
    const sun = themeToggleBtn.querySelector('.sun');
    const moon = themeToggleBtn.querySelector('.moon');
    if (vmm['theme'] === 'dark') {
      if (sun instanceof HTMLElement) sun.style.display = 'none';
      if (moon instanceof HTMLElement) moon.style.display = 'block';
      themeToggleBtn.style.background = "var(--mm-primary-dark)";
      themeToggleBtn.style.borderColor = "var(--mm-border-dark)";
    } else {
      if (sun instanceof HTMLElement) sun.style.display = 'block';
      if (moon instanceof HTMLElement) moon.style.display = 'none';
      themeToggleBtn.style.background = "var(--button-bg)";
      themeToggleBtn.style.borderColor = "var(--border-color)";
    }
  }); */


  const importBtn = createButton('secondary');
  importBtn.innerHTML = importJsonIcon;
  importBtn.addEventListener("click", async () => {
    const jsonData = await vmm.showImportModal();
    if (jsonData) {
      try {
        vmm.fromJSON(jsonData);
      } catch (error) {
        alert("Invalid JSON data!");
      }
    }
  });
  importBtn.setAttribute("aria-label", "Import JSON");

  const undoBtn = createButton('secondary');
  undoBtn.innerHTML = undoIcon;
  undoBtn.addEventListener("click", () => vmm.undo());
  undoBtn.setAttribute("aria-label", "Undo (Ctrl+Z)");

  const redoBtn = createButton('secondary');
  redoBtn.innerHTML = redoIcon;
  redoBtn.addEventListener("click", () => vmm.redo());
  redoBtn.setAttribute("aria-label", "Redo (Ctrl+Shift+Z)");

  const addConnectionBtn = createButton('secondary');
  addConnectionBtn.innerHTML = addConnectionIcon;
  addConnectionBtn.addEventListener("click", () => {
    if (vmm['connectionModeActive']) {
      vmm.deactivateConnectionMode();
    } else {
      vmm.activateConnectionMode();
    }
    const svg = addConnectionBtn.querySelector("svg");
    if (svg) {
      svg.style.stroke = vmm['connectionModeActive'] ? "#4dabf7" : "currentColor";
      svg.style.fill = vmm['connectionModeActive'] ? "#4dabf740" : "none";
    }
    addConnectionBtn.style.background = vmm['connectionModeActive']
      ? "var(--mm-primary-light)"
      : "var(--button-bg)";
  });
  addConnectionBtn.setAttribute("aria-label", "Add Custom Connection");

  // --- Remove previous File dropdown elements
  
  // Create a new File button that opens a modal when clicked
  const fileBtn = createButton('secondary');
  fileBtn.textContent = "File";
  fileBtn.setAttribute("aria-label", "File operations");
  fileBtn.addEventListener("click", () => {
    openFileModal();
  });
  
  // Define the file modal function (styled similar to the JSON import modal)
  function openFileModal() {
    const modalOverlay = document.createElement("div");
    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10000"
    });
    const modalContainer = document.createElement("div");
    Object.assign(modalContainer.style, {
      background: "#fff",
      padding: "20px",
      borderRadius: "var(--modal-border-radius, 8px)", // changed for consistent styling
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      minWidth: "250px"
    });
    const title = document.createElement("h3");
    title.textContent = "File Options";
    title.style.marginBottom = "16px";
    modalContainer.appendChild(title);
    
    const btnConfig = [
      { label: "Export as SVG", action: () => { vmm.exportAsSVG(); } },
      { label: "Copy JSON", action: () => {
          const jsonData = vmm.toJSON();
          navigator.clipboard.writeText(jsonData).then(() => {
            alert("Mindmap JSON copied to clipboard");
          }).catch(() => {
            alert("Failed to copy mindmap JSON");
          });
        }
      },
      { label: "Clear All", action: () => {
          vmm['mindMap'].root.children = [];
          vmm.render();
        }
      },
      { label: "Import JSON", action: async () => {
          const jsonData = await vmm.showImportModal();
          if (jsonData) {
            try { vmm.fromJSON(jsonData); } catch (error) { alert("Invalid JSON data!"); }
          }
        }
      },
      { label: "Undo", action: () => { vmm.undo(); } },
      { label: "Redo", action: () => { vmm.redo(); } }
    ];
    
    btnConfig.forEach(cfg => {
      const btn = document.createElement("button");
      btn.textContent = cfg.label;
      Object.assign(btn.style, {
        display: "block",
        width: "100%",
        padding: "8px",
        marginBottom: "8px",
        border: "1px solid #e9ecef",
        borderRadius: "4px",
        background: "#f8f9fa",
        cursor: "pointer"
      });
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        cfg.action();
        document.body.removeChild(modalOverlay);
      });
      modalContainer.appendChild(btn);
    });
    
    // Add a close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    Object.assign(closeBtn.style, {
      display: "block",
      width: "100%",
      padding: "8px",
      border: "none",
      background: "#4dabf7",
      color: "#fff",
      borderRadius: "4px",
      cursor: "pointer"
    });
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modalOverlay);
    });
    modalContainer.appendChild(closeBtn);
    
    modalOverlay.appendChild(modalContainer);
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
      }
    });
    document.body.appendChild(modalOverlay);
  }
  
  // --- Desktop toolbar container (adjusted)
  const desktopContainer = document.createElement("div");
  desktopContainer.classList.add("desktop-toolbar");
  Object.assign(desktopContainer.style, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingLeft: "16px", // update spacing as needed
    width: "100%",
    height: "100%"
  });
  desktopContainer.append(
    // Place the new File button first
    fileBtn,
    // ...existing buttons like recenterBtn, layoutSelect, dragModeBtn, addConnectionBtn, zoomContainer...
    recenterBtn,
    layoutSelect,
    dragModeBtn,
    // themeToggleBtn, // new theme toggle button
    addConnectionBtn,
    zoomContainer
  );
  
  // --- Remove mobile File dropdown and use a similar approach if desired
  
  // --- Main toolbar container remains mostly unchanged
  const toolbar = createBaseElement<HTMLDivElement>('div', {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "60px",
    background: "var(--toolbar-bg, #f8f9fa)",
    borderBottom: "1px solid var(--border-color, #e0e0e0)",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: "8px",
    zIndex: "1100",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
    overflowX: "auto",
    whiteSpace: "nowrap"
  });
  toolbar.append(desktopContainer);
  
  // --- Append responsive CSS styles
  const style = document.createElement('style');
  style.textContent = `
    /* Hide mobile toolbar on desktop and vice versa */
    @media (max-width: 768px) {
      .desktop-toolbar { display: none; }
      .mobile-toolbar { display: flex; width: 100%; position: relative; }
    }
    @media (min-width: 769px) {
      .desktop-toolbar { display: flex; width: 100%; }
      .mobile-toolbar { display: none; }
    }
    .mobile-toolbar button, .mobile-toolbar select {
      width: 100%;
      text-align: left;
    }
  `;
  toolbar.appendChild(style);

  // --- (Optional) Listen for custom events as before
  vmm['container'].addEventListener("connectionModeChanged", (e: Event) => {
    const svg = addConnectionBtn.querySelector("svg");
    if (svg) {
      svg.style.stroke = (e as CustomEvent).detail === false ? "currentColor" : "#4dabf7";
    }
  });

  return toolbar;
}
