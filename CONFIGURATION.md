# Configuration System Documentation

## Overview

MindViz now features a centralized configuration system that makes it easy to customize container sizing and manage themes across the entire application.

**Note:** This library is designed for use in Node.js applications and bundlers (webpack, rollup, etc.). The TypeScript source compiles to CommonJS modules which are not directly importable in browsers without a bundler.

## Container Configuration

### Usage

Instead of hardcoded container sizes, you can now use the `ContainerConfig` interface:

```typescript
import { VisualMindMap, DEFAULT_MINDMAP_CONTAINER, ContainerConfig } from 'mindviz';

// Use default configuration
const vmm = new VisualMindMap(container, mindMap);

// Or customize it
const customConfig: ContainerConfig = {
  width: '100%',
  height: '500px',
  minHeight: '400px',
  maxHeight: '800px',
  borderRadius: '20px',
  resize: 'vertical' // 'both' | 'horizontal' | 'vertical' | 'none'
};

const vmm = new VisualMindMap(container, mindMap, customConfig);
```

### Default Configurations

- **DEFAULT_MINDMAP_CONTAINER**: Default settings for MindMap components
- **DEFAULT_WHITEBOARD_CONTAINER**: Default settings for Whiteboard components

Both default to:
- Width: `100%`
- Height: `600px`
- Min Height: `400px`
- Border Radius: `12px`
- Resize: `both`

## Theme Management

### Overview

The new `ThemeManager` singleton provides centralized theme management with:
- Automatic persistence (localStorage)
- System color scheme detection
- Global theme synchronization
- Easy theme switching

### Usage

```typescript
import { themeManager } from 'mindviz';

// Get current theme
const currentTheme = themeManager.getTheme(); // 'light' | 'dark'

// Toggle theme
themeManager.toggleTheme();

// Set specific theme
themeManager.setTheme('dark');

// Subscribe to theme changes
const unsubscribe = themeManager.subscribe((theme) => {
  console.log('Theme changed to:', theme);
  // Update your UI accordingly
});

// Later, unsubscribe
unsubscribe();
```

### Theme Colors

All theme colors are defined in `config.ts` and automatically applied via CSS custom properties:

```typescript
// Light theme colors
'--mm-container-bg': '#ffffff'
'--mm-text': '#1e293b'
'--mm-primary': '#4dabf7'
// ... and more

// Dark theme colors
'--mm-container-bg': '#0b0d10'
'--mm-text': '#f5f5f5'
'--mm-primary': '#3b82f6'
// ... and more
```

### Features

1. **Persistence**: Theme preference is saved to localStorage
2. **System Preference**: Detects and respects `prefers-color-scheme`
3. **Automatic Updates**: All components using CSS variables automatically update
4. **Event Notifications**: Subscribe to theme changes for custom logic

## Migration Guide

### Before (Old System)

```typescript
// Hardcoded sizes
const container = document.getElementById('container');
container.style.width = '100%';
container.style.height = '800px';

// Manual theme handling
if (theme === 'dark') {
  container.style.backgroundColor = '#0b0d10';
  // ... manually set all colors
}
```

### After (New System)

```typescript
import { VisualMindMap, themeManager, DEFAULT_MINDMAP_CONTAINER } from 'mindviz';

// Centralized configuration
const config = {
  ...DEFAULT_MINDMAP_CONTAINER,
  height: '800px'
};

const vmm = new VisualMindMap(container, mindMap, config);

// Theme is automatically initialized and managed
themeManager.toggleTheme(); // Just toggle!
```

## Benefits

1. **Easier Maintenance**: All configuration in one place
2. **Type Safety**: Full TypeScript support with interfaces
3. **Consistency**: Ensures all components follow the same patterns
4. **Flexibility**: Easy to customize while maintaining defaults
5. **Better UX**: Theme persists across sessions
6. **Clean Code**: Less boilerplate, more readable

## Examples

For usage examples with a bundler (webpack, vite, etc.):

```typescript
// In your application
import { VisualMindMap, MindMap, themeManager, DEFAULT_MINDMAP_CONTAINER } from 'mindviz';

const mindMap = new MindMap();
mindMap.addNode("Root", "Example");

const container = document.getElementById('mindmap-container');
const customConfig = {
  ...DEFAULT_MINDMAP_CONTAINER,
  height: '800px'
};

const vmm = new VisualMindMap(container, mindMap, customConfig);
vmm.render();

// Toggle theme
themeManager.toggleTheme();
```

**Note:** The existing HTML test files in the repository are for demonstration purposes and require a module bundler to work properly with the CommonJS build output.
