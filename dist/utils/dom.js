"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSVGIcon = createSVGIcon;
function createSVGIcon(path) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.style.width = "16px";
    svg.style.height = "16px";
    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", path);
    svg.appendChild(p);
    return svg;
}
