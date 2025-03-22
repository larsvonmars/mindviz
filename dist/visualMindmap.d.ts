import { MindMap } from "./mindmap";
import React from "react";
declare class VisualMindMap {
    private container;
    private mindMap;
    private selectedNodeDiv;
    private currentActionButtons;
    private readonly NODE_WIDTH;
    private readonly HORIZONTAL_GAP;
    private readonly VERTICAL_GAP;
    constructor(container: HTMLElement, mindMap: MindMap);
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    render(): void;
    private computeSubtreeWidth;
    private layout;
    private renderNode;
    private selectNode;
    private showModal;
    private drawLine;
}
export { VisualMindMap };
