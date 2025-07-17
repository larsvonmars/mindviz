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
    <line x1="12" y1="8" x2="12" y2="16"></line>
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

// NEW: Theme toggle icons
type IconString = string;
const lightModeIcon: IconString = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
`;
const darkModeIcon: IconString = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
  </svg>
`;

// Helper to create a toolbar button with consistent styling
const createToolButton = (
  icon: string,
  label: string,
  handler: () => void,
  options?: { disableHoverEffect?: boolean }
): HTMLButtonElement => {
  const btn = createButton('secondary', options);

  btn.innerHTML = icon;
  btn.setAttribute('aria-label', label);
  btn.addEventListener('click', handler);
  return btn;
};

export function createToolbar(vmm: VisualMindMap): HTMLElement {
  let isToolbarExpanded = true;

  // --- Create individual buttons with event listeners
  const recenterBtn = createToolButton(reCenterIcon, 'Re-center map', () => {
    vmm.setZoom(1);
    const container = vmm['container'];
    const containerCenterX = container.clientWidth / 2;
    const containerCenterY = container.clientHeight / 2;
    vmm['offsetX'] = containerCenterX - vmm['virtualCenter'].x * vmm['zoomLevel'];
    vmm['offsetY'] = containerCenterY - vmm['virtualCenter'].y * vmm['zoomLevel'];
    vmm['updateCanvasTransform']();
  });

  const layoutBtn = createToolButton(
    vmm['currentLayout'] === 'radial' ? treeLayoutIcon : radialLayoutIcon,
    'Toggle layout',
    () => {
      const newLayout = vmm['currentLayout'] === 'radial' ? 'tree' : 'radial';
      vmm['currentLayout'] = newLayout;
      layoutBtn.innerHTML = newLayout === 'radial' ? treeLayoutIcon : radialLayoutIcon;
      vmm.render();
    },
    { disableHoverEffect: true }

  );

  const zoomContainer = document.createElement("div");
  zoomContainer.classList.add('zoom-container');
  Object.assign(zoomContainer.style, {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    alignItems: "center",
    background: `linear-gradient(135deg, ${CSS_VARS.background} 0%, ${CSS_VARS.backgroundSecondary} 100%)`,
    padding: "12px 8px",
    borderRadius: "12px",
    border: `1px solid ${CSS_VARS.border}`,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    position: "relative"
  });

  const zoomOutBtn = createToolButton(zoomOutIcon, 'Zoom out', () => {
    vmm.setZoom(vmm['zoomLevel'] / 1.2);
    vmm['zoomLevelDisplay'].textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
  });

  const zoomInBtn = createToolButton(zoomInIcon, 'Zoom in', () => {
    vmm.setZoom(vmm['zoomLevel'] * 1.2);
    vmm['zoomLevelDisplay'].textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
  });

  const zoomLevelDisplay = document.createElement("span");
  zoomLevelDisplay.textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
  Object.assign(zoomLevelDisplay.style, {
    fontSize: "11px",
    color: CSS_VARS.text,
    minWidth: "40px",
    textAlign: "center",
    fontWeight: "600",
    padding: "2px 4px",
    borderRadius: "4px",
    background: CSS_VARS.background,
    border: `1px solid ${CSS_VARS.border}`,
    fontFamily: "system-ui, -apple-system, sans-serif",
    letterSpacing: "0.025em"
  });
  vmm['zoomLevelDisplay'] = zoomLevelDisplay;
  zoomContainer.append(zoomInBtn, zoomLevelDisplay, zoomOutBtn);

  const dragModeBtn = createToolButton(draggingModeIcon, 'Toggle dragging mode', () => {
    vmm['draggingMode'] = !vmm['draggingMode'];
    dragModeBtn.setAttribute("aria-label", vmm['draggingMode'] ? "Disable dragging mode" : "Enable dragging mode");
    vmm['container'].setAttribute('dragging-mode', String(vmm['draggingMode']));
    updateButtonActiveState(dragModeBtn, vmm['draggingMode']);
  }, { disableHoverEffect: true });

  const addConnectionBtn = createToolButton(addConnectionIcon, 'Add connection', () => {
    if (vmm['connectionModeActive']) {
      vmm.deactivateConnectionMode();
    } else {
      vmm.activateConnectionMode();
    }
    updateButtonActiveState(addConnectionBtn, vmm['connectionModeActive']);
  }, { disableHoverEffect: true });


  // Create a new File button that opens a modal when clicked
  const fileBtn = createToolButton(menuIcon, 'File operations', () => {
    openFileModal();
  });

  // Create new focus button for fullscreen mode
  const focusBtn = createToolButton(focusIcon, 'Toggle fullscreen mode', () => {
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

  // NEW: Theme toggle button
  const themeToggleBtn = createToolButton(
    vmm['theme'] === 'dark' ? darkModeIcon : lightModeIcon,
    'Toggle theme',
    () => {
      vmm.toggleTheme();
      themeToggleBtn.innerHTML = vmm['theme'] === 'dark' ? darkModeIcon : lightModeIcon;
    },
    { disableHoverEffect: true }

  );

  // Grid toggle button
  const gridToggleBtn = createToolButton(gridIcon, 'Toggle grid visibility', () => {
    vmm.toggleGrid();
    updateButtonActiveState(gridToggleBtn, vmm['gridVisible']);
  }, { disableHoverEffect: true });


  // Grid snapping toggle button
  const snapToggleBtn = createToolButton(snapIcon, 'Toggle grid snapping', () => {
    vmm.toggleGridSnapping();
    updateButtonActiveState(snapToggleBtn, vmm['gridEnabled']);
  }, { disableHoverEffect: true });


  // Create toggle button for toolbar expansion/collapse with enhanced styling
  const toggleBtn = createButton('primary', { disableHoverEffect: true });
  toggleBtn.innerHTML = chevronLeftIcon;
  toggleBtn.setAttribute('aria-label', 'Toggle toolbar');
  Object.assign(toggleBtn.style, {


    position: 'absolute',
    top: '50%',
    right: '-20px',
    transform: 'translateY(-50%) rotate(0deg)',
    width: '40px',
    height: '40px',
    padding: '8px',
    borderRadius: '50%',
    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
    transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s',
    zIndex: '1101',
    cursor: 'pointer'
  });

  // Hover animations
  toggleBtn.addEventListener('mouseenter', () => {
    toggleBtn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
    toggleBtn.style.transform = `translateY(-50%) rotate(${isToolbarExpanded ? 0 : 180}deg) scale(1.1)`;
  });
  toggleBtn.addEventListener('mouseleave', () => {
    toggleBtn.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)';
    toggleBtn.style.transform = `translateY(-50%) rotate(${isToolbarExpanded ? 0 : 180}deg)`;

  });

  // Helper function to update button active states
  function updateButtonActiveState(button: HTMLButtonElement, isActive: boolean) {
    const isDark = vmm['theme'] === 'dark';
    if (isActive) {
      button.style.background = CSS_VARS.success;
      button.style.borderColor = CSS_VARS.success;
    } else {
      button.style.background = isDark ? '#000000' : '#ffffff';
      button.style.borderColor = CSS_VARS.border;
    }
    const svg = button.querySelector('svg');
    if (svg) {
      svg.style.stroke = CSS_VARS.text;
      svg.style.filter = 'none';
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
    gap: "8px",
    padding: "20px 12px",
    width: "100%",
    height: "100%",
    transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    position: "relative"
  });

  // Append buttons to toolbar content, including theme toggle
  toolbarContent.append(
    fileBtn,
    recenterBtn,
    zoomContainer,
    layoutBtn,
    dragModeBtn,
    addConnectionBtn,
    gridToggleBtn,
    snapToggleBtn,
    focusBtn,
    themeToggleBtn
  );

  // Main toolbar container with improved styling
  const toolbar = createBaseElement<HTMLDivElement>('div', {
    position: "absolute",
    top: "0",
    left: "0",
    width: "72px",
    height: "100%",
    background: CSS_VARS['toolbar-bg'],
    backdropFilter: "blur(20px) saturate(180%)",
    borderRight: `1px solid ${CSS_VARS.border}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: "1100",
    boxShadow: "4px 0 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    overflowY: "auto",
    transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
  });

  toolbar.appendChild(toolbarContent);
  toolbar.appendChild(toggleBtn);

  // Toggle functionality
  toggleBtn.addEventListener('click', () => {
    isToolbarExpanded = !isToolbarExpanded;

    if (isToolbarExpanded) {
      toolbar.style.transform = 'translateX(0)';
      toolbarContent.style.opacity = '1';
      toolbarContent.style.transform = 'translateX(0)';
      toggleBtn.innerHTML = chevronLeftIcon;
      toggleBtn.style.transform = 'translateY(-50%) rotate(0deg)';
    } else {
      toolbar.style.transform = 'translateX(-58px)';
      toolbarContent.style.opacity = '0';
      toolbarContent.style.transform = 'translateX(-10px)';
      toggleBtn.innerHTML = chevronRightIcon;
      toggleBtn.style.transform = 'translateY(-50%) rotate(180deg)';
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
      background: "radial-gradient(circle at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%)",
      backdropFilter: "blur(8px) saturate(120%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10000",
      animation: "fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    });

    const modalContainer = document.createElement("div");
    Object.assign(modalContainer.style, {
      background: CSS_VARS.background,
      padding: "32px",
      borderRadius: "20px",
      boxShadow: "0 32px 64px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      minWidth: "320px",
      maxWidth: "380px",
      border: `1px solid ${CSS_VARS.border}`,
      animation: "slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      position: "relative",
      overflow: "hidden"
    });

    // Add subtle background pattern
    const bgPattern = document.createElement("div");
    Object.assign(bgPattern.style, {
      position: "absolute",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      opacity: "0.5",
      pointerEvents: "none"
    });
    modalContainer.appendChild(bgPattern);

    const title = document.createElement("h3");
    title.textContent = "File Operations";
    Object.assign(title.style, {
      marginBottom: "24px",
      fontSize: "22px",
      fontWeight: "700",
      color: CSS_VARS.text,
      textAlign: "center",
      position: "relative",
      zIndex: "1",
      fontFamily: "system-ui, -apple-system, sans-serif",
      letterSpacing: "-0.025em"
    });
    modalContainer.appendChild(title);

    const btnConfig = [
      { label: "Export as SVG", action: () => { vmm.exportAsSVG(); }, icon: "📄", color: CSS_VARS.success },
      { label: "Copy JSON", action: () => {
          const jsonData = vmm.toJSON();
          navigator.clipboard.writeText(jsonData).then(() => {
            alert("Mindmap JSON copied to clipboard");
          }).catch(() => {
            alert("Failed to copy mindmap JSON");
          });
        }, icon: "📋", color: CSS_VARS.primary
      },
      { label: "Clear All", action: () => {
          vmm['mindMap'].root.children = [];
          vmm.render();
        }, icon: "🗑️", color: CSS_VARS.danger
      },
      { label: "Import JSON", action: async () => {
          const jsonData = await vmm.showImportModal();
          if (jsonData) {
            try { vmm.fromJSON(jsonData); } catch (error) { alert("Invalid JSON data!"); }
          }
        }, icon: "📥", color: CSS_VARS.accent
      },
      { label: "Undo", action: () => { vmm.undo(); }, icon: "↶", color: "#ea580c" },
      { label: "Redo", action: () => { vmm.redo(); }, icon: "↷", color: CSS_VARS.primary }
    ];

    btnConfig.forEach((cfg, index) => {
      const btn = document.createElement("button");
      btn.innerHTML = `<span style="margin-right: 12px; font-size: 16px; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: ${cfg.color}20; border-radius: 6px; color: ${cfg.color};">${cfg.icon}</span>${cfg.label}`;
      Object.assign(btn.style, {
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "16px 20px",
        marginBottom: "8px",
        border: `1px solid ${CSS_VARS.border}`,
        borderRadius: "12px",
        background: `linear-gradient(135deg, ${CSS_VARS.background} 0%, ${CSS_VARS.backgroundSecondary} 100%)`,
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: "500",
        color: CSS_VARS.text,
        transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        position: "relative",
        zIndex: "1",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden"
      });

      // Add shimmer effect
      const shimmer = document.createElement("div");
      Object.assign(shimmer.style, {
        position: "absolute",
        top: "0",
        left: "-100%",
        width: "100%",
        height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
        transition: "left 0.5s ease",
        pointerEvents: "none"
      });
      btn.appendChild(shimmer);

      btn.addEventListener("mouseenter", () => {
        btn.style.background = `linear-gradient(135deg, ${CSS_VARS.background} 0%, ${CSS_VARS.backgroundSecondary} 100%)`;
        btn.style.borderColor = cfg.color;
        btn.style.transform = "translateY(-2px)";
        btn.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px ${cfg.color}20`;
        shimmer.style.left = "100%";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.background = `linear-gradient(135deg, ${CSS_VARS.background} 0%, ${CSS_VARS.backgroundSecondary} 100%)`;
        btn.style.borderColor = CSS_VARS.border;
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
        shimmer.style.left = "-100%";
      });

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        btn.style.transform = "translateY(-1px) scale(0.98)";
        setTimeout(() => {
          cfg.action();
          document.body.removeChild(modalOverlay);
        }, 100);
      });
      modalContainer.appendChild(btn);
    });

    // Add a close button with improved styling
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    Object.assign(closeBtn.style, {
      display: "block",
      width: "100%",
      padding: "16px",
      marginTop: "12px",
      border: "none",
      background: `linear-gradient(135deg, ${CSS_VARS.primary} 0%, ${CSS_VARS.primaryHover} 100%)`,
      color: "#ffffff",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: "600",
      transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      boxShadow: "0 4px 12px rgba(77, 171, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
      position: "relative",
      zIndex: "1",
      fontFamily: "system-ui, -apple-system, sans-serif",
      overflow: "hidden"
    });

    const closeBtnShimmer = document.createElement("div");
    Object.assign(closeBtnShimmer.style, {
      position: "absolute",
      top: "0",
      left: "-100%",
      width: "100%",
      height: "100%",
      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
      transition: "left 0.5s ease",
      pointerEvents: "none"
    });
    closeBtn.appendChild(closeBtnShimmer);

    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = `linear-gradient(135deg, ${CSS_VARS.primaryHover} 0%, #2d8cf0 100%)`;
      closeBtn.style.transform = "translateY(-2px)";
      closeBtn.style.boxShadow = "0 8px 24px rgba(77, 171, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
      closeBtnShimmer.style.left = "100%";
    });

    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = `linear-gradient(135deg, ${CSS_VARS.primary} 0%, ${CSS_VARS.primaryHover} 100%)`;
      closeBtn.style.transform = "translateY(0)";
      closeBtn.style.boxShadow = "0 4px 12px rgba(77, 171, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
      closeBtnShimmer.style.left = "-100%";
    });

    closeBtn.addEventListener("click", () => {
      closeBtn.style.transform = "translateY(-1px) scale(0.98)";
      setTimeout(() => {
        document.body.removeChild(modalOverlay);
      }, 100);
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
    .toolbar-content button {
      background: ${CSS_VARS.background};
      border: 1px solid ${CSS_VARS.border};
      color: ${CSS_VARS.text};
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .toolbar-content button:hover {
      background: ${CSS_VARS.backgroundSecondary};
    }
    .zoom-container button {
      min-width: 32px;
      min-height: 32px;
      padding: 6px;
    }
    /* Remove gradient for dark theme, use flat color */
    :root[data-theme="dark"] .toolbar-content button {
      background: ${CSS_VARS.background} !important;
    }
    :root[data-theme="dark"] .toolbar-content button:hover {
      background: ${CSS_VARS.backgroundSecondary} !important;
    }
    :root[data-theme="dark"] .zoom-container {
      background: ${CSS_VARS.background} !important;
    }
  `;
  toolbar.appendChild(style);

  // Listen for custom events
  vmm['container'].addEventListener("connectionModeChanged", (e: Event) => {
    updateButtonActiveState(addConnectionBtn, (e as CustomEvent).detail !== false);
  });

  // Update active button colors when theme changes
  vmm['container'].addEventListener('themeChanged', () => {
    updateButtonActiveState(dragModeBtn, vmm['draggingMode']);
    updateButtonActiveState(addConnectionBtn, vmm['connectionModeActive']);
    updateButtonActiveState(gridToggleBtn, vmm['gridVisible']);
    updateButtonActiveState(snapToggleBtn, vmm['gridEnabled']);
  });

  return toolbar;
}
