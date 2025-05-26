export declare function showStyleModal(defaultText: string, defaultBg: string, defaultDesc: string, defaultImageUrl?: string, defaultShape?: string, defaultWidth?: number, defaultHeight?: number): Promise<{
    text: string;
    background: string;
    description: string;
    imageUrl: string;
    shape: string;
    width: number;
    height: number;
} | null>;
