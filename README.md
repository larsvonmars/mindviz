
# MindViz

MindViz is an interactive mind map visualization tool that lets users dynamically create, edit, delete, and style nodes on an infinite canvas. The core functionality is split into two main parts:

- The **model** layer, represented by the [`MindMap`](src/mindmap.ts) and [`MindNode`](src/mindmap.ts) classes.
- The **visualization** layer, provided by the [`VisualMindMap`](src/visualMindmap.ts) class that renders the mind map to an HTML container, supports freeform dragging, zooming, and exporting as SVG.

## Features

- **Mind Map Model:**  
  - Create, update, and delete nodes.
  - Maintain parent-child relationships and node properties such as background color, description, and expansion state.
  - Export and import the mind map as JSON.

- **Visual Mind Map:**  
  - Render nodes with modern styling on an infinite canvas.
  - Support for radial and tree layouts.
  - Interactive operations including node selection, dragging, freeform repositioning, and zoom controls.
  - Toolbar actions for re-centering the canvas, exporting the map as SVG, clearing nodes, and more.
  - React integration via the static method `VisualMindMap.fromReactRef`.

## Installation

For use in your project:

```bash
npm i mindviz
```

For people looking to help development:

Clone this repository, then run
```bash
npm i
```

## Quickstart

Follow these steps to get MindViz running in a browser-based project:

1. **Install the package** (Node.js ≥ 18 recommended):

    ```bash
    npm install mindviz
    ```

2. **Create a container element** in your HTML. MindViz writes its own toolbar, canvas, and overlays inside this element, so give it a fixed size or let the helper apply defaults:

    ```html
    <div id="mindviz-root"></div>
    ```

3. **Instantiate and render the mind map** in your application code:

    ```typescript
    import {
      MindMap,
      MindNode,
      VisualMindMap,
      applyContainerConfig,
      DEFAULT_MINDMAP_CONTAINER
    } from 'mindviz';

    const container = document.getElementById('mindviz-root')!;

    // Optional: enforce the default responsive sizing
    applyContainerConfig(container, DEFAULT_MINDMAP_CONTAINER);

    const root = new MindNode(1, 'Root topic');
    const mindMap = new MindMap(root);

    const visualMindMap = new VisualMindMap(container, mindMap);
    visualMindMap.render();

    // Clean up if you unmount/remove the container
    window.addEventListener('beforeunload', () => visualMindMap.destroy());
    ```

4. **Respond to UI events or remote updates (optional):**

    ```typescript
    visualMindMap.on('operation', (operation) => {
      // Sync with your backend or collaborators
      console.log('User performed:', operation);
    });

    // Apply operations received from elsewhere
    visualMindMap.applyOperations(remoteOps);
    ```

MindViz ships as an ES module with generated type declarations. It runs in modern browsers, Vite, Next.js, and other NodeNext-compatible bundlers without extra configuration.

## Build

Compile the TypeScript sources and copy declaration files by running:

```bash
npm run build
```

The compiled JavaScript and types will be available in the `dist` folder.

## Run

To start the application (if serving an HTML page) execute:

```bash
npm start
```

Ensure that your HTML page (e.g., `index.html`) is configured to load the compiled JavaScript.

## Testing

MindViz uses Playwright for browser-based tests. To run the tests:

```bash
npm run test
```

The tests currently cover only the underyling mindmap model and base operations.

## Usage

### Using the Mind Map Model

The data model is exported directly from the package entry point. Instantiate a `MindMap` with a unique numeric root `MindNode`, then call the mutator methods to manage your tree:

```typescript
// Example:
import { MindNode, MindMap } from 'mindviz';

const rootNode = new MindNode(1, 'Root');
const mindMap = new MindMap(rootNode);

// Add a new node under the root
const newNode = mindMap.addMindNode(1, 'Child Node');

// Update a node
mindMap.updateMindNode(newNode.id, 'Updated Label', 'A brief description');

// Delete a node (except the root)
mindMap.deleteMindNode(newNode.id);

// Export and import as JSON (persist to storage or sync across clients)
const exported = mindMap.toJSON();
mindMap.fromJSON(exported);
```

### Visualizing the Mind Map

Render the model with `VisualMindMap`. The constructor automatically wires up the toolbar, zoom controls, theme manager, and canvas interactions:

```typescript
// Example with plain JavaScript/TypeScript:
import { VisualMindMap, MindNode, MindMap, themeManager } from 'mindviz';

// Assume "container" is a valid HTMLElement
const container = document.getElementById("mindmapContainer") as HTMLElement;
const rootNode = new MindNode(1, "Root");
const mindMap = new MindMap(rootNode);

const visualMindMap = new VisualMindMap(container, mindMap);
visualMindMap.render();

// Toggle the built-in themes at runtime
themeManager.setTheme('dark');

// Tear down listeners, canvases, and toolbars when you are done
visualMindMap.destroy();
```

#### React Integration

To use in a React application, pass a `ref` of a container DIV to the static method `fromReactRef`:

```typescript
import React, { useRef, useEffect } from "react";
import { VisualMindMap, MindNode, MindMap } from 'mindviz';

const MindVizComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      const rootNode = new MindNode(1, "Root");
      const mindMap = new MindMap(rootNode);
      const visualMindMap = VisualMindMap.fromReactRef(containerRef, mindMap);
      visualMindMap.render();

      return () => visualMindMap.destroy();
    }
  }, []);
  
  return <div ref={containerRef} style={{ width: "800px", height: "600px" }} />;
};

export default MindVizComponent;
```

## Programmatic Editing & AI Integration

MindViz exposes helper methods for automated tools or AI assistants to modify a
map without direct user interaction. Use the public APIs on `MindMap` and
`VisualMindMap` to inspect and mutate nodes:

```typescript
// Access all nodes
const nodes = visualMindMap.getAllNodes();

// Update multiple properties on a node
mindMap.updateMindNodeProperties(1, {
  label: "New label",
  description: "Generated by AI"
});

// Apply a batch of operations generated elsewhere
visualMindMap.applyOperations([
  { type: 'node_add', parentId: 1, label: 'AI Node', nodeId: 99 },
  { type: 'node_props', nodeId: 99, props: { background: '#ff0' } }
]);
```

### Vercel AI SDK Helpers

MindViz includes convenience functions backed by Vercel's [AI SDK](https://ai-sdk.dev)
to quickly integrate generative features. Set `OPENAI_API_KEY` in your environment
before using the helpers (for example, `export OPENAI_API_KEY=sk-...` on macOS/Linux).
You can also choose your own provider and model:

```typescript
import { summarizeMindMap, generateOperations } from 'mindviz';

const summary = await summarizeMindMap(mindMap);
console.log(summary);

const ops = await generateOperations('Add a node about project goals');
visualMindMap.applyOperations(ops);
```

By default the helpers use `openai('gpt-4o')`. Pass options to select any
provider supported by the AI SDK:

```typescript
import { anthropic } from '@ai-sdk/anthropic';

const summary = await summarizeMindMap(mindMap, {
  provider: anthropic,
  model: 'claude-3-opus-20240229'
});
```

### Event Stream and Remote Collaboration

- Subscribe to user actions with `visualMindMap.on('operation', handler)`.
- Replay operations from other clients with `visualMindMap.applyOperations(ops)`.
- Synchronize raw data by passing `mindMap.toJSON()` through your backend and
  restoring it with `mindMap.fromJSON(json)` before calling `visualMindMap.render()`.

## Configuration

- **TypeScript:**  
  The project uses a modern TypeScript setup targeting ES2020. Adjust settings in the `tsconfig.json` file as needed.

- **Dependencies:**  
  Make sure you have Node.js (v14 or newer) installed.

## License

MindViz is released under the ISC License.
