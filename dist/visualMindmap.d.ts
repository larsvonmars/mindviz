import { MindMap } from "./mindmap";
import React from "react";
declare class VisualMindMap {
    private container;
    private mindMap;
    private selectedMindNodeDiv;
    private currentActionButtons;
    private canvas;
    private offsetX;
    private offsetY;
    private canvasSize;
    private virtualCenter;
    private zoomLevel;
    private currentLayout;
    private readonly MindNode_WIDTH;
    private readonly HORIZONTAL_GAP;
    private readonly VERTICAL_GAP;
    constructor(container: HTMLElement, mindMap: MindMap);
    private setZoom;
    private updateCanvasTransform;
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    render(): void;
    private radialLayout;
    private treeLayout;
    private renderMindNode;
    private getIconForAction;
    private selectMindNode;
    private showStyleModal;
    private extractSolidColor;
    private isValidColor;
    private showEditModal;
    private updateMindNodeBackground;
    private showModal;
    private drawLine;
    setCanvasSize(width: string, height: string): void;
    clear(): void;
    private autoExpandCanvas;
    private exportAsSVG;
    private getAllMindNodes;
    private calculateBoundingBox;
    toJSON(): string;
    fromJSON(jsonData: string): void;
    private enableFreeformDragging;
    private updateNodePositionInModel;
    private updateNodeCoordinates;
}
export { VisualMindMap };
