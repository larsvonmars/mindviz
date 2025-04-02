export declare function showConnectionModal(): Promise<{
    sourceId: number;
    targetId: number;
    color: string;
    width: number;
    dasharray: string;
    label: string;
} | null>;
