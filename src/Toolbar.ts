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
    gap: "4px",
    alignItems: "center",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)",
    padding: "12px 8px",
    borderRadius: "12px",
    border: "1px solid rgba(226, 232, 240, 0.6)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    position: "relative"
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
    fontSize: "11px",
    color: "#475569",
    minWidth: "40px",
    textAlign: "center",
    fontWeight: "600",
    padding: "2px 4px",
    borderRadius: "4px",
    background: "rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(226, 232, 240, 0.4)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    letterSpacing: "0.025em"
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

  // NEW: Theme toggle button
  const themeToggleBtn = createButton('secondary');
  // set initial icon based on current theme
  themeToggleBtn.innerHTML = vmm['theme'] === 'dark' ? darkModeIcon : lightModeIcon;
  themeToggleBtn.setAttribute('aria-label', 'Toggle theme');
  themeToggleBtn.addEventListener('click', () => {
    vmm.toggleTheme();
    // update icon after toggle
    themeToggleBtn.innerHTML = vmm['theme'] === 'dark' ? darkModeIcon : lightModeIcon;
  });

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
  const toggleBtn = createButton('secondary', { disableHoverEffect: true });
  toggleBtn.innerHTML = chevronLeftIcon;
  toggleBtn.setAttribute("aria-label", "Toggle toolbar");
  Object.assign(toggleBtn.style, {
    position: "absolute",
    top: "50%",
    right: "-18px",
    transform: "translateY(-50%) rotate(var(--rotation, 0deg))",
    width: "36px",
    height: "36px",
    padding: "6px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8)",
    zIndex: "1101",
    transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    cursor: "pointer"
  });
  toggleBtn.style.setProperty('--rotation', '0deg');

  // Helper function to update button active states
  function updateButtonActiveState(button: HTMLButtonElement, isActive: boolean) {
    if (isActive) {
      button.style.background = "linear-gradient(135deg, #4dabf7 0%, #339af7 100%)";
      button.style.borderColor = "#4dabf7";
      button.style.color = "#ffffff";
      button.style.boxShadow = "0 4px 12px rgba(77, 171, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
      button.style.transform = "translateY(-1px)";
      const svg = button.querySelector("svg");
      if (svg) {
        svg.style.stroke = "#ffffff";
        svg.style.filter = "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))";
      }
    } else {
      button.style.background = "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
      button.style.borderColor = "rgba(226, 232, 240, 0.8)";
      button.style.color = "#64748b";
      button.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
      button.style.transform = "translateY(0)";
      const svg = button.querySelector("svg");
      if (svg) {
        svg.style.stroke = "#64748b";
        svg.style.filter = "none";
      }
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
    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)",
    backdropFilter: "blur(20px) saturate(180%)",
    borderRight: "1px solid rgba(226, 232, 240, 0.8)",
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
  toggleBtn.addEventListener("click", () => {
    isToolbarExpanded = !isToolbarExpanded;
    
    if (isToolbarExpanded) {
      toolbar.style.width = "72px";
      toolbar.style.transform = "translateX(0)";
      toolbarContent.style.opacity = "1";
      toolbarContent.style.transform = "translateX(0)";
      toggleBtn.innerHTML = chevronLeftIcon;
      toggleBtn.style.right = "-18px";
      toggleBtn.style.setProperty('--rotation', '0deg');
    } else {
      toolbar.style.width = "72px";
      toolbar.style.transform = "translateX(-58px)";
      toolbarContent.style.opacity = "0";
      toolbarContent.style.transform = "translateX(-10px)";
      toggleBtn.innerHTML = chevronRightIcon;
      toggleBtn.style.right = "-18px";
      toggleBtn.style.setProperty('--rotation', '180deg');
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
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      padding: "32px",
      borderRadius: "20px",
      boxShadow: "0 32px 64px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      minWidth: "320px",
      maxWidth: "380px",
      border: "1px solid rgba(226, 232, 240, 0.6)",
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
      color: "#1e293b",
      textAlign: "center",
      position: "relative",
      zIndex: "1",
      fontFamily: "system-ui, -apple-system, sans-serif",
      letterSpacing: "-0.025em"
    });
    modalContainer.appendChild(title);

    const btnConfig = [
      { label: "Export as SVG", action: () => { vmm.exportAsSVG(); }, icon: "📄", color: "#059669" },
      { label: "Copy JSON", action: () => {
          const jsonData = vmm.toJSON();
          navigator.clipboard.writeText(jsonData).then(() => {
            alert("Mindmap JSON copied to clipboard");
          }).catch(() => {
            alert("Failed to copy mindmap JSON");
          });
        }, icon: "📋", color: "#0284c7"
      },
      { label: "Clear All", action: () => {
          vmm['mindMap'].root.children = [];
          vmm.render();
        }, icon: "🗑️", color: "#dc2626"
      },
      { label: "Import JSON", action: async () => {
          const jsonData = await vmm.showImportModal();
          if (jsonData) {
            try { vmm.fromJSON(jsonData); } catch (error) { alert("Invalid JSON data!"); }
          }
        }, icon: "📥", color: "#7c3aed"
      },
      { label: "Undo", action: () => { vmm.undo(); }, icon: "↶", color: "#ea580c" },
      { label: "Redo", action: () => { vmm.redo(); }, icon: "↷", color: "#0891b2" }
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
        border: "1px solid rgba(226, 232, 240, 0.8)",
        borderRadius: "12px",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: "500",
        color: "#334155",
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
        btn.style.background = "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)";
        btn.style.borderColor = cfg.color;
        btn.style.transform = "translateY(-2px)";
        btn.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px ${cfg.color}20`;
        shimmer.style.left = "100%";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.background = "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
        btn.style.borderColor = "rgba(226, 232, 240, 0.8)";
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
      background: "linear-gradient(135deg, #4dabf7 0%, #339af7 100%)",
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
      closeBtn.style.background = "linear-gradient(135deg, #339af7 0%, #2d8cf0 100%)";
      closeBtn.style.transform = "translateY(-2px)";
      closeBtn.style.boxShadow = "0 8px 24px rgba(77, 171, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
      closeBtnShimmer.style.left = "100%";
    });

    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "linear-gradient(135deg, #4dabf7 0%, #339af7 100%)";
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

    @keyframes buttonPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    /* Enhanced toolbar button styling */
    .toolbar-content button {
      position: relative;
      overflow: hidden;
      min-width: 44px;
      min-height: 44px;
      border-radius: 12px !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
      color: #64748b !important;
      cursor: pointer !important;
      transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(10px) !important;
      font-family: system-ui, -apple-system, sans-serif !important;
    }

    .toolbar-content button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
      border-radius: 12px;
    }

    .toolbar-content button:hover::before {
      opacity: 1;
    }

    .toolbar-content button:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
      border-color: rgba(77, 171, 247, 0.3) !important;
    }

    .toolbar-content button:active {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
      animation: buttonPulse 0.2s ease !important;
    }

    .toolbar-content button svg {
      width: 20px !important;
      height: 20px !important;
      stroke-width: 2 !important;
      transition: all 0.2s ease !important;
    }

    .toolbar-content button:hover svg {
      stroke: #4dabf7 !important;
      filter: drop-shadow(0 2px 4px rgba(77, 171, 247, 0.2)) !important;
    }

    /* Zoom container enhancements */
    .zoom-container button {
      min-width: 32px !important;
      min-height: 32px !important;
      padding: 6px !important;
      border-radius: 8px !important;
      font-size: 14px !important;
    }

    .zoom-container button svg {
      width: 16px !important;
      height: 16px !important;
    }

    /* Toggle button enhancements */
    .toolbar-content + button {
      backdrop-filter: blur(20px) !important;
    }

    .toolbar-content + button:hover {
      transform: scale(1.1) translateY(-50%) rotate(var(--rotation, 0deg)) !important;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.9) !important;
    }

    .toolbar-content + button:active {
      transform: scale(0.95) translateY(-50%) rotate(var(--rotation, 0deg)) !important;
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

    /* Enhanced scrollbar styling */
    .toolbar-content::-webkit-scrollbar {
      width: 4px;
    }
    .toolbar-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 2px;
    }
    .toolbar-content::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, rgba(148, 163, 184, 0.3), rgba(100, 116, 139, 0.4));
      border-radius: 2px;
      transition: all 0.2s ease;
    }
    .toolbar-content::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, rgba(148, 163, 184, 0.5), rgba(100, 116, 139, 0.6));
    }

    /* Divider between button groups */
    .toolbar-content > *:nth-child(4)::after,
    .toolbar-content > *:nth-child(7)::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(226, 232, 240, 0.6), transparent);
    }

    /* Subtle animations */
    .toolbar-content {
      animation: fadeIn 0.4s ease;
    }

    .toolbar-content > * {
      animation: slideUp 0.3s ease;
      animation-fill-mode: both;
    }

    .toolbar-content > *:nth-child(1) { animation-delay: 0.1s; }
    .toolbar-content > *:nth-child(2) { animation-delay: 0.15s; }
    .toolbar-content > *:nth-child(3) { animation-delay: 0.2s; }
    .toolbar-content > *:nth-child(4) { animation-delay: 0.25s; }
    .toolbar-content > *:nth-child(5) { animation-delay: 0.3s; }
    .toolbar-content > *:nth-child(6) { animation-delay: 0.35s; }
    .toolbar-content > *:nth-child(7) { animation-delay: 0.4s; }
    .toolbar-content > *:nth-child(8) { animation-delay: 0.45s; }
    .toolbar-content > *:nth-child(9) { animation-delay: 0.5s; }
    .toolbar-content > *:nth-child(10) { animation-delay: 0.55s; }
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
