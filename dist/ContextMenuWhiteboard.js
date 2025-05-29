"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextMenu = createContextMenu;
function createContextMenu(wb) {
    const menu = document.createElement("div");
    menu.classList.add("wb-context-menu");
    Object.assign(menu.style, {
        position: "absolute",
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.15)",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: "4px",
        display: "none",
        zIndex: "2000",
    });
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    Object.assign(deleteBtn.style, {
        display: "block",
        width: "100%",
        padding: "6px 12px",
        background: "none",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
    });
    menu.appendChild(deleteBtn);
    let currentId = null;
    // Show context menu on right-click of an item
    wb.container.addEventListener("contextmenu", e => {
        const target = e.target;
        const itemEl = target.closest(".wb-item");
        if (!itemEl)
            return;
        e.preventDefault();
        currentId = Number(itemEl.dataset.id);
        const rect = wb.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.display = "block";
    });
    // Hide menu on outside click
    document.addEventListener("click", e => {
        if (!menu.contains(e.target)) {
            menu.style.display = "none";
        }
    });
    // Delete action
    deleteBtn.addEventListener("click", () => {
        if (currentId !== null) {
            wb.board.deleteItem(currentId);
            menu.style.display = "none";
        }
    });
    return menu;
}
