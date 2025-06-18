export interface TextEditorOptions {
    placeholder?: string;
    initialValue?: string;
    maxHeight?: string;
    onChange?: (content: string) => void;
}
export declare class TextEditor {
    private container;
    private toolbar;
    private editor;
    private onChangeCallback?;
    constructor(options?: TextEditorOptions);
    private createContainer;
    private createToolbar;
    private createToolbarButton;
    private createEditor;
    private setupEventListeners;
    private executeCommand;
    private updatePlaceholder;
    private updateToolbarStates;
    getContent(): string;
    setContent(content: string): void;
    getTextContent(): string;
    focus(): void;
    getElement(): HTMLDivElement;
    onChange(callback: (content: string) => void): void;
    destroy(): void;
}
export declare function createTextEditor(options?: TextEditorOptions): TextEditor;
