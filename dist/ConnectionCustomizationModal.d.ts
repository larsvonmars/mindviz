export declare function showConnectionCustomizationModal(defaults: {
    sourceId: number;
    targetId: number;
    color?: string;
    width?: number;
    dasharray?: string;
    label?: string;
}): Promise<{
    action: "update" | "delete";
    color?: string;
    width?: number;
    dasharray?: string;
    label?: string;
}>;
