import { MindMap } from "./mindmap";
declare class VisualMindMap {
    private container;
    private mindMap;
    constructor(container: HTMLElement, mindMap: MindMap);
    render(): void;
    private layout;
    private renderNode;
    private drawLine;
}
export { VisualMindMap };
