"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionLabel = void 0;
class BaseComponent {
    constructor(tag = "div") {
        this.el = document.createElement(tag);
    }
    applyStyles(styles) {
        Object.assign(this.el.style, styles);
    }
}
class ConnectionLabel extends BaseComponent {
    constructor(text) {
        super();
        this.applyStyles({
            position: "absolute",
            transform: "translate(-50%, -50%)",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "2px 6px",
            borderRadius: "var(--border-radius, 4px)",
            fontSize: "12px",
            pointerEvents: "none"
        });
        this.el.textContent = text;
        this.el.className = "connection-label";
    }
    setPosition(x, y) {
        this.el.style.left = `${x}px`;
        this.el.style.top = `${y}px`;
    }
}
exports.ConnectionLabel = ConnectionLabel;
