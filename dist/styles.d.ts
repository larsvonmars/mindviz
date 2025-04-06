export declare const CSS_VARS: {
    primary: string;
    primaryHover: string;
    danger: string;
    dangerHover: string;
    background: string;
    text: string;
    border: string;
    radius: {
        sm: string;
        md: string;
        lg: string;
    };
    shadow: {
        sm: string;
        md: string;
        lg: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    transition: string;
    'modal-bg': string;
    'modal-text': string;
    'modal-border': string;
    'modal-radius': string;
    'input-bg': string;
    'input-text': string;
};
export declare const createBaseElement: <T extends HTMLElement>(tag: string, styles: Partial<CSSStyleDeclaration>) => T;
export declare const createInput: (type?: string) => HTMLInputElement;
export declare const createButton: (variant?: "primary" | "secondary" | "danger") => HTMLButtonElement;
export declare const extractSolidColor: (bg: string) => string | null;
