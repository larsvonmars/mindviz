import { VisualMindMap } from "./visualMindmap";
import { createButton, CSS_VARS, animateElement } from "./styles";

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
    { icon: reCenterIcon, label: 'Recenter', action: (vmm: VisualMindMap) => vmm.setZoom(1) },
    { icon: exportSvgIcon, label: 'Export SVG', action: (vmm: VisualMindMap) => vmm.exportAsSVG() },
    { icon: importJsonIcon, label: 'Import JSON', action: async (vmm: VisualMindMap) => {
        const jsonData = await vmm.showImportModal();
        if (jsonData) {
            try {
                vmm.fromJSON(jsonData);
            } catch (error) {
                alert("Invalid JSON data!");
            }
        }
    }},
    { icon: undoIcon, label: 'Undo', action: (vmm: VisualMindMap) => vmm.undo() },
    { icon: redoIcon, label: 'Redo', action: (vmm: VisualMindMap) => vmm.redo() },
    { icon: addConnectionIcon, label: 'Add Connection', action: (vmm: VisualMindMap) => vmm.activateConnectionMode() },
    { icon: focusIcon, label: 'Fullscreen', action: (vmm: VisualMindMap) => {
        const elem = vmm['container'];
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }},
    { icon: gridIcon, label: 'Toggle Grid', action: (vmm: VisualMindMap) => vmm.toggleGrid() },
    { icon: snapIcon, label: 'Toggle Snap', action: (vmm: VisualMindMap) => vmm.toggleGridSnapping() },
    { icon: draggingModeIcon, label: 'Toggle Dragging', action: (vmm: VisualMindMap) => vmm['draggingMode'] = !vmm['draggingMode'] }
];


export function createSidebar(vmm: VisualMindMap): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    
    // Enhanced sidebar styling
    Object.assign(sidebar.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        height: '100vh',
        width: '280px',
        background: `linear-gradient(145deg, ${CSS_VARS.background}, ${CSS_VARS.backgroundSecondary})`,
        backdropFilter: 'blur(20px)',
        borderRight: `2px solid ${CSS_VARS.borderLight}`,
        boxShadow: `${CSS_VARS.shadow.xl}, inset -1px 0 0 rgba(255, 255, 255, 0.1)`,
        transition: `all ${CSS_VARS.transition.normal}`,
        zIndex: '1000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    });

    const header = document.createElement('div');
    header.className = 'sidebar-header';
    Object.assign(header.style, {
        padding: CSS_VARS.spacing.xxl,
        borderBottom: `1px solid ${CSS_VARS.borderLight}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${CSS_VARS.primary}, ${CSS_VARS.primaryHover})`,
        color: 'white'
    });
    sidebar.appendChild(header);

    const logo = document.createElement('div');
    logo.className = 'sidebar-logo';
    logo.innerHTML = 'MindViz';
    Object.assign(logo.style, {
        fontSize: '24px',
        fontWeight: '700',
        letterSpacing: '1px',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
    });
    header.appendChild(logo);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
    Object.assign(toggleBtn.style, {
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        color: 'white',
        padding: CSS_VARS.spacing.md,
        borderRadius: CSS_VARS.radius.md,
        cursor: 'pointer',
        transition: `all ${CSS_VARS.transition.fast}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });
    
    toggleBtn.addEventListener('mouseenter', () => {
        toggleBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        toggleBtn.style.transform = 'scale(1.1)';
    });
    
    toggleBtn.addEventListener('mouseleave', () => {
        toggleBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        toggleBtn.style.transform = 'scale(1)';
    });
    
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('collapsed');
        if (sidebar.classList.contains('collapsed')) {
            sidebar.style.width = '60px';
            sidebar.style.transform = 'translateX(-220px)';
        } else {
            sidebar.style.width = '280px';
            sidebar.style.transform = 'translateX(0)';
        }
    };
    header.appendChild(toggleBtn);

    const menu = document.createElement('ul');
    menu.className = 'sidebar-menu';
    Object.assign(menu.style, {
        listStyle: 'none',
        padding: '0',
        margin: '0',
        flex: '1',
        overflowY: 'auto'
    });
    sidebar.appendChild(menu);

    menuItems.forEach((item, index) => {
        const menuItem = document.createElement('li');
        menuItem.className = 'sidebar-menu-item';
        Object.assign(menuItem.style, {
            padding: `${CSS_VARS.spacing.lg} ${CSS_VARS.spacing.xxl}`,
            cursor: 'pointer',
            transition: `all ${CSS_VARS.transition.fast}`,
            borderBottom: `1px solid ${CSS_VARS.borderLight}`,
            display: 'flex',
            alignItems: 'center',
            gap: CSS_VARS.spacing.lg,
            position: 'relative',
            overflow: 'hidden'
        });
        
        menuItem.innerHTML = `
            <span class="icon" style="display: flex; align-items: center; opacity: 0.7; transition: all ${CSS_VARS.transition.fast};">${item.icon}</span>
            <span class="label" style="font-weight: 500; color: ${CSS_VARS.text}; transition: all ${CSS_VARS.transition.fast};">${item.label}</span>
        `;
        
        // Enhanced hover effects
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = `linear-gradient(135deg, ${CSS_VARS.primaryLight}, rgba(255, 255, 255, 0.8))`;
            menuItem.style.borderLeft = `4px solid ${CSS_VARS.primary}`;
            menuItem.style.transform = 'translateX(4px)';
            const icon = menuItem.querySelector('.icon') as HTMLElement;
            const label = menuItem.querySelector('.label') as HTMLElement;
            if (icon) icon.style.opacity = '1';
            if (label) label.style.color = CSS_VARS.primary;
        });
        
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = 'transparent';
            menuItem.style.borderLeft = 'none';
            menuItem.style.transform = 'translateX(0)';
            const icon = menuItem.querySelector('.icon') as HTMLElement;
            const label = menuItem.querySelector('.label') as HTMLElement;
            if (icon) icon.style.opacity = '0.7';
            if (label) label.style.color = CSS_VARS.text;
        });
        
        menuItem.onclick = () => {
            // Add click animation
            menuItem.style.transform = 'scale(0.98)';
            setTimeout(() => {
                menuItem.style.transform = 'translateX(4px)';
            }, 100);
            item.action(vmm);
        };
        
        menu.appendChild(menuItem);
        
        // Stagger menu item animations
        setTimeout(() => {
            animateElement(menuItem, 'slideInFromLeft', 300);
        }, index * 50);
    });    const controls = document.createElement('div');
    controls.className = 'sidebar-controls';
    Object.assign(controls.style, {
        padding: CSS_VARS.spacing.xxl,
        borderTop: `1px solid ${CSS_VARS.borderLight}`,
        background: `linear-gradient(145deg, ${CSS_VARS.backgroundSecondary}, ${CSS_VARS.backgroundTertiary})`,
        display: 'flex',
        flexDirection: 'column',
        gap: CSS_VARS.spacing.lg
    });
    sidebar.appendChild(controls);

    const layoutSelect = document.createElement("select");
    layoutSelect.classList.add('toolbar-select');
    Object.assign(layoutSelect.style, {
        padding: `${CSS_VARS.spacing.lg} ${CSS_VARS.spacing.xl}`,
        border: `2px solid ${CSS_VARS.border}`,
        borderRadius: CSS_VARS.radius.lg,
        background: CSS_VARS.background,
        color: CSS_VARS.text,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: `all ${CSS_VARS.transition.normal}`,
        outline: 'none'
    });
    
    layoutSelect.innerHTML = `
      <option value="radial">Radial Layout</option>
      <option value="tree">Tree Layout</option>
    `;
    
    layoutSelect.addEventListener('focus', () => {
        layoutSelect.style.borderColor = CSS_VARS.primary;
        layoutSelect.style.boxShadow = `0 0 0 3px rgba(77, 171, 247, 0.1)`;
    });
    
    layoutSelect.addEventListener('blur', () => {
        layoutSelect.style.borderColor = CSS_VARS.border;
        layoutSelect.style.boxShadow = 'none';
    });
    
    layoutSelect.addEventListener("change", () => {
      vmm['currentLayout'] = layoutSelect.value as 'radial' | 'tree';
      vmm.render();
    });
    controls.appendChild(layoutSelect);

    const zoomContainer = document.createElement("div");
    zoomContainer.classList.add('zoom-container');
    Object.assign(zoomContainer.style, {
        display: 'flex',
        gap: CSS_VARS.spacing.md,
        alignItems: 'center'
    });
    
    const zoomOutBtn = createButton('secondary');
    zoomOutBtn.innerHTML = zoomOutIcon;
    zoomOutBtn.style.minWidth = '44px';
    zoomOutBtn.addEventListener("click", () => {
      vmm.setZoom(vmm['zoomLevel'] / 1.2);
    });
    
    const zoomInBtn = createButton('secondary');
    zoomInBtn.innerHTML = zoomInIcon;
    zoomInBtn.style.minWidth = '44px';
    zoomInBtn.addEventListener("click", () => {
      vmm.setZoom(vmm['zoomLevel'] * 1.2);
    });
    
    zoomContainer.append(zoomOutBtn, zoomInBtn);
    controls.appendChild(zoomContainer);

    // Add entrance animation for sidebar
    setTimeout(() => {
        animateElement(sidebar, 'slideInFromLeft', 500);
    }, 100);

    return sidebar;
}
