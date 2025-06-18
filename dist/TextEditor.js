"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditor = void 0;
exports.createTextEditor = createTextEditor;
const styles_1 = require("./styles");
class TextEditor {
    constructor(options = {}) {
        this.onChangeCallback = options.onChange;
        this.container = this.createContainer();
        this.toolbar = this.createToolbar();
        this.editor = this.createEditor(options);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.editor);
        this.setupEventListeners();
    }
    createContainer() {
        return (0, styles_1.createBaseElement)('div', {
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        });
    }
    createToolbar() {
        const toolbar = (0, styles_1.createBaseElement)('div', {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 12px',
            borderBottom: '1px solid #e9ecef',
            background: '#f8f9fa',
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
                const separator = (0, styles_1.createBaseElement)('div', {
                    width: '1px',
                    height: '24px',
                    background: '#dee2e6',
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
    createToolbarButton(command, icon, title) {
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
            color: '#495057'
        });
        button.addEventListener('mouseenter', () => {
            button.style.background = '#e9ecef';
            button.style.color = '#212529';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = 'transparent';
            button.style.color = '#495057';
        });
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.executeCommand(command);
        });
        return button;
    }
    createEditor(options) {
        const editor = (0, styles_1.createBaseElement)('div', {
            minHeight: '120px',
            maxHeight: options.maxHeight || '300px',
            padding: '12px 16px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#495057',
            outline: 'none',
            overflowY: 'auto',
            cursor: 'text'
        });
        editor.contentEditable = 'true';
        editor.setAttribute('role', 'textbox');
        editor.setAttribute('aria-multiline', 'true');
        if (options.placeholder) {
            editor.dataset.placeholder = options.placeholder;
            this.updatePlaceholder();
        }
        if (options.initialValue) {
            editor.innerHTML = options.initialValue;
        }
        return editor;
    }
    setupEventListeners() {
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
    executeCommand(command) {
        this.editor.focus();
        if (command === 'createLink') {
            const url = prompt('Enter the URL:');
            if (url) {
                document.execCommand(command, false, url);
            }
        }
        else {
            document.execCommand(command, false);
        }
        if (this.onChangeCallback) {
            this.onChangeCallback(this.getContent());
        }
    }
    updatePlaceholder() {
        const placeholder = this.editor.dataset.placeholder;
        if (!placeholder)
            return;
        if (this.editor.textContent?.trim() === '') {
            this.editor.classList.add('empty');
            if (!this.editor.querySelector('.placeholder')) {
                const placeholderEl = (0, styles_1.createBaseElement)('div', {
                    position: 'absolute',
                    top: '12px',
                    left: '16px',
                    color: '#adb5bd',
                    pointerEvents: 'none',
                    fontSize: '14px',
                    lineHeight: '1.5'
                });
                placeholderEl.className = 'placeholder';
                placeholderEl.textContent = placeholder;
                this.editor.style.position = 'relative';
                this.editor.appendChild(placeholderEl);
            }
        }
        else {
            this.editor.classList.remove('empty');
            const placeholderEl = this.editor.querySelector('.placeholder');
            if (placeholderEl) {
                placeholderEl.remove();
            }
        }
    }
    updateToolbarStates() {
        const commands = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight'];
        commands.forEach(command => {
            const button = this.toolbar.querySelector(`[title*="${command}"]`);
            if (button) {
                const isActive = document.queryCommandState(command);
                button.style.background = isActive ? '#dee2e6' : 'transparent';
                button.style.color = isActive ? '#212529' : '#495057';
            }
        });
    }
    getContent() {
        return this.editor.innerHTML;
    }
    setContent(content) {
        this.editor.innerHTML = content;
        this.updatePlaceholder();
    }
    getTextContent() {
        return this.editor.textContent || '';
    }
    focus() {
        this.editor.focus();
    }
    getElement() {
        return this.container;
    }
    onChange(callback) {
        this.onChangeCallback = callback;
    }
    destroy() {
        this.container.remove();
    }
}
exports.TextEditor = TextEditor;
// Helper function to create a text editor instance
function createTextEditor(options = {}) {
    return new TextEditor(options);
}
