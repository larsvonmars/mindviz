import { MindMap } from "./mindmap";
import React from "react";
declare class VisualMindMap {
    private container;
    private mindMap;
    constructor(container: HTMLElement, mindMap: MindMap);
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    render(): void;
    private layout;
    private renderNode;
    private drawLine;
}
export { VisualMindMap };
