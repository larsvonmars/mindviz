"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextMenu = createContextMenu;
const Modal_1 = require("./Modal");
function createContextMenu(wb) {
    const menu = document.createElement("div");
    menu.classList.add("wb-context-menu");
    Object.assign(menu.style, {
        position: "absolute",
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.15)",
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        padding: "6px",
        display: "none",
        zIndex: "2000",
        minWidth: "150px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
    });
    // Menu items
    const menuItems = [
        {
            label: "Edit",
            icon: "✏️",
            action: () => editItem(),
        },
        {
            label: "Duplicate",
            icon: "📄",
            action: () => duplicateItem(),
        },
        {
            label: "Bring to Front",
            icon: "⬆️",
            action: () => bringToFront(),
        },
        {
            label: "Send to Back",
            icon: "⬇️",
            action: () => sendToBack(),
        },
        { separator: true },
        {
            label: "Delete",
            icon: "🗑️",
            action: () => deleteItem(),
            danger: true,
        },
    ];
    menuItems.forEach(item => {
        if (item.separator) {
            const separator = document.createElement("div");
            separator.style.cssText = "height: 1px; background: #e5e7eb; margin: 4px 0;";
            menu.appendChild(separator);
            return;
        }
        const btn = document.createElement("button");
        btn.innerHTML = `${item.icon} ${item.label}`;
        Object.assign(btn.style, {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            padding: "8px 12px",
            background: "none",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            borderRadius: "4px",
            color: item.danger ? "#dc2626" : "#374151",
            fontSize: "14px",
        });
        btn.addEventListener("mouseenter", () => {
            btn.style.background = item.danger ? "#fef2f2" : "#f3f4f6";
        });
        btn.addEventListener("mouseleave", () => {
            btn.style.background = "none";
        });
        btn.addEventListener("click", () => {
            if (item.action) {
                item.action();
            }
            hideMenu();
        });
        menu.appendChild(btn);
    });
    let currentItemId = null;
    let currentItems = [];
    function hideMenu() {
        menu.style.display = "none";
        currentItemId = null;
        currentItems = [];
    }
    function editItem() {
        if (!currentItemId)
            return;
        const item = wb.board.items.find(i => i.id === currentItemId);
        if (!item)
            return;
        if (item.type === 'text' || item.type === 'sticky') {
            (0, Modal_1.showInputModal)('Edit Text', 'Content:', item.content || '').then(newContent => {
                if (newContent !== null) {
                    wb.board.updateItem(currentItemId, { content: newContent });
                }
            });
        }
        else if (item.type === 'image') {
            (0, Modal_1.showInputModal)('Edit Image', 'Image URL:', item.content || '').then(newUrl => {
                if (newUrl !== null) {
                    wb.board.updateItem(currentItemId, { content: newUrl });
                }
            });
        }
    }
    function duplicateItem() {
        if (!currentItemId)
            return;
        const item = wb.board.items.find(i => i.id === currentItemId);
        if (!item)
            return;
        const newItem = { ...item };
        delete newItem.id; // Remove id so board will assign new one
        newItem.x += 20;
        newItem.y += 20;
        wb.board.addItem(newItem);
    }
    function bringToFront() {
        if (!currentItemId)
            return;
        const item = wb.board.items.find(i => i.id === currentItemId);
        if (!item)
            return;
        const maxZ = Math.max(...wb.board.items.map(i => i.z || 0));
        wb.board.updateItem(currentItemId, { z: maxZ + 1 });
    }
    function sendToBack() {
        if (!currentItemId)
            return;
        const item = wb.board.items.find(i => i.id === currentItemId);
        if (!item)
            return;
        const minZ = Math.min(...wb.board.items.map(i => i.z || 0));
        wb.board.updateItem(currentItemId, { z: minZ - 1 });
    }
    function deleteItem() {
        if (currentItems.length > 1) {
            // Delete multiple selected items
            currentItems.forEach(id => wb.board.deleteItem(id));
        }
        else if (currentItemId) {
            // Delete single item
            wb.board.deleteItem(currentItemId);
        }
    }
    // Show context menu on right-click
    wb.container.addEventListener("contextmenu", e => {
        e.preventDefault();
        const containerRect = wb.container.getBoundingClientRect();
        const canvasPoint = {
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top - 60 // Account for toolbar height
        };
        // Convert to world coordinates
        const worldPoint = wb.screenToWorld(canvasPoint);
        // Find item at this position
        const clickedItem = wb.getItemAt(worldPoint.x, worldPoint.y);
        if (clickedItem) {
            currentItemId = clickedItem.id;
            const selectedItems = wb.selectedItems;
            currentItems = selectedItems.length > 0 && selectedItems.includes(clickedItem.id)
                ? [...selectedItems]
                : [clickedItem.id];
            // Update menu for multiple selection
            const deleteBtn = menu.querySelector("button:last-child");
            if (currentItems.length > 1) {
                deleteBtn.innerHTML = `🗑️ Delete (${currentItems.length} items)`;
            }
            else {
                deleteBtn.innerHTML = "🗑️ Delete";
            }
            // Position menu
            menu.style.left = `${e.clientX}px`;
            menu.style.top = `${e.clientY}px`;
            menu.style.display = "block";
            // Ensure menu stays within viewport
            const menuRect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            if (menuRect.right > viewportWidth) {
                menu.style.left = `${e.clientX - menuRect.width}px`;
            }
            if (menuRect.bottom > viewportHeight) {
                menu.style.top = `${e.clientY - menuRect.height}px`;
            }
        }
    });
    // Hide menu on outside click
    document.addEventListener("click", e => {
        if (!menu.contains(e.target)) {
            hideMenu();
        }
    });
    // Hide menu on escape key
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            hideMenu();
        }
    });
    return menu;
}
