declare class MindNode {
    id: number;
    label: string;
    children: MindNode[];
    background: string;
    parent: MindNode | null;
    expanded: boolean;
    description: string;
    imageUrl: string;
    hidden: boolean;
    shape: string;
    constructor(id: number, label: string);
    addChild(child: MindNode): void;
}
declare class MindMap {
    root: MindNode;
    private MindNodeCount;
    constructor(root: MindNode);
    addMindNode(parentId: number, label: string): MindNode;
    findMindNode(currentMindNode: MindNode, id: number): MindNode | null;
    toJSON(): string;
    fromJSON(json: string): void;
    private serializeNode;
    private deserializeNode;
    private getMaxId;
    deleteMindNode(MindNodeId: number): void;
    updateMindNode(MindNodeId: number, label: string, description: string): void;
    makeSibling(MindNodeId: number, label: string): MindNode;
    /**
     * Return a flat array of all nodes in the map. Useful for AI or other
     * programmatic tooling that needs to inspect the entire structure.
     */
    getAllNodes(): MindNode[];
    /**
     * Update one or more properties of a node. Properties left undefined
     * remain unchanged. Throws if the node cannot be found.
     */
    updateMindNodeProperties(id: number, props: {
        label?: string;
        description?: string;
        background?: string;
        shape?: string;
        imageUrl?: string;
    }): void;
    private findParent;
    print(node?: MindNode, indent?: number): void;
}
export { MindNode, MindMap };
