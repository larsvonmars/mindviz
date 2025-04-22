"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolbar = createToolbar;
const styles_1 = require("./styles");
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
function createToolbar(vmm) {
    // Create toolbar container with modern styling
    const toolbar = (0, styles_1.createBaseElement)('div', {
        position: "sticky",
        top: "0",
        left: "0",
        right: "0",
        height: "64px",
        background: "var(--toolbar-bg, #ffffff)",
        borderBottom: "1px solid var(--border-color, #e0e0e0)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "12px",
        zIndex: "1100",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        overflowX: "auto",
        whiteSpace: "nowrap"
    });
    // Modern button factory function
    const createModernButton = (icon, label, onClick) => {
        const btn = (0, styles_1.createButton)('secondary');
        btn.innerHTML = icon;
        btn.setAttribute("aria-label", label);
        btn.addEventListener("click", onClick);
        // Add hover and active states
        btn.style.transition = 'all 0.2s ease';
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-1px)';
            btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'none';
            btn.style.boxShadow = 'none';
        });
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'translateY(1px)';
        });
        return btn;
    };
    // Create buttons with modern styling
    const recenterBtn = createModernButton(reCenterIcon, "Re-center map", () => {
        vmm.setZoom(1);
        const container = vmm['container'];
        const containerCenterX = container.clientWidth / 2;
        const containerCenterY = container.clientHeight / 2;
        vmm['offsetX'] = containerCenterX - vmm['virtualCenter'].x * vmm['zoomLevel'];
        vmm['offsetY'] = containerCenterY - vmm['virtualCenter'].y * vmm['zoomLevel'];
        vmm['updateCanvasTransform']();
    });
    // Modern select dropdown for layout
    const layoutSelect = document.createElement("select");
    layoutSelect.className = 'modern-select';
    layoutSelect.innerHTML = `
    <option value="radial">Radial Layout</option>
    <option value="tree">Tree Layout</option>
  `;
    layoutSelect.addEventListener("change", () => {
        vmm['currentLayout'] = layoutSelect.value;
        vmm.render();
    });
    // Modern zoom controls
    const zoomContainer = document.createElement("div");
    zoomContainer.className = 'zoom-container';
    const zoomLevelDisplay = document.createElement("span");
    zoomLevelDisplay.className = 'zoom-display';
    zoomLevelDisplay.textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
    const zoomControls = document.createElement("div");
    zoomControls.className = 'zoom-controls';
    const zoomOutBtn = createModernButton(zoomOutIcon, "Zoom out", () => {
        vmm.setZoom(vmm['zoomLevel'] / 1.2);
        zoomLevelDisplay.textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
    });
    const zoomInBtn = createModernButton(zoomInIcon, "Zoom in", () => {
        vmm.setZoom(vmm['zoomLevel'] * 1.2);
        zoomLevelDisplay.textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
    });
    zoomControls.append(zoomOutBtn, zoomInBtn);
    zoomContainer.append(zoomControls, zoomLevelDisplay);
    // Responsive mobile menu
    const mobileMenu = document.createElement("div");
    mobileMenu.className = 'mobile-menu';
    const menuButton = createModernButton(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 12h18M3 6h18M3 18h18"/>
    </svg>`, "Menu", () => mobileMenu.classList.toggle('active'));
    const mobileMenuContent = document.createElement("div");
    mobileMenuContent.className = 'mobile-menu-content';
    [recenterBtn.cloneNode(true), layoutSelect.cloneNode(true), zoomContainer.cloneNode(true)]
        .forEach(el => mobileMenuContent.appendChild(el));
    mobileMenu.append(menuButton, mobileMenuContent);
    // Toolbar content container (desktop)
    const toolbarContent = document.createElement("div");
    toolbarContent.className = 'toolbar-content';
    toolbarContent.append(createFileButton(vmm), recenterBtn, layoutSelect, createConnectionButton(vmm), zoomContainer, createThemeToggle(vmm), createFullscreenButton(vmm));
    toolbar.append(toolbarContent, mobileMenu);
    // Append responsive styles
    const style = document.createElement('style');
    style.textContent = `
    .modern-select {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e0e0e0);
      background: var(--input-bg, #fff);
      font-size: 14px;
      color: var(--text-primary, #333);
      transition: all 0.2s ease;
    }
    .zoom-container {
      display: flex;
      gap: 8px;
      align-items: center;
      background: var(--toolbar-bg, #fff);
      padding: 4px;
      border-radius: 8px;
    }
    .zoom-display {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary, #333);
      min-width: 52px;
      text-align: center;
    }
    @media (max-width: 768px) {
      .toolbar-content > *:not(.mobile-menu) { display: none; }
      .mobile-menu { display: block; }
    }
    @media (min-width: 769px) {
      .mobile-menu { display: none; }
    }
    .mobile-menu-content {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--toolbar-bg, #fff);
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      flex-direction: column;
      gap: 8px;
    }
    .mobile-menu.active .mobile-menu-content { display: flex; }
  `;
    toolbar.appendChild(style);
    return toolbar;
}
// --- Helper functions ---
function createThemeToggle(vmm) {
    const themeToggleBtn = (0, styles_1.createButton)('secondary');
    themeToggleBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path class="sun" d="M12 3V5M5 12H3M12 19v2M19 12h2M6.3 6.3l1.4 1.4M17.7 6.3l-1.4 1.4M6.3 17.7l1.4-1.4M17.7 17.7l-1.4-1.4"/>
      <circle class="moon" cx="12" cy="12" r="4" style="display: none;"/>
    </svg>
  `;
    themeToggleBtn.className = 'theme-toggle';
    const updateThemeIcon = () => {
        const isDark = vmm['theme'] === 'dark';
        themeToggleBtn.querySelector('.sun')?.toggleAttribute('hidden', isDark);
        themeToggleBtn.querySelector('.moon')?.toggleAttribute('hidden', !isDark);
    };
    themeToggleBtn.addEventListener("click", () => {
        vmm.toggleTheme();
        updateThemeIcon();
    });
    return themeToggleBtn;
}
function createFullscreenButton(vmm) {
    const focusBtn = (0, styles_1.createButton)('secondary');
    focusBtn.innerHTML = focusIcon;
    focusBtn.setAttribute("aria-label", "Toggle fullscreen mode");
    focusBtn.addEventListener("click", () => {
        const elem = vmm['container'];
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable fullscreen mode: ${err.message}`);
            });
        }
        else {
            document.exitFullscreen();
        }
    });
    return focusBtn;
}
function createFileButton(vmm) {
    // Wrap the original "File" button and modal code into a helper.
    const fileBtn = (0, styles_1.createButton)('secondary');
    fileBtn.textContent = "File";
    fileBtn.setAttribute("aria-label", "File operations");
    fileBtn.addEventListener("click", () => {
        // ...existing file modal creation code...
        openFileModal();
    });
    return fileBtn;
    function openFileModal() {
        const modalOverlay = document.createElement("div");
        Object.assign(modalOverlay.style, {
            position: "fixed",
            top: "0", left: "0",
            width: "100vw", height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: "10000"
        });
        const modalContainer = document.createElement("div");
        Object.assign(modalContainer.style, {
            background: "#fff",
            padding: "20px",
            borderRadius: "var(--modal-border-radius, 8px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            minWidth: "250px"
        });
        // ...existing modal content and button configuration...
        modalOverlay.appendChild(modalContainer);
        modalOverlay.addEventListener("click", e => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
        document.body.appendChild(modalOverlay);
    }
}
function createConnectionButton(vmm) {
    // Wrap the original connection button code into a helper.
    const addConnectionBtn = (0, styles_1.createButton)('secondary');
    addConnectionBtn.innerHTML = addConnectionIcon;
    addConnectionBtn.setAttribute("aria-label", "Add Custom Connection");
    addConnectionBtn.addEventListener("click", () => {
        if (vmm['connectionModeActive']) {
            vmm.deactivateConnectionMode();
        }
        else {
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
    return addConnectionBtn;
}
