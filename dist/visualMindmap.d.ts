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
    private historyStack;
    private redoStack;
    private recordSnapshot;
    undo(): void;
    redo(): void;
    private readonly MindNode_WIDTH;
    private readonly HORIZONTAL_GAP;
    private readonly VERTICAL_GAP;
    constructor(container: HTMLElement, mindMap: MindMap);
    private updateCanvasTransform;
    setZoom(zoom: number): void;
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    render(): void;
    private radialLayout;
    private computeSubtreeWidth;
    private treeLayout;
    private renderMindNode;
    private getIconForAction;
    private selectMindNode;
    private extractSolidColor;
    private isValidColor;
    private updateMindNodeBackground;
    private updateMindNodeDescription;
    private showModal;
    private drawLine;
    private calculateEdgePoint;
    setCanvasSize(width: string, height: string): void;
    clear(): void;
    private autoExpandCanvas;
    exportAsSVG(): void;
    private wrapText;
    toJSON(): string;
    fromJSON(jsonData: string): void;
    private validateManualPositions;
    private enableFreeformDragging;
    private markDescendantsAsManual;
    private updateSubtreeConnections;
    private updateNodePositionInModel;
    private updateNodeCoordinates;
    private updateConnectionsForNode;
    private findMindNode;
    private showImportModal;
    private getAllMindNodes;
    private calculateBoundingBox;
    private renderConnections;
}
export { VisualMindMap };
