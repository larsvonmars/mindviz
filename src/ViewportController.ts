export interface Point {
  x: number;
  y: number;
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export class ViewportController {
  public zoom: number;
  public panX: number;
  public panY: number;
  private el: HTMLElement;

  constructor(el: HTMLElement, initial?: Partial<ViewportState>) {
    this.el = el;
    this.zoom = initial?.zoom ?? 1;
    this.panX = initial?.panX ?? 0;
    this.panY = initial?.panY ?? 0;
    this.applyToElement();
  }

  fromScreen(screenX: number, screenY: number): Point {
    const m = new DOMMatrix()
      .translate(this.panX, this.panY)
      .scale(this.zoom);
    const inv = m.inverse();
    const pt = new DOMPoint(screenX, screenY).matrixTransform(inv);
    return { x: pt.x, y: pt.y };
  }

  applyToElement(): void {
    const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    this.el.style.transform = transform;
  }

  /**
   * Zoom the viewport at a given screen point (client coordinates) by a scale factor.
   */
  public zoomAt(screenX: number, screenY: number, scaleFactor: number, minZoom = 0.1, maxZoom = 5): void {
    const rect = this.el.getBoundingClientRect();
    const mouseX = screenX - rect.left;
    const mouseY = screenY - rect.top;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, this.zoom * scaleFactor));
    const zoomRatio = newZoom / this.zoom;
    this.panX = mouseX - (mouseX - this.panX) * zoomRatio;
    this.panY = mouseY - (mouseY - this.panY) * zoomRatio;
    this.zoom = newZoom;
    this.applyToElement();
  }
}
