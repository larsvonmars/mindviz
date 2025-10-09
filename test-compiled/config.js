/**
 * Centralized Configuration for MindViz
 *
 * This file contains all container sizing and theme configuration
 * to make it easy to customize and maintain across the application.
 */
export const DEFAULT_MINDMAP_CONTAINER = {
    width: '100%',
    height: '600px',
    minWidth: '400px',
    minHeight: '400px',
    borderRadius: '12px',
    resize: 'both'
};
export const DEFAULT_WHITEBOARD_CONTAINER = {
    width: '100%',
    height: '600px',
    minWidth: '400px',
    minHeight: '400px',
    borderRadius: '12px',
    resize: 'both'
};
export const THEME_COLORS = {
    light: {
        '--mm-container-bg': '#ffffff',
        '--mm-bg': '#f8fafc',
        '--mm-text': '#1e293b',
        '--mm-node-bg': '#ffffff',
        '--mm-node-text': '#000000',
        '--mm-node-border-color': '#e2e8f0',
        '--mm-description-bg': '#f8fafc',
        '--mm-description-text': '#64748b',
        '--mm-primary': '#4dabf7',
        '--mm-primary-hover': '#339af7',
        '--mm-primary-light': 'rgba(77, 171, 247, 0.1)',
        '--mm-border': '#e2e8f0',
        '--mm-border-light': '#f1f5f9',
        '--mm-connection-color': '#cbd5e1',
        '--mm-connection-label-bg': 'rgba(255, 255, 255, 0.9)',
        '--mm-connection-label-text': '#1e293b',
        '--mm-highlight': '#4dabf7',
        '--mm-shadow': 'rgba(0, 0, 0, 0.1)',
        '--mm-toolbar-bg': 'rgba(248, 250, 252, 0.95)',
        '--mm-modal-bg': '#ffffff',
        '--mm-modal-border': '#e2e8f0',
        '--mm-modal-text': '#1e293b',
        '--mm-primary-dark': '#1e40af',
        '--mm-border-dark': '#94a3b8',
        '--mm-canvas-bg': 'transparent',
        '--mm-input-bg': '#ffffff',
        '--mm-input-text': '#1e293b',
        '--mm-input-border': '#e2e8f0',
        '--mm-input-focus': '#4dabf7',
        '--mm-overlay-bg': 'rgba(0, 0, 0, 0.6)',
        '--mm-grid-color': 'rgba(200, 200, 200, 0.3)',
        '--mm-grid-major-color': 'rgba(150, 150, 150, 0.5)',
    },
    dark: {
        '--mm-container-bg': '#0b0d10',
        '--mm-bg': '#12171f',
        '--mm-text': '#f5f5f5',
        '--mm-node-bg': '#1a1f2e',
        '--mm-node-text': '#ffffff',
        '--mm-node-border-color': '#2d333b',
        '--mm-description-bg': '#12171f',
        '--mm-description-text': '#d1d5db',
        '--mm-primary': '#3b82f6',
        '--mm-primary-hover': '#2563eb',
        '--mm-primary-light': 'rgba(59, 130, 246, 0.15)',
        '--mm-border': '#2d333b',
        '--mm-border-light': '#374151',
        '--mm-connection-color': '#475569',
        '--mm-connection-label-bg': 'rgba(0, 0, 0, 0.7)',
        '--mm-connection-label-text': '#f5f5f5',
        '--mm-highlight': '#3b82f6',
        '--mm-shadow': 'rgba(0, 0, 0, 0.6)',
        '--mm-toolbar-bg': 'rgba(17, 24, 39, 0.95)',
        '--mm-modal-bg': '#1c2128',
        '--mm-modal-border': '#2d333b',
        '--mm-modal-text': '#f5f5f5',
        '--mm-primary-dark': '#1e40af',
        '--mm-border-dark': '#5e5e5e',
        '--mm-canvas-bg': 'transparent',
        '--mm-input-bg': '#1a1f2e',
        '--mm-input-text': '#f5f5f5',
        '--mm-input-border': '#2d333b',
        '--mm-input-focus': '#3b82f6',
        '--mm-overlay-bg': 'rgba(0, 0, 0, 0.8)',
        '--mm-grid-color': 'rgba(100, 100, 100, 0.2)',
        '--mm-grid-major-color': 'rgba(150, 150, 150, 0.3)',
    }
};
// Theme Manager - Singleton to manage theme state across the application
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.listeners = [];
        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem('mindviz-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(this.currentTheme);
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('mindviz-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    static getInstance() {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }
    getTheme() {
        return this.currentTheme;
    }
    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        localStorage.setItem('mindviz-theme', theme);
        this.notifyListeners(theme);
    }
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    subscribe(listener) {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    notifyListeners(theme) {
        this.listeners.forEach(listener => listener(theme));
    }
    applyTheme(theme) {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        const themeColors = THEME_COLORS[theme];
        for (const [property, value] of Object.entries(themeColors)) {
            root.style.setProperty(property, value);
        }
    }
}
// Export singleton instance
export const themeManager = ThemeManager.getInstance();
// Helper function to apply container config to an element
export function applyContainerConfig(element, config = DEFAULT_MINDMAP_CONTAINER) {
    element.style.width = config.width;
    element.style.height = config.height;
    if (config.minWidth)
        element.style.minWidth = config.minWidth;
    if (config.minHeight)
        element.style.minHeight = config.minHeight;
    if (config.maxWidth)
        element.style.maxWidth = config.maxWidth;
    if (config.maxHeight)
        element.style.maxHeight = config.maxHeight;
    if (config.borderRadius)
        element.style.borderRadius = config.borderRadius;
    if (config.resize)
        element.style.resize = config.resize;
}
