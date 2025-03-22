declare class Node {
    id: number;
    label: string;
    children: Node[];
    constructor(id: number, label: string);
    addChild(node: Node): void;
}
declare class MindMap {
    root: Node;
    private nodeCount;
    constructor(rootLabel: string);
    addNode(parentId: number, label: string): Node;
    private findNode;
    exportJson(): string;
    importJson(json: string): void;
    deleteNode(nodeId: number): void;
    updateNode(nodeId: number, label: string): void;
    makeSibling(nodeId: number, label: string): Node;
    private findParent;
    print(node?: Node, indent?: number): void;
}
export { Node, MindMap };
