export interface Point {
    x: number;
    y: number;
}
/**
 * Build a smooth SVG path using Catmull-Rom splines converted to cubic Bezier curves.
 * This produces a more natural drawing feel compared to the old quadratic method.
 */
export declare function catmullRomToBezier(points: Point[], tension?: number): string;

export declare function rectPath(width: number, height: number): string;
export declare function ellipsePath(width: number, height: number): string;
export declare function linePath(width: number, height: number): string;

