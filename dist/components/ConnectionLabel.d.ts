declare class BaseComponent {
    el: HTMLElement;
    constructor(tag?: string);
    protected applyStyles(styles: Partial<CSSStyleDeclaration>): void;
}
export declare class ConnectionLabel extends BaseComponent {
    constructor(text: string);
    setPosition(x: number, y: number): void;
}
export {};
