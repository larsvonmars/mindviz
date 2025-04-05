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
function createToolbar(vmm) {
    // --- Create individual buttons with event listeners (desktop/mobile will reuse these)
    const recenterBtn = (0, styles_1.createButton)('secondary');
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
    const exportBtn = (0, styles_1.createButton)('secondary');
    exportBtn.innerHTML = exportSvgIcon;
    exportBtn.addEventListener("click", () => vmm.exportAsSVG());
    exportBtn.setAttribute("aria-label", "Export as SVG");
    const exportJsonBtn = (0, styles_1.createButton)('secondary');
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
    const clearBtn = (0, styles_1.createButton)('secondary');
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
        borderRadius: "4px",
        fontSize: "14px",
        color: "#333"
    });
    layoutSelect.innerHTML = `
    <option value="radial">Radial Layout</option>
    <option value="tree">Tree Layout</option>
  `;
    layoutSelect.addEventListener("change", () => {
        vmm['currentLayout'] = layoutSelect.value;
        vmm.render();
    });
    const zoomContainer = document.createElement("div");
    zoomContainer.classList.add('zoom-container');
    Object.assign(zoomContainer.style, {
        display: "flex",
        gap: "8px", // changed from "10px"
        alignItems: "center"
    });
    const zoomOutBtn = (0, styles_1.createButton)('secondary');
    zoomOutBtn.innerHTML = zoomOutIcon;
    zoomOutBtn.addEventListener("click", () => {
        vmm.setZoom(vmm['zoomLevel'] / 1.2);
        vmm['zoomLevelDisplay'].textContent = `${Math.round(vmm['zoomLevel'] * 100)}%`;
    });
    zoomOutBtn.setAttribute("aria-label", "Zoom out");
    const zoomInBtn = (0, styles_1.createButton)('secondary');
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
    const dragModeBtn = (0, styles_1.createButton)('secondary');
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
    const importBtn = (0, styles_1.createButton)('secondary');
    importBtn.innerHTML = importJsonIcon;
    importBtn.addEventListener("click", async () => {
        const jsonData = await vmm.showImportModal();
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
    const undoBtn = (0, styles_1.createButton)('secondary');
    undoBtn.innerHTML = undoIcon;
    undoBtn.addEventListener("click", () => vmm.undo());
    undoBtn.setAttribute("aria-label", "Undo (Ctrl+Z)");
    const redoBtn = (0, styles_1.createButton)('secondary');
    redoBtn.innerHTML = redoIcon;
    redoBtn.addEventListener("click", () => vmm.redo());
    redoBtn.setAttribute("aria-label", "Redo (Ctrl+Shift+Z)");
    const addConnectionBtn = (0, styles_1.createButton)('secondary');
    addConnectionBtn.innerHTML = addConnectionIcon;
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
    addConnectionBtn.setAttribute("aria-label", "Add Custom Connection");
    // --- Create new "File" dropdown for Desktop
    const fileDropdownBtn = (0, styles_1.createButton)('secondary');
    fileDropdownBtn.textContent = "File";
    fileDropdownBtn.setAttribute("aria-label", "File operations");
    const fileDropdownMenu = document.createElement("div");
    Object.assign(fileDropdownMenu.style, {
        position: "absolute",
        top: "100%",
        left: "0",
        background: "var(--toolbar-bg, #f8f9fa)",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "8px",
        display: "none",
        flexDirection: "column",
        gap: "8px",
        zIndex: "3000" // increased z-index to overlay canvas without expanding toolbar
    });
    fileDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileDropdownMenu.style.display = fileDropdownMenu.style.display === "flex" ? "none" : "flex";
    });
    document.addEventListener('click', () => {
        fileDropdownMenu.style.display = "none";
    });
    // Append file-related buttons to the File dropdown
    fileDropdownMenu.append(exportBtn, // export SVG button
    exportJsonBtn, // export JSON button
    clearBtn, // clear all button
    importBtn, // import JSON button
    undoBtn, // undo button
    redoBtn // redo button
    );
    const fileDropdownWrapper = document.createElement("div");
    fileDropdownWrapper.style.position = "relative";
    fileDropdownWrapper.style.overflow = "visible"; // allow dropdown to overlay without affecting layout
    fileDropdownWrapper.append(fileDropdownBtn, fileDropdownMenu);
    // --- Replace desktop toolbar items:
    const desktopContainer = document.createElement("div");
    desktopContainer.classList.add("desktop-toolbar");
    desktopContainer.append(fileDropdownWrapper, // moved File dropdown to left-most
    recenterBtn, layoutSelect, dragModeBtn, addConnectionBtn, zoomContainer);
    const mobileContainer = document.createElement("div");
    mobileContainer.classList.add("mobile-toolbar");
    // Create mobile menu button (hamburger icon)
    const menuBtn = (0, styles_1.createButton)('secondary');
    menuBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 12h18M3 6h18M3 18h18"/>
    </svg>
  `;
    menuBtn.setAttribute("aria-label", "Menu");
    // Create dropdown container for mobile
    const dropdownMenu = (0, styles_1.createBaseElement)('div', {
        position: 'absolute',
        top: '60px',
        left: '0',
        right: '0',
        background: 'var(--toolbar-bg, #f8f9fa)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '8px',
        display: 'none',
        flexDirection: 'column',
        gap: '8px',
        zIndex: '2000'
    });
    // Instead of cloning (which loses event listeners), re-create mobile buttons if needed.
    // For brevity, here we reuse clones (but note event listeners must be reattached in production).
    const mobileButtons = [recenterBtn, layoutSelect];
    mobileButtons.forEach(btn => {
        const mobileBtn = btn.cloneNode(true);
        dropdownMenu.appendChild(mobileBtn);
    });
    // Create new "File" dropdown for Mobile
    const fileMobileBtn = (0, styles_1.createButton)('secondary');
    fileMobileBtn.textContent = "File";
    fileMobileBtn.setAttribute("aria-label", "File operations");
    const fileMobileDropdown = document.createElement("div");
    Object.assign(fileMobileDropdown.style, {
        position: "absolute",
        top: "100%",
        left: "0",
        background: "var(--toolbar-bg, #f8f9fa)",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "8px",
        display: "none",
        flexDirection: "column",
        gap: "8px",
        zIndex: "3000" // ensure it overlays canvas
    });
    fileMobileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileMobileDropdown.style.display = fileMobileDropdown.style.display === "flex" ? "none" : "flex";
    });
    document.addEventListener('click', () => {
        fileMobileDropdown.style.display = "none";
    });
    const [fileMobileExportBtn, fileMobileJsonBtn, fileMobileClearBtn, fileMobileUndoBtn, fileMobileRedoBtn, fileMobileImportBtn] = [
        exportBtn, exportJsonBtn, clearBtn, undoBtn, redoBtn, importBtn
    ].map(btn => btn.cloneNode(true));
    fileMobileDropdown.append(fileMobileExportBtn, fileMobileJsonBtn, fileMobileClearBtn, fileMobileImportBtn, fileMobileUndoBtn, fileMobileRedoBtn);
    const fileMobileWrapper = document.createElement("div");
    fileMobileWrapper.style.position = "relative";
    fileMobileWrapper.append(fileMobileBtn, fileMobileDropdown);
    dropdownMenu.innerHTML = ""; // clear current ordering
    dropdownMenu.append(fileMobileWrapper); // File dropdown first
    mobileButtons.forEach(btn => {
        const mobileBtn = btn.cloneNode(true);
        dropdownMenu.appendChild(mobileBtn);
    });
    // Toggle dropdown visibility on menu button click and close when clicking outside
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });
    mobileContainer.append(menuBtn, dropdownMenu);
    // --- Create main toolbar container
    const toolbar = (0, styles_1.createBaseElement)('div', {
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
        gap: "8px", // changed from "12px"
        zIndex: "1100",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
        overflowX: "auto",
        whiteSpace: "nowrap"
    });
    // --- Append both desktop and mobile containers to the main toolbar
    toolbar.append(desktopContainer, mobileContainer);
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
    vmm['container'].addEventListener("connectionModeChanged", (e) => {
        const svg = addConnectionBtn.querySelector("svg");
        if (svg) {
            svg.style.stroke = e.detail === false ? "currentColor" : "#4dabf7";
        }
    });
    return toolbar;
}
