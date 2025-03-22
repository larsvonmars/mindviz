declare class MindNode {
    id: number;
    label: string;
    children: MindNode[];
    background: string;
    constructor(id: number, label: string);
    addChild(MindNode: MindNode): void;
}
declare class MindMap {
    root: MindNode;
    private MindNodeCount;
    constructor(root: MindNode);
    addMindNode(parentId: number, label: string): MindNode;
    private findMindNode;
    exportJson(): string;
    importJson(json: string): void;
    deleteMindNode(MindNodeId: number): void;
    updateMindNode(MindNodeId: number, label: string): void;
    makeSibling(MindNodeId: number, label: string): MindNode;
    private findParent;
    print(MindNode?: MindNode, indent?: number): void;
}
export { MindNode, MindMap };
