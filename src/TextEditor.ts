import { createBaseElement, createButton, CSS_VARS } from "./styles";

export interface TextEditorOptions {
    placeholder?: string;
    initialValue?: string;
    maxHeight?: string;
    onChange?: (content: string) => void;
}

export class TextEditor {
    private container: HTMLDivElement;
    private toolbar: HTMLDivElement;
    private editor: HTMLDivElement;
    private onChangeCallback?: (content: string) => void;

    constructor(options: TextEditorOptions = {}) {
        this.onChangeCallback = options.onChange;
        this.container = this.createContainer();
        this.toolbar = this.createToolbar();
        this.editor = this.createEditor(options);
        
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.editor);
        
        // FIX: Only call updatePlaceholder after this.editor is assigned
        if (options.placeholder) {
            this.editor.dataset.placeholder = options.placeholder;
            this.updatePlaceholder();
        }
        this.setupEventListeners();
    }

    private createContainer(): HTMLDivElement {
        return createBaseElement<HTMLDivElement>('div', {
            border: `1px solid ${CSS_VARS.border}`,
            borderRadius: '8px',
            overflow: 'hidden',
            background: CSS_VARS.background,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        });
    }

    private createToolbar(): HTMLDivElement {
        const toolbar = createBaseElement<HTMLDivElement>('div', {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 12px',
            borderBottom: `1px solid ${CSS_VARS.border}`,
            background: CSS_VARS.backgroundSecondary,
            flexWrap: 'wrap'
        });

        const toolbarGroups = [
            {
                name: 'formatting',
                buttons: [
                    { command: 'bold', icon: 'B', title: 'Bold' },
                    { command: 'italic', icon: 'I', title: 'Italic' },
                    { command: 'underline', icon: 'U', title: 'Underline' }
                ]
            },
            {
                name: 'lists',
                buttons: [
                    { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
                    { command: 'insertOrderedList', icon: '1.', title: 'Numbered List' }
                ]
            },
            {
                name: 'alignment',
                buttons: [
                    { command: 'justifyLeft', icon: '≡', title: 'Align Left' },
                    { command: 'justifyCenter', icon: '≣', title: 'Align Center' },
                    { command: 'justifyRight', icon: '≡', title: 'Align Right' }
                ]
            },
            {
                name: 'content',
                buttons: [
                    { command: 'createLink', icon: '🔗', title: 'Insert Link' },
                    { command: 'removeFormat', icon: '×', title: 'Clear Formatting' }
                ]
            }
        ];

        toolbarGroups.forEach((group, groupIndex) => {
            if (groupIndex > 0) {
                // Add separator
                const separator = createBaseElement<HTMLDivElement>('div', {
                    width: '1px',
                    height: '24px',
                    background: CSS_VARS.borderLight,
                    margin: '0 4px'
                });
                toolbar.appendChild(separator);
            }

            group.buttons.forEach(button => {
                const btn = this.createToolbarButton(button.command, button.icon, button.title);
                toolbar.appendChild(btn);
            });
        });

        return toolbar;
    }

    private createToolbarButton(command: string, icon: string, title: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = icon;
        button.title = title;
        
        Object.assign(button.style, {
            border: 'none',
            background: 'transparent',
            padding: '6px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: command === 'bold' ? '700' : command === 'italic' ? 'normal' : '500',
            fontStyle: command === 'italic' ? 'italic' : 'normal',
            textDecoration: command === 'underline' ? 'underline' : 'none',
            minWidth: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            color: CSS_VARS.text
        });

        button.addEventListener('mouseenter', () => {
            button.style.background = CSS_VARS.border;
            button.style.color = CSS_VARS.textDark;
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = 'transparent';
            button.style.color = CSS_VARS.text;
        });

        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.executeCommand(command);
        });

        return button;
    }

    private createEditor(options: TextEditorOptions): HTMLDivElement {
        const editor = createBaseElement<HTMLDivElement>('div', {
            minHeight: '120px',
            maxHeight: options.maxHeight || '300px',
            padding: '12px 16px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: CSS_VARS.text,
            outline: 'none',
            overflowY: 'auto',
            cursor: 'text'
        });

        editor.contentEditable = 'true';
        editor.setAttribute('role', 'textbox');
        editor.setAttribute('aria-multiline', 'true');

        if (options.initialValue) {
            editor.innerHTML = options.initialValue;
        }

        return editor;
    }

    private setupEventListeners(): void {
        // Handle input changes
        this.editor.addEventListener('input', () => {
            this.updatePlaceholder();
            if (this.onChangeCallback) {
                this.onChangeCallback(this.getContent());
            }
        });

        // Handle paste events to clean up formatting
        this.editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain') || '';
            document.execCommand('insertText', false, text);
        });

        // Handle keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        break;
                }
            }
        });

        // Update toolbar button states based on current selection
        this.editor.addEventListener('selectionchange', () => {
            this.updateToolbarStates();
        });

        document.addEventListener('selectionchange', () => {
            if (document.activeElement === this.editor) {
                this.updateToolbarStates();
            }
        });
    }

    private executeCommand(command: string): void {
        this.editor.focus();
        
        if (command === 'createLink') {
            const url = prompt('Enter the URL:');
            if (url) {
                document.execCommand(command, false, url);
            }
        } else {
            document.execCommand(command, false);
        }

        if (this.onChangeCallback) {
            this.onChangeCallback(this.getContent());
        }
    }

    private updatePlaceholder(): void {
        const placeholder = this.editor.dataset.placeholder;
        if (!placeholder) return;

        if (this.editor.textContent?.trim() === '') {
            this.editor.classList.add('empty');
            if (!this.editor.querySelector('.placeholder')) {
                const placeholderEl = createBaseElement<HTMLDivElement>('div', {
                    position: 'absolute',
                    top: '12px',
                    left: '16px',
                    color: CSS_VARS.textLight,
                    pointerEvents: 'none',
                    fontSize: '14px',
                    lineHeight: '1.5'
                });
                placeholderEl.className = 'placeholder';
                placeholderEl.textContent = placeholder;
                this.editor.style.position = 'relative';
                this.editor.appendChild(placeholderEl);
            }
        } else {
            this.editor.classList.remove('empty');
            const placeholderEl = this.editor.querySelector('.placeholder');
            if (placeholderEl) {
                placeholderEl.remove();
            }
        }
    }

    private updateToolbarStates(): void {
        const commands = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight'];
        
        commands.forEach(command => {
            const button = this.toolbar.querySelector(`[title*="${command}"]`) as HTMLButtonElement;
            if (button) {
                const isActive = document.queryCommandState(command);
                button.style.background = isActive ? CSS_VARS.borderLight : 'transparent';
                button.style.color = isActive ? CSS_VARS.textDark : CSS_VARS.text;
            }
        });
    }

    public getContent(): string {
        return this.editor.innerHTML;
    }

    public setContent(content: string): void {
        this.editor.innerHTML = content;
        this.updatePlaceholder();
    }

    public getTextContent(): string {
        return this.editor.textContent || '';
    }

    public focus(): void {
        this.editor.focus();
    }

    public getElement(): HTMLDivElement {
        return this.container;
    }

    public onChange(callback: (content: string) => void): void {
        this.onChangeCallback = callback;
    }

    public destroy(): void {
        this.container.remove();
    }
}

// Helper function to create a text editor instance
export function createTextEditor(options: TextEditorOptions = {}): TextEditor {
    return new TextEditor(options);
}
