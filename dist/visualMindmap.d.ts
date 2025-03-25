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
    private zoomLevelDisplay;
    private currentLayout;
    private draggingMode;
    private descriptionExpanded;
    private manuallyPositionedNodes;
    private readonly MindNode_WIDTH;
    private readonly HORIZONTAL_GAP;
    private readonly VERTICAL_GAP;
    private readonly reCenterIcon;
    constructor(container: HTMLElement, mindMap: MindMap);
    private setZoom;
    private updateCanvasTransform;
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    render(): void;
    private radialLayout;
    private computeSubtreeWidth;
    private treeLayout;
    private renderMindNode;
    private getIconForAction;
    private selectMindNode;
    private showStyleModal;
    private showStyleModalOld;
    private extractSolidColor;
    private isValidColor;
    private showEditModal;
    private updateMindNodeBackground;
    private updateMindNodeDescription;
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
    private updateConnectionsForNode;
    private findMindNode;
    private showImportModal;
    private renderConnections;
}
export { VisualMindMap };
