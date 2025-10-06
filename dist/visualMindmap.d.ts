import { MindMap, MindNode } from "./mindmap";
import React from "react";
import { ContainerConfig } from "./config";
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
    private lastRenderState;
    private renderScheduled;
    private recordSnapshot;
    undo(): void;
    redo(): void;
    private readonly MindNode_WIDTH;
    private readonly HORIZONTAL_GAP;
    private readonly VERTICAL_GAP;
    private readonly MIN_ZOOM;
    private readonly MAX_ZOOM;
    private readonly GRID_SIZE;
    gridEnabled: boolean;
    gridVisible: boolean;
    private gridCanvas;
    private gridCtx;
    private gridRenderScheduled;
    private gridOccupancy;
    private nodePositions;
    private customConnections;
    private connectionIdCounter;
    private connectionModeActive;
    private pendingConnectionSource;
    private eventListeners;
    private themeUnsubscribe?;
    private eventListenerCleanup;
    private readonly IMPORT_SPREAD_FACTOR;
    private static readonly SVG_NS;
    private static readonly ARROW_ID;
    private svgLayer;
    constructor(container: HTMLElement, mindMap: MindMap, config?: ContainerConfig);
    private updateCanvasTransform;
    /**
     * Set the zoom level for the mindmap canvas
     * @param zoom - The desired zoom level (will be clamped between 0.1 and 5)
     */
    setZoom(zoom: number): void;
    private scheduleGridRender;
    private captureRenderState;
    static fromReactRef(containerRef: React.RefObject<HTMLDivElement>, mindMap: MindMap): VisualMindMap;
    /**
     * Render the mindmap with all nodes and connections
     * Uses requestAnimationFrame for optimal performance and prevents redundant renders
     */
    render(): void;
    private _doRender;
    /**
     * Render the mindmap without re-centering the viewport
     * Useful when updating nodes to maintain the current view
     */
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
    /**
     * Export the mindmap as an SVG file
     * Creates a downloadable SVG representation of the current mindmap state
     */
    exportAsSVG(): void;
    private wrapText;
    toJSON(): string;
    /**
     * Import mindmap data from JSON (unified format)
     * Accepts either a JSON string or a parsed object
     * @param data - JSON string or object containing mindmap data
     * @throws Error if data is invalid or parsing fails
     */
    fromJSON(data: string | object): void;
    /**
     * Import mindmap data from JSON while maintaining the active viewport
     * Similar to fromJSON but uses renderNoCenter to keep the current view
     * @param data - JSON string or object containing mindmap data
     * @throws Error if data is invalid or parsing fails
     */
    fromJSONWhileActive(data: string | object): void;
    private validateManualPositions;
    private enableFreeformDragging;
    private markDescendantsAsManual;
    private updateSubtreeConnections;
    private updateNodePositionInModel;
    /**
     * Apply a remote operation to the mindmap
     * Used for collaborative editing or undo/redo functionality
     * @param operation - The operation object containing type and relevant data
     */
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
    /**
     * Find a node by its ID in the mindmap tree
     * @param id - The unique identifier of the node to find
     * @returns The found MindNode or null if not found
     */
    findMindNode(id: number): MindNode | null;
    showImportModal(): Promise<string | null>;
    /**
     * Get all nodes in the mindmap tree
     * @returns Array of all MindNode objects in the tree
     */
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
    private handleThemeChange;
    applyRemoteChanges(remoteJson: string): void;
    switchToFullscreen(): void;
    /**
     * Add a new child node to the specified parent node
     * @param parentId - The ID of the parent node
     * @param label - The label text for the new node
     * @returns The newly created MindNode or null if parent not found or label is empty
     */
    addNode(parentId: number, label: string): MindNode | null;
    /**
     * Update an existing node's text and optional description
     * @param id - The ID of the node to update
     * @param newText - The new text for the node (cannot be empty)
     * @param newDescription - Optional new description for the node
     */
    updateNode(id: number, newText: string, newDescription?: string): void;
    /**
     * Delete a node and all its descendants from the mindmap
     * Root node cannot be deleted
     * @param id - The ID of the node to delete
     */
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
    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     * Call this when the VisualMindMap instance is no longer needed
     */
    destroy(): void;
}
export { VisualMindMap };
