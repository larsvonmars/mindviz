import { MindMap } from "./mindmap";
import React from "react";
declare class VisualMindMap {
    private container;
    private mindMap;
    private selectedNodeDiv;
    private currentActionButtons;
    private canvas;
    private offsetX;
    private offsetY;
    private readonly NODE_WIDTH;
    private readonly HORIZONTAL_GAP;
    private readonly VERTICAL_GAP;
    constructor(container: HTMLElement, mindMap: MindMap);
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    render(): void;
    private radialLayout;
    private renderNode;
    private selectNode;
    private showEditModal;
    private updateNodeBackground;
    private showModal;
    private drawLine;
    setCanvasSize(width: string, height: string): void;
}
export { VisualMindMap };
