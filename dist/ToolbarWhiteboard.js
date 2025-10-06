"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWhiteboardToolbar = createWhiteboardToolbar;
const Modal_1 = require("./Modal");
const config_1 = require("./config");
/**
 * Creates a modern toolbar for the VisualWhiteboard
 */
function createWhiteboardToolbar(wb) {
    const toolbar = document.createElement("div");
    toolbar.classList.add("wb-toolbar");
    // Tool definitions with SVG icons
    const tools = [
        {
            name: 'select',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
      </svg>`,
            title: 'Select Tool (V)',
            action: () => wb.setDrawingMode('select')
        },
        {
            name: 'pen',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m18 2 4 4-12 12-6 2 2-6 12-12z"/>
      </svg>`,
            title: 'Pen Tool (P)',
            action: () => wb.setDrawingMode('pen')
        },
        {
            name: 'eraser',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 3H8L3 8l8 8h8l5-5-8-8z"/>
      </svg>`,
            title: 'Eraser Tool (E)',
            action: () => wb.setDrawingMode('eraser')
        },
        {
            name: 'rect',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
      </svg>`,
            title: 'Rectangle Tool (R)',
            action: () => wb.setDrawingMode('rect')
        },
        {
            name: 'circle',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
      </svg>`,
            title: 'Circle Tool (C)',
            action: () => wb.setDrawingMode('circle')
        },
        {
            name: 'line',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="20" x2="20" y2="4"/>
      </svg>`,
            title: 'Line Tool (L)',
            action: () => wb.setDrawingMode('line')
        },
        {
            name: 'arrow',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12,5 19,12 12,19"/>
      </svg>`,
            title: 'Arrow Tool (A)',
            action: () => wb.setDrawingMode('arrow')
        }
    ];
    // Create tool buttons
    tools.forEach(tool => {
        const btn = createToolButton(tool.icon, tool.title, tool.action);
        btn.dataset.tool = tool.name;
        btn.classList.add('wb-tool-btn');
        if (tool.name === 'select')
            btn.classList.add('active');
        toolbar.appendChild(btn);
    });
    // Separator
    const separator1 = document.createElement('div');
    separator1.style.cssText = 'width: 1px; height: 24px; background: #e5e7eb; margin: 0 8px;';
    toolbar.appendChild(separator1);
    // Content tools
    const contentTools = [
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
      </svg>`,
            title: 'Add Text',
            action: () => wb.addItem('text')
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <polyline points="3,9 9,9 9,3"/>

      </svg>`,
            title: 'Add Note',
            action: () => wb.addItem('note')
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <path d="M4 4l6 6"/>
      </svg>`,
            title: 'Add Image',
            action: async () => {
                const url = await (0, Modal_1.showInputModal)('Add Image', 'Image URL:', 'https://via.placeholder.com/200x150');
                if (url) {
                    wb.addItem('image');
                    // Update the last added item with the URL
                    const items = wb.board.items;
                    if (items.length > 0) {
                        const lastItem = items[items.length - 1];
                        wb.board.updateItem(lastItem.id, { content: url });
                    }
                }
            }
        }
    ];
    contentTools.forEach(tool => {
        const btn = createToolButton(tool.icon, tool.title, tool.action);
        toolbar.appendChild(btn);
    });
    // Separator
    const separator2 = document.createElement('div');
    separator2.style.cssText = 'width: 1px; height: 24px; background: #e5e7eb; margin: 0 8px;';
    toolbar.appendChild(separator2);
    // Action tools
    const actionTools = [
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="1,4 1,10 7,10"/>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>`,
            title: 'Undo (Ctrl+Z)',
            action: () => wb.board.undo()
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23,4 23,10 17,10"/>
        <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
      </svg>`,
            title: 'Redo (Ctrl+Shift+Z)',
            action: () => wb.board.redo()
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
      </svg>`,
            title: 'Reset View',
            action: () => wb.resetView()
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>`,
            title: 'Zoom to Fit',
            action: () => wb.zoomToFit()
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>`,
            title: 'Export PNG',
            action: async () => {
                try {
                    const blob = await wb.exportPNG();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `whiteboard-${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
                catch (error) {
                    console.error('Export failed:', error);
                }
            }
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="16,16 12,12 8,16"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
      </svg>`,
            title: 'Load JSON',
            action: async () => {
                const json = await (0, Modal_1.showInputModal)('Load Whiteboard', 'Paste JSON data:', '');
                if (json) {
                    try {
                        wb.board.fromJSON(json);
                    }
                    catch (error) {
                        console.error('Invalid JSON:', error);
                        alert('Invalid JSON data');
                    }
                }
            }
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
      </svg>`,
            title: 'Copy JSON',
            action: () => {
                const json = wb.board.toJSON();
                navigator.clipboard.writeText(json).then(() => {
                    // Show temporary feedback
                    const btn = toolbar.querySelector('[title="Copy JSON"]');
                    const originalTitle = btn.title;
                    btn.title = 'Copied!';
                    setTimeout(() => {
                        btn.title = originalTitle;
                    }, 1000);
                });
            }
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3,6 5,6 21,6"/>
        <path d="M19,6V20A2,2 0 0,1 17,20H7A2,2 0 0,1 5,20V6M8,6V4A2,2 0 0,1 10,4H14A2,2 0 0,1 16,4V6"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>`,
            title: 'Clear All',
            action: () => {
                if (confirm('Are you sure you want to clear the whiteboard?')) {
                    wb.board.fromJSON('{"items":[]}');
                }
            }
        }
    ];
    actionTools.forEach(tool => {
        const btn = createToolButton(tool.icon, tool.title, tool.action);
        toolbar.appendChild(btn);
    });
    // Spacer to push zoom info to the right
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    toolbar.appendChild(spacer);
    // Theme toggle button
    const themeToggle = createToolButton(config_1.themeManager.getTheme() === 'dark'
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>`, 'Toggle Theme', () => {
        config_1.themeManager.toggleTheme();
        // Update button icon
        const newTheme = config_1.themeManager.getTheme();
        themeToggle.innerHTML = newTheme === 'dark'
            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>`;
    });
    toolbar.appendChild(themeToggle);
    // Zoom info
    const zoomInfo = document.createElement('div');
    zoomInfo.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--mm-text-secondary);
    font-weight: 500;
  `;
    const updateZoomInfo = () => {
        const zoom = Math.round(wb.currentViewport.zoom * 100);
        zoomInfo.textContent = `${zoom}%`;
    };
    updateZoomInfo();
    // Update zoom info periodically
    setInterval(updateZoomInfo, 100);
    toolbar.appendChild(zoomInfo);
    return toolbar;
}
function createToolButton(icon, title, action) {
    const btn = document.createElement('button');
    btn.innerHTML = icon;
    btn.title = title;
    btn.className = 'wb-tool-btn';
    btn.addEventListener('click', action);
    return btn;
}
