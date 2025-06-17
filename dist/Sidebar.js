"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSidebar = createSidebar;
const styles_1 = require("./styles");
// --- Define SVG icons
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
const menuItems = [
    { icon: reCenterIcon, label: 'Recenter', action: (vmm) => vmm.setZoom(1) },
    { icon: exportSvgIcon, label: 'Export SVG', action: (vmm) => vmm.exportAsSVG() },
    { icon: importJsonIcon, label: 'Import JSON', action: async (vmm) => {
            const jsonData = await vmm.showImportModal();
            if (jsonData) {
                try {
                    vmm.fromJSON(jsonData);
                }
                catch (error) {
                    alert("Invalid JSON data!");
                }
            }
        } },
    { icon: undoIcon, label: 'Undo', action: (vmm) => vmm.undo() },
    { icon: redoIcon, label: 'Redo', action: (vmm) => vmm.redo() },
    { icon: addConnectionIcon, label: 'Add Connection', action: (vmm) => vmm.activateConnectionMode() },
    { icon: focusIcon, label: 'Fullscreen', action: (vmm) => {
            const elem = vmm['container'];
            if (!document.fullscreenElement) {
                elem.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
            else {
                document.exitFullscreen();
            }
        } },
    { icon: gridIcon, label: 'Toggle Grid', action: (vmm) => vmm.toggleGrid() },
    { icon: snapIcon, label: 'Toggle Snap', action: (vmm) => vmm.toggleGridSnapping() },
    { icon: draggingModeIcon, label: 'Toggle Dragging', action: (vmm) => vmm['draggingMode'] = !vmm['draggingMode'] }
];
function createSidebar(vmm) {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    sidebar.appendChild(header);
    const logo = document.createElement('div');
    logo.className = 'sidebar-logo';
    logo.innerHTML = 'MindViz';
    header.appendChild(logo);
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
    toggleBtn.onclick = () => sidebar.classList.toggle('collapsed');
    header.appendChild(toggleBtn);
    const menu = document.createElement('ul');
    menu.className = 'sidebar-menu';
    sidebar.appendChild(menu);
    menuItems.forEach(item => {
        const menuItem = document.createElement('li');
        menuItem.className = 'sidebar-menu-item';
        menuItem.innerHTML = `
            <span class="icon">${item.icon}</span>
            <span class="label">${item.label}</span>
        `;
        menuItem.onclick = () => item.action(vmm);
        menu.appendChild(menuItem);
    });
    const controls = document.createElement('div');
    controls.className = 'sidebar-controls';
    sidebar.appendChild(controls);
    const layoutSelect = document.createElement("select");
    layoutSelect.classList.add('toolbar-select');
    layoutSelect.innerHTML = `
      <option value="radial">Radial Layout</option>
      <option value="tree">Tree Layout</option>
    `;
    layoutSelect.addEventListener("change", () => {
        vmm['currentLayout'] = layoutSelect.value;
        vmm.render();
    });
    controls.appendChild(layoutSelect);
    const zoomContainer = document.createElement("div");
    zoomContainer.classList.add('zoom-container');
    const zoomOutBtn = (0, styles_1.createButton)('secondary');
    zoomOutBtn.innerHTML = zoomOutIcon;
    zoomOutBtn.addEventListener("click", () => {
        vmm.setZoom(vmm['zoomLevel'] / 1.2);
    });
    const zoomInBtn = (0, styles_1.createButton)('secondary');
    zoomInBtn.innerHTML = zoomInIcon;
    zoomInBtn.addEventListener("click", () => {
        vmm.setZoom(vmm['zoomLevel'] * 1.2);
    });
    zoomContainer.append(zoomOutBtn, zoomInBtn);
    controls.appendChild(zoomContainer);
    return sidebar;
}
