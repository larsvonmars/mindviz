export function createSVGIcon(path: string): HTMLElement {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.style.width = "16px";
  svg.style.height = "16px";
  const p = document.createElementNS(svgNS, "path");
  p.setAttribute("d", path);
  svg.appendChild(p);
  return svg as unknown as HTMLElement;
}
