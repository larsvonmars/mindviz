/**
 * Centralized Configuration for MindViz
 *
 * This file contains all container sizing and theme configuration
 * to make it easy to customize and maintain across the application.
 */
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
export declare const DEFAULT_MINDMAP_CONTAINER: ContainerConfig;
export declare const DEFAULT_WHITEBOARD_CONTAINER: ContainerConfig;
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
export declare const THEME_COLORS: Record<ThemeType, ThemeColors>;
declare class ThemeManager {
    private static instance;
    private currentTheme;
    private listeners;
    private constructor();
    static getInstance(): ThemeManager;
    getTheme(): ThemeType;
    setTheme(theme: ThemeType): void;
    toggleTheme(): void;
    subscribe(listener: (theme: ThemeType) => void): () => void;
    private notifyListeners;
    private applyTheme;
}
export declare const themeManager: ThemeManager;
export declare function applyContainerConfig(element: HTMLElement, config?: ContainerConfig): void;
export {};
