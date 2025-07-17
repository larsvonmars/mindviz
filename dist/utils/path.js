"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catmullRomToBezier = catmullRomToBezier;
/**
 * Build a smooth SVG path using Catmull-Rom splines converted to cubic Bezier curves.
 * This produces a more natural drawing feel compared to the old quadratic method.
 */
function catmullRomToBezier(points, tension = 0.5) {
    if (points.length < 2)
        return '';
    if (points.length === 2) {
        return `M${points[0].x} ${points[0].y} L${points[1].x} ${points[1].y}`;
    }
    let d = `M${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
        const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
        const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
        const cp2y = p2.y - (p3.y - p1.y) * tension / 6;
        d += ` C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
    }
    return d;
}
