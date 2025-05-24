import { MindMap, MindNode } from "./mindmap";
import React from "react";
declare class VisualMindMap {
    private container;
    mindMap: MindMap;
    private selectedMindNodeDiv;
    private currentActionButtons;
    private canvas;
    private svgCanvas;
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
    private readonly MindNode_HEIGHT;
    private readonly HORIZONTAL_GAP;
    private readonly VERTICAL_GAP;
    private readonly NODE_PADDING;
    private customConnections;
    private connectionIdCounter;
    private connectionModeActive;
    private pendingConnectionSource;
    private eventListeners;
    private theme;
    private readonly IMPORT_SPREAD_FACTOR;
    constructor(container: HTMLElement, mindMap: MindMap);
    private updateCanvasTransform;
    setZoom(zoom: number): void;
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    render(): void;
    renderNoCenter(): void;
    private computeSubtreeWidth;
    private radialLayout;
    private treeLayout;
    private renderMindNode;
    private handleConnectionNodeClick;
    private getIconForAction;
    private selectMindNode;
    /** Clear all nodes and connections from the canvas */
    clear(): void;
    /** Find a MindNode by id in the current MindMap */
    findMindNode(id: number): MindNode | null;
    /** Add a custom connection and re-render */
    addCustomConnection(sourceId: number, targetId: number, style?: {
        color?: string;
        width?: number;
        dasharray?: string;
    }, label?: string): void;
    /** Deactivate connection mode */
    deactivateConnectionMode(): void;
    /** Update a MindNode's background by traversing the tree */
    private updateMindNodeBackground;
    /** Update a MindNode's image URL by traversing the tree */
    private updateMindNodeImage;
    /** Subscribe to events for remote syncing */
    on(event: string, callback: (payload: any) => void): void;
    /** Broadcast an operation to listeners */
    broadcastOperation(operation: any): void;
    /** Apply a remote operation (invokes handlers) */
    applyRemoteOperation(operation: any): void;
    /** Serialize the current state (model and view) */
    toJSON(): string;
    /** Load state from JSON and update view */
    fromJSON(jsonStr: string): void;
    private getTouchesDistance;
    private getTouchesCenter;
    private enableFreeformDragging;
    private autoExpandCanvas;
    /** Render all connections (custom and tree) as SVG lines */
    private renderConnections;
    /** Export the current mindmap as SVG string */
    exportAsSVG(): string;
    /** Show modal to import JSON state */
    showImportModal(): Promise<string | null>;
    /** Activate connection mode to draw custom connections */
    activateConnectionMode(): void;
    private generateConnectionId;
    private showModal;
}
export { VisualMindMap };
