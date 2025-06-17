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
// Add fullscreen icon
const focusIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="4 4 10 4 10 10"></polyline>
    <polyline points="20 20 14 20 14 14"></polyline>
    <polyline points="4 20 10 20 10 14"></polyline>
    <polyline points="20 4 14 4 14 10"></polyline>
  </svg>
`;
const gridIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="3" y1="15" x2="21" y2="15"></line>
  </svg>
`;
const snapIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <circle cx="12" cy="3" r="1"></circle>
    <circle cx="12" cy="21" r="1"></circle>
    <circle cx="21" cy="12" r="1"></circle>
    <circle cx="3" cy="12" r="1"></circle>
    <circle cx="18.36" cy="5.64" r="1"></circle>
    <circle cx="5.64" cy="18.36" r="1"></circle>
    <circle cx="18.36" cy="18.36" r="1"></circle>
    <circle cx="5.64" cy="5.64" r="1"></circle>
  </svg>
`;

const menuIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
`;

const chevronLeftIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15,18 9,12 15,6"></polyline>
  </svg>
`;

const chevronRightIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
`;

const treeLayoutIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="6" y1="3" x2="6" y2="15"></line>
    <circle cx="18" cy="6" r="3"></circle>
    <circle cx="6" cy="18" r="3"></circle>
    <path d="M18 9a9 9 0 0 1-9 9"></path>
  </svg>
`;

const radialLayoutIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="14.31" y1="8" x2="20.05" y2="17.94"></line>
    <line x1="9.69" y1="8" x2="21.17" y2="8"></line>
    <line x1="7.38" y1="12" x2="13.12" y2="2.06"></line>
    <line x1="9.69" y1="16" x2="3.95" y2="6.06"></line>
    <line x1="14.31" y1="16" x2="2.83" y2="16"></line>
    <line x1="16.62" y1="12" x2="10.88" y2="21.94"></line>
  </svg>
`;

export function createToolbar(vmm: VisualMindMap): HTMLElement {
  let isToolbarExpanded = true;

  // --- Create individual buttons with event listeners
  const recenterBtn = createButton('secondary');
  recenterBtn.innerHTML = reCenterIcon;
  recenterBtn.addEventListener("click", () => {
    vmm.setZoom(1);
    const container = vmm['container'];
    const containerCenterX = container.clientWidth / 2;
    const containerCenterY = container.clientHeight / 2;
    vmm['offsetX'] = containerCenterX - vmm['virtualCenter'].x * vmm['zoomLevel'];
    vmm['offsetY'] = containerCenterY - vmm['virtualCenter'].y * vmm['zoomLevel'];
    vmm['updateCanvasTransform']();
  });
  recenterBtn.setAttribute("aria-label", "Re-center map");

  const layoutBtn = createButton('secondary');
  layoutBtn.innerHTML = vmm['currentLayout'] === 'radial' ? treeLayoutIcon : radialLayoutIcon;
  layoutBtn.setAttribute("aria-label", "Toggle layout");
  layoutBtn.addEventListener("click", () => {
    const newLayout = vmm['currentLayout'] === 'radial' ? 'tree' : 'radial';
    vmm['currentLayout'] = newLayout;
    layoutBtn.innerHTML = newLayout === 'radial' ? treeLayoutIcon : radialLayoutIcon;
    vmm.render();
  });

  const zoomContainer = document.createElement("div");
  zoomContainer.classList.add('zoom-container');
  Object.assign(zoomContainer.style, {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.8)",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid var(--border-color, #e0e0e0)"
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

  const zoomLevelDisplay = document.createElement("span");
  zoomLevelDisplay.textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
  Object.assign(zoomLevelDisplay.style, {
    fontSize: "12px",
    color: "#555",
    minWidth: "45px",
    textAlign: "center",
    fontWeight: "500"
  });
  vmm['zoomLevelDisplay'] = zoomLevelDisplay;
  zoomContainer.append(zoomInBtn, zoomLevelDisplay, zoomOutBtn);

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
    updateButtonActiveState(dragModeBtn, vmm['draggingMode']);
  });

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
    updateButtonActiveState(addConnectionBtn, vmm['connectionModeActive']);
  });
  addConnectionBtn.setAttribute("aria-label", "Add Custom Connection");

  // Create a new File button that opens a modal when clicked
  const fileBtn = createButton('secondary');
  fileBtn.innerHTML = menuIcon;
  fileBtn.setAttribute("aria-label", "File operations");
  fileBtn.addEventListener("click", () => {
    openFileModal();
  });

  // Create new focus button for fullscreen mode
  const focusBtn = createButton('secondary');
  focusBtn.innerHTML = focusIcon;
  focusBtn.addEventListener("click", () => {
    const elem = vmm['container'];
    const isFullscreen = document.fullscreenElement || 
                         (document as any).webkitFullscreenElement || 
                         (document as any).msFullscreenElement;
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  });
  focusBtn.setAttribute("aria-label", "Toggle fullscreen mode");

  // Grid toggle button
  const gridToggleBtn = createButton('secondary');
  gridToggleBtn.innerHTML = gridIcon;
  gridToggleBtn.addEventListener("click", () => {
    vmm.toggleGrid();
    const svg = gridToggleBtn.querySelector("svg");
    if (svg) {
      svg.style.stroke = vmm['gridVisible'] ? "#4dabf7" : "currentColor";
      svg.style.fill = vmm['gridVisible'] ? "#4dabf740" : "none";
    }
    updateButtonActiveState(gridToggleBtn, vmm['gridVisible']);
  });
  gridToggleBtn.setAttribute("aria-label", "Toggle grid visibility");

  // Grid snapping toggle button
  const snapToggleBtn = createButton('secondary');
  snapToggleBtn.innerHTML = snapIcon;
  snapToggleBtn.addEventListener("click", () => {
    vmm.toggleGridSnapping();
    const svg = snapToggleBtn.querySelector("svg");
    if (svg) {
      svg.style.stroke = vmm['gridEnabled'] ? "#4dabf7" : "currentColor";
      svg.style.fill = vmm['gridEnabled'] ? "#4dabf740" : "none";
    }
    updateButtonActiveState(snapToggleBtn, vmm['gridEnabled']);
  });
  snapToggleBtn.setAttribute("aria-label", "Toggle grid snapping");

  // Create toggle button for toolbar expansion/collapse
  const toggleBtn = createButton('secondary');
  toggleBtn.innerHTML = chevronLeftIcon;
  toggleBtn.setAttribute("aria-label", "Toggle toolbar");
  Object.assign(toggleBtn.style, {
    position: "absolute",
    top: "50%",
    right: "-15px",
    transform: "translateY(-50%)",
    width: "30px",
    height: "30px",
    padding: "3px",
    borderRadius: "50%",
    background: "var(--toolbar-bg, #f8f9fa)",
    border: "1px solid var(--border-color, #e0e0e0)",
    boxShadow: "2px 0 6px rgba(0, 0, 0, 0.1)",
    zIndex: "1101"
  });

  // Helper function to update button active states
  function updateButtonActiveState(button: HTMLButtonElement, isActive: boolean) {
    if (isActive) {
      button.style.background = "var(--mm-primary-light, #e3f2fd)";
      button.style.borderColor = "var(--mm-primary, #4dabf7)";
      button.style.color = "var(--mm-primary, #4dabf7)";
    } else {
      button.style.background = "transparent";
      button.style.borderColor = "var(--border-color, #e0e0e0)";
      button.style.color = "var(--mm-text, #495057)";
    }
  }

  // Set initial active states
  updateButtonActiveState(gridToggleBtn, vmm['gridVisible']);
  updateButtonActiveState(snapToggleBtn, vmm['gridEnabled']);

  // Toolbar content container
  const toolbarContent = document.createElement("div");
  toolbarContent.classList.add("toolbar-content");
  Object.assign(toolbarContent.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "16px 8px",
    width: "100%",
    height: "100%",
    transition: "opacity 0.3s ease"
  });

  toolbarContent.append(
    fileBtn,
    recenterBtn,
    zoomContainer,
    layoutBtn,
    dragModeBtn,
    addConnectionBtn,
    gridToggleBtn,
    snapToggleBtn,
    focusBtn
  );

  // Main toolbar container with improved styling
  const toolbar = createBaseElement<HTMLDivElement>('div', {
    position: "absolute",
    top: "0",
    left: "0",
    width: "68px",
    height: "100%",
    background: "linear-gradient(135deg, rgba(248, 249, 250, 0.95), rgba(255, 255, 255, 0.9))",
    backdropFilter: "blur(10px)",
    borderRight: "1px solid var(--border-color, #e0e0e0)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: "1100",
    boxShadow: "2px 0 20px rgba(0, 0, 0, 0.1)",
    overflowY: "auto",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  });

  toolbar.appendChild(toolbarContent);
  toolbar.appendChild(toggleBtn);

  // Toggle functionality
  toggleBtn.addEventListener("click", () => {
    isToolbarExpanded = !isToolbarExpanded;
    
    if (isToolbarExpanded) {
      toolbar.style.width = "68px";
      toolbar.style.transform = "translateX(0)";
      toolbarContent.style.opacity = "1";
      toggleBtn.innerHTML = chevronLeftIcon;
      toggleBtn.style.right = "-15px";
    } else {
      toolbar.style.width = "68px";
      toolbar.style.transform = "translateX(-54px)";
      toolbarContent.style.opacity = "0";
      toggleBtn.innerHTML = chevronRightIcon;
      toggleBtn.style.right = "-15px";
    }
  });

  // Define the file modal function (with improved styling)
  function openFileModal() {
    const modalOverlay = document.createElement("div");
    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10000",
      animation: "fadeIn 0.2s ease"
    });

    const modalContainer = document.createElement("div");
    Object.assign(modalContainer.style, {
      background: "linear-gradient(135deg, #ffffff, #f8f9fa)",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      minWidth: "280px",
      maxWidth: "320px",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      animation: "slideUp 0.3s ease"
    });

    const title = document.createElement("h3");
    title.textContent = "File Operations";
    Object.assign(title.style, {
      marginBottom: "16px",
      fontSize: "18px",
      fontWeight: "600",
      color: "#2d3748",
      textAlign: "center"
    });
    modalContainer.appendChild(title);

    const btnConfig = [
      { label: "Export as SVG", action: () => { vmm.exportAsSVG(); }, icon: "📄" },
      { label: "Copy JSON", action: () => {
          const jsonData = vmm.toJSON();
          navigator.clipboard.writeText(jsonData).then(() => {
            alert("Mindmap JSON copied to clipboard");
          }).catch(() => {
            alert("Failed to copy mindmap JSON");
          });
        }, icon: "📋"
      },
      { label: "Clear All", action: () => {
          vmm['mindMap'].root.children = [];
          vmm.render();
        }, icon: "🗑️"
      },
      { label: "Import JSON", action: async () => {
          const jsonData = await vmm.showImportModal();
          if (jsonData) {
            try { vmm.fromJSON(jsonData); } catch (error) { alert("Invalid JSON data!"); }
          }
        }, icon: "📥"
      },
      { label: "Undo", action: () => { vmm.undo(); }, icon: "↶" },
      { label: "Redo", action: () => { vmm.redo(); }, icon: "↷" }
    ];

    btnConfig.forEach((cfg, index) => {
      const btn = document.createElement("button");
      btn.innerHTML = `<span style="margin-right: 8px;">${cfg.icon}</span>${cfg.label}`;
      Object.assign(btn.style, {
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "12px 16px",
        marginBottom: "8px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        background: "white",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        color: "#4a5568",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      });

      btn.addEventListener("mouseenter", () => {
        btn.style.background = "#f7fafc";
        btn.style.borderColor = "#4dabf7";
        btn.style.transform = "translateY(-1px)";
        btn.style.boxShadow = "0 4px 12px rgba(77, 171, 247, 0.15)";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.background = "white";
        btn.style.borderColor = "#e2e8f0";
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
      });

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        cfg.action();
        document.body.removeChild(modalOverlay);
      });
      modalContainer.appendChild(btn);
    });

    // Add a close button with improved styling
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    Object.assign(closeBtn.style, {
      display: "block",
      width: "100%",
      padding: "12px",
      marginTop: "8px",
      border: "none",
      background: "linear-gradient(135deg, #4dabf7, #339af7)",
      color: "#fff",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 12px rgba(77, 171, 247, 0.3)"
    });

    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.transform = "translateY(-1px)";
      closeBtn.style.boxShadow = "0 6px 16px rgba(77, 171, 247, 0.4)";
    });

    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.transform = "translateY(0)";
      closeBtn.style.boxShadow = "0 4px 12px rgba(77, 171, 247, 0.3)";
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

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Improved button styling */
    .toolbar-content button {
      position: relative;
      overflow: hidden;
      min-width: 44px;
      min-height: 44px;
      border-radius: 8px !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    .toolbar-content button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }

    .toolbar-content button:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }

    /* Responsive design */
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

    /* Scrollbar styling for toolbar */
    .toolbar-content::-webkit-scrollbar {
      width: 4px;
    }
    .toolbar-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .toolbar-content::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }
    .toolbar-content::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  `;
  toolbar.appendChild(style);

  // Listen for custom events
  vmm['container'].addEventListener("connectionModeChanged", (e: Event) => {
    const svg = addConnectionBtn.querySelector("svg");
    if (svg) {
      svg.style.stroke = (e as CustomEvent).detail === false ? "currentColor" : "#4dabf7";
    }
    updateButtonActiveState(addConnectionBtn, (e as CustomEvent).detail !== false);
  });

  return toolbar;
}
