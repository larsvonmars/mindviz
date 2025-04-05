class BaseComponent {
  public el: HTMLElement;
  constructor(tag: string = "div") {
    this.el = document.createElement(tag);
  }
  protected applyStyles(styles: Partial<CSSStyleDeclaration>): void {
    Object.assign(this.el.style, styles);
  }
}

export class ConnectionLabel extends BaseComponent {
  constructor(text: string) {
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

  setPosition(x: number, y: number): void {
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
  }
}
