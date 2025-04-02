import { MindNode } from "./mindmap";
export interface MindNodeComponentOptions {
    mindNode: MindNode;
    x: number;
    y: number;
    descriptionExpanded: boolean;
    onToggleDescription: () => void;
    onClick: (e: MouseEvent, nodeElement: HTMLDivElement) => void;
}
export declare function createMindNodeElement(options: MindNodeComponentOptions): HTMLDivElement;
