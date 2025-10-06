/**
 * Centralized Configuration for MindViz
 * 
 * This file contains all container sizing and theme configuration
 * to make it easy to customize and maintain across the application.
 */

// Container Sizing Configuration
export interface ContainerConfig {
  width: string;
  height: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  borderRadius?: string;
  resize?: 'both' | 'horizontal' | 'vertical' | 'none';
}

export const DEFAULT_MINDMAP_CONTAINER: ContainerConfig = {
  width: '100%',
  height: '600px',
  minWidth: '400px',
  minHeight: '400px',
  borderRadius: '12px',
  resize: 'both'
};

export const DEFAULT_WHITEBOARD_CONTAINER: ContainerConfig = {
  width: '100%',
  height: '600px',
  minWidth: '400px',
  minHeight: '400px',
  borderRadius: '12px',
  resize: 'both'
};

// Theme Configuration
export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  '--mm-container-bg': string;
  '--mm-bg': string;
  '--mm-text': string;
  '--mm-node-bg': string;
  '--mm-node-text': string;
  '--mm-node-border-color': string;
  '--mm-description-bg': string;
  '--mm-description-text': string;
  '--mm-primary': string;
  '--mm-primary-hover': string;
  '--mm-primary-light': string;
  '--mm-border': string;
  '--mm-border-light': string;
  '--mm-connection-color': string;
  '--mm-connection-label-bg': string;
  '--mm-connection-label-text': string;
  '--mm-highlight': string;
  '--mm-shadow': string;
  '--mm-toolbar-bg': string;
  '--mm-modal-bg': string;
  '--mm-modal-border': string;
  '--mm-modal-text': string;
  '--mm-primary-dark': string;
  '--mm-border-dark': string;
  '--mm-canvas-bg': string;
  '--mm-input-bg': string;
  '--mm-input-text': string;
  '--mm-input-border': string;
  '--mm-input-focus': string;
  '--mm-overlay-bg': string;
  '--mm-grid-color': string;
  '--mm-grid-major-color': string;
}

export const THEME_COLORS: Record<ThemeType, ThemeColors> = {
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
  private static instance: ThemeManager;
  private currentTheme: ThemeType = 'light';
  private listeners: ((theme: ThemeType) => void)[] = [];

  private constructor() {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('mindviz-theme') as ThemeType;
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

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public getTheme(): ThemeType {
    return this.currentTheme;
  }

  public setTheme(theme: ThemeType): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem('mindviz-theme', theme);
    this.notifyListeners(theme);
  }

  public toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  public subscribe(listener: (theme: ThemeType) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(theme: ThemeType): void {
    this.listeners.forEach(listener => listener(theme));
  }

  private applyTheme(theme: ThemeType): void {
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
export function applyContainerConfig(
  element: HTMLElement, 
  config: ContainerConfig = DEFAULT_MINDMAP_CONTAINER
): void {
  element.style.width = config.width;
  element.style.height = config.height;
  
  if (config.minWidth) element.style.minWidth = config.minWidth;
  if (config.minHeight) element.style.minHeight = config.minHeight;
  if (config.maxWidth) element.style.maxWidth = config.maxWidth;
  if (config.maxHeight) element.style.maxHeight = config.maxHeight;
  if (config.borderRadius) element.style.borderRadius = config.borderRadius;
  if (config.resize) element.style.resize = config.resize;
}
