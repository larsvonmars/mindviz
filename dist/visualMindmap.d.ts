import { MindMap, MindNode } from "./mindmap";
import React from "react";
declare class VisualMindMap {
    private container;
    mindMap: MindMap;
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
    private readonly GRID_SIZE;
    gridEnabled: boolean;
    gridVisible: boolean;
    private gridCanvas;
    private gridOccupancy;
    private nodePositions;
    private customConnections;
    private connectionIdCounter;
    private connectionModeActive;
    private pendingConnectionSource;
    private eventListeners;
    private theme;
    private readonly IMPORT_SPREAD_FACTOR;
    private static readonly SVG_NS;
    private static readonly ARROW_ID;
    private svgLayer;
    constructor(container: HTMLElement, mindMap: MindMap);
    private updateCanvasTransform;
    setZoom(zoom: number): void;
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    render(): void;
    renderNoCenter(): void;
    private radialLayout;
    private getSubtreeWidth;
    private treeLayout;
    private renderMindNode;
    private handleConnectionNodeClick;
    private getIconForAction;
    private selectMindNode;
    private extractSolidColor;
    private isValidColor;
    private updateMindNodeBackground;
    private updateMindNodeDescription;
    private drawLine;
    private handleConnectionClick;
    private ensureDefs;
    private makePathD;
    private createSVGPath;
    private edgePoint;
    private renderConnections;
    private updateConnectionsForNode;
    private updateAllConnectionsForNode;
    exportAsSVG(): void;
    private wrapText;
    toJSON(): string;
    /**
     * Public method to import mindmap data from JSON (unified format).
     * Accepts either a JSON string or a parsed object to avoid surprises for callers.
     */
    fromJSON(data: string | object): void;
    fromJSONWhileActive(data: string | object): void;
    private validateManualPositions;
    private enableFreeformDragging;
    private markDescendantsAsManual;
    private updateSubtreeConnections;
    private updateNodePositionInModel;
    applyRemoteOperation(operation: any): void;
    /**
     * Apply an array of operations sequentially. Each operation has the same
     * format accepted by {@link applyRemoteOperation}.
     */
    applyOperations(operations: any[]): void;
    private emit;
    private broadcastOperation;
    on(event: string, callback: (payload: any) => void): void;
    private updateNodeCoordinates;
    findMindNode(id: number): MindNode | null;
    showImportModal(): Promise<string | null>;
    getAllNodes(): MindNode[];
    private calculateBoundingBox;
    private calculateEdgePoint;
    addCustomConnection(sourceId: number, targetId: number, style?: {
        color?: string;
        width?: number;
        dasharray?: string;
    }, label?: string): void;
    activateConnectionMode(): void;
    deactivateConnectionMode(): void;
    private generateConnectionId;
    private updateMindNodeImage;
    reCenter(): void;
    toggleTheme(): void;
    applyRemoteChanges(remoteJson: string): void;
    switchToFullscreen(): void;
    /** Add a brand-new child node under `parentId`, then re-render */
    addNode(parentId: number, label: string): MindNode;
    /** Update the text (and optional description) of an existing node */
    updateNode(id: number, newText: string, newDescription?: string): void;
    /** Delete node (and its subtree) by ID */
    deleteNode(id: number): void;
    private getTouchesDistance;
    private getTouchesCenter;
    private spreadImportedLayout;
    private drawCustomConnection;
    private initializeGrid;
    private renderGrid;
    private snapToGrid;
    toggleGrid(): void;
    toggleGridSnapping(): void;
}
export { VisualMindMap };
