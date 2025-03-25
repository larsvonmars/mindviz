
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

For people looking help development:

Clone this repository, then run
```bash
npm i
```

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

The model is defined in [src/mindmap.ts](src/mindmap.ts). Create a new mind map by instantiating a `MindMap` with a root `MindNode`:

```typescript
// Example:
import { MindNode, MindMap } from "./src/mindmap";

const rootNode = new MindNode(1, "Root");
const mindMap = new MindMap(rootNode);

// Add a new node under the root
const newNode = mindMap.addMindNode(1, "Child Node");

// Update a node
mindMap.updateMindNode(newNode.id, "Updated Label", "A brief description");

// Delete a node (except the root)
mindMap.deleteMindNode(newNode.id);

// Export and import as JSON:
const exported = mindMap.toJSON();
mindMap.fromJSON(exported);
```

### Visualizing the Mind Map

The visualization is handled in [src/visualMindmap.ts](src/visualMindmap.ts). Render your mind map by providing an HTML container and the MindMap instance:

```typescript
// Example with plain JavaScript/TypeScript:
import { VisualMindMap } from "./src/visualMindmap";
import { MindNode, MindMap } from "./src/mindmap";

// Assume "container" is a valid HTMLElement
const container = document.getElementById("mindmapContainer") as HTMLElement;
const rootNode = new MindNode(1, "Root");
const mindMap = new MindMap(rootNode);

const visualMindMap = new VisualMindMap(container, mindMap);
visualMindMap.render();
```

#### React Integration

To use in a React application, pass a `ref` of a container DIV to the static method `fromReactRef`:

```typescript
import React, { useRef, useEffect } from "react";
import { VisualMindMap } from "./src/visualMindmap";
import { MindNode, MindMap } from "./src/mindmap";

const MindVizComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      const rootNode = new MindNode(1, "Root");
      const mindMap = new MindMap(rootNode);
      const visualMindMap = VisualMindMap.fromReactRef(containerRef, mindMap);
      visualMindMap.render();
    }
  }, []);
  
  return <div ref={containerRef} style={{ width: "800px", height: "600px" }} />;
};

export default MindVizComponent;
```

## Configuration

- **TypeScript:**  
  The project uses a modern TypeScript setup targeting ES2020. Adjust settings in the `tsconfig.json` file as needed.

- **Dependencies:**  
  Make sure you have Node.js (v14 or newer) installed.

## License

MindViz is released under the ISC License.
```