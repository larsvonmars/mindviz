export declare function showConnectionModal(canvas: HTMLElement): Promise<{
    sourceId: number;
    targetId: number;
    color: string;
    width: number;
    dasharray: string;
    label: string;
} | null>;
