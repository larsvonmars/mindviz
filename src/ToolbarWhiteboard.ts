import { VisualWhiteboard } from "./visualWhiteboard";
import { WhiteboardItemType } from "./whiteboard";
import { createSVGIcon } from "./utils/dom";
import { showInputModal } from "./Modal";

/**
 * Creates a toolbar for VisualWhiteboard with common user actions.
 */
export function createWhiteboardToolbar(wb: VisualWhiteboard): HTMLElement {
  const toolbar = document.createElement("div");
  Object.assign(toolbar.style, {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "50px",
    background: "var(--toolbar-bg, #f8f9fa)",
    borderBottom: "1px solid var(--border-color, #e0e0e0)",
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
    gap: "8px",
    zIndex: "1000",
    overflowX: "auto",
    whiteSpace: "nowrap",
  });

  // SVG icon definitions for whiteboard toolbar
  const textIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="6" y1="4" x2="18" y2="4"></line>
    <line x1="12" y1="4" x2="12" y2="20"></line>
  </svg>`;
  const stickyIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="4" y="4" width="16" height="16" rx="2"></rect>
    <path d="M4 4l6 6"></path>
  </svg>`;
  const imageIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <circle cx="8" cy="8" r="1"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>`;
  const undoIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 4 7 12 15 20"></polyline></svg>`;
  const redoIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 4 17 12 9 20"></polyline></svg>`;
  const clearIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="3" x2="21" y2="21"></line></svg>`;
  const exportIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><polyline points="8,12 12,8 16,12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>`;
  const copyIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">{}</text></svg>`;
  const importIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><polyline points="8,12 12,16 16,12"></polyline><line x1="12" y1="8" x2="12" y2="16"></line></svg>`;
  const zoomInIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
  const zoomOutIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
  const gridIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4V4zM4 14h6v6H4v-6zM14 4h6v6h-6V4zM14 14h6v6h-6v-6z"></path></svg>`;
  const snapIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5v14"></path></svg>`;

  function makeIconBtn(icon: string, aria: string, action: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.innerHTML = icon;
    btn.setAttribute("aria-label", aria);
    btn.title = aria; // show tooltip on hover
    Object.assign(btn.style, {
      padding: "6px",
      cursor: "pointer",
      border: "1px solid var(--border-color, #ccc)",
      borderRadius: "4px",
      background: "var(--button-bg, #fff)",
    });
    btn.addEventListener("click", action);
    return btn;
  }

  // Add Text item
  toolbar.append(
    makeIconBtn(textIcon, "Add Text", () => {
      wb.board.addItem({ type: "text", x: 20, y: 20, width: 120, height: 30, content: "New Text" });
    })
  );

  // Add Sticky note
  toolbar.append(
    makeIconBtn(stickyIcon, "Add Sticky Note", () => {
      wb.board.addItem({ type: "sticky", x: 20, y: 60, width: 120, height: 50, content: "Note" });
    })
  );

  // Add Image via URL prompt
  toolbar.append(
    makeIconBtn(imageIcon, "Add Image", async () => {
      const url = await showInputModal("Add Image", "Image URL", "");
      if (url) wb.board.addItem({ type: "image", x: 20, y: 120, width: 100, height: 100, content: url });
    })
  );

  // Undo / Redo
  toolbar.append(makeIconBtn(undoIcon, "Undo", () => wb.board.undo()));
  toolbar.append(makeIconBtn(redoIcon, "Redo", () => wb.board.redo()));

  // Clear all items
  toolbar.append(
    makeIconBtn(clearIcon, "Clear All", () => {
      wb.board.fromJSON('{"items":[]}');
    })
  );

  // Export PNG
  toolbar.append(
    makeIconBtn(exportIcon, "Export PNG", async () => {
      const blob = await wb.exportPNG();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'whiteboard.png';
      a.click();
      URL.revokeObjectURL(url);
    })
  );

  // Copy JSON
  toolbar.append(
    makeIconBtn(copyIcon, "Copy JSON", () => {
      const json = wb.board.toJSON();
      navigator.clipboard.writeText(json);
    })
  );

  // Import JSON
  toolbar.append(
    makeIconBtn(importIcon, "Import JSON", async () => {
      const txt = await showInputModal("Import JSON", "JSON Data", "");
      if (txt) wb.board.fromJSON(txt);
    })
  );

  // Zoom controls
  toolbar.append(makeIconBtn(zoomInIcon, "Zoom In", () => { wb['zoom'] *= 1.2; wb['updateViewportTransform'](); }));
  toolbar.append(makeIconBtn(zoomOutIcon, "Zoom Out", () => { wb['zoom'] /= 1.2; wb['updateViewportTransform'](); }));

  // Grid toggle
  let gridOn = true;
  toolbar.append(
    makeIconBtn(gridIcon, "Toggle Grid", () => {
      gridOn = !gridOn;
      wb['canvas'].style.backgroundImage = gridOn ? wb['canvas'].style.backgroundImage : '';
    })
  );

  // Snap toggle
  let snapOn = wb['options'].snap;
  toolbar.append(
    makeIconBtn(snapIcon, "Toggle Snap", () => {
      snapOn = !snapOn;
      wb['options'].snap = snapOn;
    })
  );

  return toolbar;
}
