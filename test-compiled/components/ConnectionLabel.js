import { CSS_VARS } from "../styles";
class BaseComponent {
    constructor(tag = "div") {
        this.el = document.createElement(tag);
    }
    applyStyles(styles) {
        Object.assign(this.el.style, styles);
    }
}
export class ConnectionLabel extends BaseComponent {
    constructor(text) {
        super();
        this.applyStyles({
            position: "absolute",
            transform: "translate(-50%, -50%)",
            background: CSS_VARS['connection-label-bg'],
            color: CSS_VARS['connection-label-text'],
            padding: "2px 6px",
            borderRadius: CSS_VARS.radius.sm,
            fontSize: "12px",
            pointerEvents: "none",
            transition: `background ${CSS_VARS.transition.normal}, color ${CSS_VARS.transition.normal}`
        });
        this.el.textContent = text;
        this.el.className = "connection-label";
    }
    setPosition(x, y) {
        this.el.style.left = `${x}px`;
        this.el.style.top = `${y}px`;
    }
}
