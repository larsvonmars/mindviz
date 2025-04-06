declare class MindNode {
    id: number;
    label: string;
    children: MindNode[];
    background: string;
    parent: MindNode | null;
    expanded: boolean;
    description: string;
    imageUrl: string;
    constructor(id: number, label: string);
    addChild(child: MindNode): void;
}
declare class MindMap {
    root: MindNode;
    private MindNodeCount;
    constructor(root: MindNode);
    addMindNode(parentId: number, label: string): MindNode;
    private findMindNode;
    toJSON(): string;
    fromJSON(json: string): void;
    private serializeNode;
    private deserializeNode;
    private getMaxId;
    deleteMindNode(MindNodeId: number): void;
    updateMindNode(MindNodeId: number, label: string, description: string): void;
    makeSibling(MindNodeId: number, label: string): MindNode;
    private findParent;
    print(node?: MindNode, indent?: number): void;
}
export { MindNode, MindMap };
