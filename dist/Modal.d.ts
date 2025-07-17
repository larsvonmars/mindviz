export declare function showStyleModal(defaultText: string, defaultBg: string, defaultDesc: string, defaultImageUrl?: string, defaultShape?: string): Promise<{
    text: string;
    background: string;
    description: string;
    imageUrl: string;
    shape: string;
} | null>;
export declare function showInputModal(titleText: string, labelText: string, defaultValue?: string): Promise<string | null>;
export declare function showAddNodeModal(titleText: string, defaultLabel?: string, defaultDescription?: string, labelPlaceholder?: string): Promise<{
    label: string;
    description: string;
} | null>;
