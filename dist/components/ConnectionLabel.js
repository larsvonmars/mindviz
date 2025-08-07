"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionLabel = void 0;
const styles_1 = require("../styles");
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
            background: styles_1.CSS_VARS['connection-label-bg'],
            color: styles_1.CSS_VARS['connection-label-text'],
            padding: "2px 6px",
            borderRadius: styles_1.CSS_VARS.radius.sm,
            fontSize: "12px",
            pointerEvents: "none",
            transition: `background ${styles_1.CSS_VARS.transition.normal}, color ${styles_1.CSS_VARS.transition.normal}`
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
