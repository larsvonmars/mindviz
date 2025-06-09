/**
 * Visual Whiteboard - Complete Overhaul 2025
 * ===========================================
 * A modern, fully-featured whiteboard implementation with:
 * • Smooth pan/zoom with proper coordinate transformation
 * • Multi-selection with selection rectangle
 * • Advanced drawing tools (pen, shapes, arrows)
 * • Proper event handling and state management
 * • Modern UI with animations and hover effects
 * • Undo/redo with command pattern
 * • Real-time collaboration ready
 */

export * from "./whiteboard";

import { Whiteboard, WhiteboardItem } from "./whiteboard";
import { createWhiteboardToolbar } from "./ToolbarWhiteboard";
import { showInputModal } from "./Modal";
import { createContextMenu } from "./ContextMenuWhiteboard";

export interface VisualOptions {
  gridSize?: number;
  snap?: boolean;
  background?: string;
  accentColor?: string;
  showGrid?: boolean;
  enablePanning?: boolean;
  enableZooming?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export class VisualWhiteboard {
  public readonly board: Whiteboard;
  public readonly container: HTMLElement;
  private canvas!: HTMLDivElement;
  private svgOverlay!: SVGSVGElement;
  private readonly toolbar: HTMLElement;
  private readonly contextMenu: HTMLElement;

  // Viewport state
  private viewport: ViewportState = { zoom: 1, panX: 0, panY: 0 };
  private options: Required<VisualOptions>;

  // Selection state
  private selectedItemsSet = new Set<number>();
  private selectionBox: HTMLDivElement | null = null;
  private selectionRect: HTMLDivElement | null = null;

  // Drawing state
  private drawingMode: 'select' | 'pen' | 'rect' | 'circle' | 'line' | 'arrow' | null = 'select';
  private currentPath: SVGPathElement | null = null;
  private drawingData: Point[] = [];
  private isDrawing = false;
  private drawStartPoint: Point | null = null;

  // Interaction state
  private isDragging = false;
  private isPanning = false;
  private isSelecting = false;
  private dragStartPoint: Point | null = null;
  private draggedItems = new Map<number, Point>();

  // Element management
  private itemElements = new Map<number, HTMLDivElement>();

  // Resize state
  private isResizing = false;
  private activeResizeItemInitialState: { id: number, x: number, y: number, width: number, height: number } | null = null;
  private resizeStartPoint: Point | null = null;
  private activeResizeHandleType: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null = null; // South-East, East, South

  constructor(container: HTMLElement, board: Whiteboard, options: VisualOptions = {}) {
    this.container = container;
    this.board = board;
    
    // Setup options with defaults
    this.options = {
      gridSize: options.gridSize ?? 20,
      snap: options.snap ?? true,
      background: options.background ?? '#fafafa',
      accentColor: options.accentColor ?? '#4f46e5',
      showGrid: options.showGrid ?? true,
      enablePanning: options.enablePanning ?? true,
      enableZooming: options.enableZooming ?? true,
    };

    this.initializeContainer();
    this.createCanvas();
    this.createSVGOverlay();
    this.toolbar = createWhiteboardToolbar(this);
    this.contextMenu = createContextMenu(this);
    
    this.container.appendChild(this.toolbar);
    this.container.appendChild(this.canvas);
    this.container.appendChild(this.contextMenu);

    this.setupEventListeners();
    this.injectStyles();
    this.render();

    // Setup board event listeners
    this.board.on('item:add', (item) => this.handleItemAdd(item));
    this.board.on('item:update', (item) => this.handleItemUpdate(item));
    this.board.on('item:delete', (item) => this.handleItemDelete(item));
    this.board.on('board:load', () => this.render());
  }

  private initializeContainer(): void {
    this.container.classList.add('wb-container');
    Object.assign(this.container.style, {
      position: 'relative',
      width: '100%',
      height: '100%', // Changed from 600px
      backgroundColor: this.options.background,
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      userSelect: 'none',
      touchAction: 'none',
    });
  }

  private createCanvas(): void {
    this.canvas = document.createElement('div');
    this.canvas.classList.add('wb-canvas');
    Object.assign(this.canvas.style, {
      position: 'absolute',
      top: '60px', // toolbar height
      left: '0',
      right: '0',
      bottom: '0',
      transformOrigin: '0 0',
      cursor: 'grab',
    });

    if (this.options.showGrid) {
      this.drawGrid();
    }
  }

  private createSVGOverlay(): void {
    this.svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    Object.assign(this.svgOverlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1000',
    });

    // Add arrow marker definitions
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="wb-arrow" viewBox="0 0 10 10" refX="10" refY="5" 
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="${this.options.accentColor}"/>
      </marker>
    `;
    this.svgOverlay.appendChild(defs);
    this.canvas.appendChild(this.svgOverlay);
  }

  private drawGrid(): void {
    const size = this.options.gridSize;
    this.canvas.style.backgroundImage = `
      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
    `;
    this.canvas.style.backgroundSize = `${size}px ${size}px`;
  }

  private setupEventListeners(): void {
    // Prevent context menu
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse events
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));

    // Zoom with wheel
    if (this.options.enableZooming) {
      this.container.addEventListener('wheel', this.handleWheel.bind(this));
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Resize observer
    const resizeObserver = new ResizeObserver(() => this.updateViewport());
    resizeObserver.observe(this.container);
  }

  private handlePointerDown(e: PointerEvent): void {
    e.preventDefault();
    const point = this.screenToCanvas(e.clientX, e.clientY);
    const target = e.target as HTMLElement;

    // Check if clicking on a resize handle
    const resizeHandle = target.closest('.wb-resize-handle') as HTMLElement;
    if (resizeHandle) {
      const itemElement = resizeHandle.closest('.wb-item') as HTMLDivElement;
      if (itemElement) {
        const itemId = parseInt(itemElement.dataset.id!);
        const item = this.board.find(itemId);
        if (item) {
          this.startResize(e, item, resizeHandle.dataset.handleType as typeof this.activeResizeHandleType, point);
          this.canvas.setPointerCapture(e.pointerId);
          return;
        }
      }
    }

    // Check if clicking on an item
    const itemElement = target.closest('.wb-item') as HTMLDivElement;

    if (this.drawingMode !== 'select') {
      this.startDrawing(point);
      return;
    }

    if (itemElement) {
      this.handleItemPointerDown(e, itemElement, point);
    } else {
      this.handleCanvasPointerDown(e, point);
    }

    this.canvas.setPointerCapture(e.pointerId);
  }

  private handlePointerMove(e: PointerEvent): void {
    const point = this.screenToCanvas(e.clientX, e.clientY);

    if (this.isResizing && this.activeResizeItemInitialState && this.resizeStartPoint) {
      this.updateResize(point);
    } else if (this.isDrawing && this.drawingMode !== 'select') {
      this.updateDrawing(point);
    } else if (this.isDragging) {
      this.updateDrag(point);
    } else if (this.isPanning) {
      this.updatePan(e.clientX, e.clientY);
    } else if (this.isSelecting) {
      this.updateSelection(point);
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    const point = this.screenToCanvas(e.clientX, e.clientY); // Capture final point
    if (this.isResizing) {
      this.finishResize();
    } else if (this.isDrawing && this.drawingMode !== 'select') {
      this.finishDrawing(point); // Pass final point to finishDrawing
    } else if (this.isDragging) {
      this.finishDrag();
    } else if (this.isPanning) {
      this.finishPan();
    } else if (this.isSelecting) {
      this.finishSelection();
    }

    this.canvas.releasePointerCapture(e.pointerId);
  }

  private handleItemPointerDown(e: PointerEvent, itemElement: HTMLDivElement, point: Point): void {
    const itemId = parseInt(itemElement.dataset.id!);
    
    if (!this.selectedItemsSet.has(itemId) && !e.shiftKey) {
      this.clearSelection();
    }
    
    this.selectedItemsSet.add(itemId);
    this.updateSelectionDisplay();

    // Start dragging
    this.isDragging = true;
    this.dragStartPoint = point;
    
    // Store initial positions of all selected items
    this.draggedItems.clear();
    for (const id of this.selectedItems) {
      const item = this.board.find(id);
      if (item) {
        this.draggedItems.set(id, { x: item.x, y: item.y });
      }
    }

    this.canvas.style.cursor = 'grabbing';
  }

  private handleCanvasPointerDown(e: PointerEvent, point: Point): void {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+click for panning
      this.isPanning = true;
      this.dragStartPoint = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
    } else {
      // Start selection rectangle
      if (!e.shiftKey) {
        this.clearSelection();
      }
      this.isSelecting = true;
      this.dragStartPoint = point;
      this.createSelectionRect(point);
    }
  }

  private startDrawing(point: Point): void {
    this.isDrawing = true;
    this.drawStartPoint = point;
    this.drawingData = [point];

    // Create temporary drawing element
    const svg = this.svgOverlay;
    
    switch (this.drawingMode) {
      case 'pen':
        this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        if (this.currentPath) {
          this.currentPath.setAttribute('d', `M ${point.x} ${point.y}`);
          this.currentPath.setAttribute('stroke', this.options.accentColor);
          this.currentPath.setAttribute('stroke-width', '2');
          this.currentPath.setAttribute('fill', 'none');
          this.currentPath.setAttribute('stroke-linecap', 'round');
          svg.appendChild(this.currentPath);
        }
        break;
        
      case 'rect':
        this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as any;
        if (this.currentPath) {
          this.currentPath.setAttribute('stroke', this.options.accentColor);
          this.currentPath.setAttribute('stroke-width', '2');
          this.currentPath.setAttribute('fill', 'none');
          svg.appendChild(this.currentPath);
        }
        break;
        
      case 'circle':
        this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse') as any;
        if (this.currentPath) {
          this.currentPath.setAttribute('stroke', this.options.accentColor);
          this.currentPath.setAttribute('stroke-width', '2');
          this.currentPath.setAttribute('fill', 'none');
          svg.appendChild(this.currentPath);
        }
        break;
        
      case 'line':
      case 'arrow':
        this.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'line') as any;
        if (this.currentPath) {
          this.currentPath.setAttribute('stroke', this.options.accentColor);
          this.currentPath.setAttribute('stroke-width', '2');
          this.currentPath.setAttribute('x1', point.x.toString());
          this.currentPath.setAttribute('y1', point.y.toString());
          this.currentPath.setAttribute('x2', point.x.toString());
          this.currentPath.setAttribute('y2', point.y.toString());
          if (this.drawingMode === 'arrow') {
            this.currentPath.setAttribute('marker-end', 'url(#wb-arrow)');
          }
          svg.appendChild(this.currentPath);
        }
        break;
    }

    this.svgOverlay.style.pointerEvents = 'auto';
  }

  private updateDrawing(point: Point): void {
    if (!this.currentPath || !this.drawStartPoint) return;

    switch (this.drawingMode) {
      case 'pen':
        this.drawingData.push(point);
        const path = this.buildSmoothPath(this.drawingData);
        this.currentPath.setAttribute('d', path);
        break;
        
      case 'rect':
        const rect = this.currentPath as any as SVGRectElement;
        const x = Math.min(this.drawStartPoint.x, point.x);
        const y = Math.min(this.drawStartPoint.y, point.y);
        const width = Math.abs(point.x - this.drawStartPoint.x);
        const height = Math.abs(point.y - this.drawStartPoint.y);
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', y.toString());
        rect.setAttribute('width', width.toString());
        rect.setAttribute('height', height.toString());
        break;
        
      case 'circle':
        const ellipse = this.currentPath as any as SVGEllipseElement;
        const cx = (this.drawStartPoint.x + point.x) / 2;
        const cy = (this.drawStartPoint.y + point.y) / 2;
        const rx = Math.abs(point.x - this.drawStartPoint.x) / 2;
        const ry = Math.abs(point.y - this.drawStartPoint.y) / 2;
        ellipse.setAttribute('cx', cx.toString());
        ellipse.setAttribute('cy', cy.toString());
        ellipse.setAttribute('rx', rx.toString());
        ellipse.setAttribute('ry', ry.toString());
        break;
        
      case 'line':
      case 'arrow':
        const line = this.currentPath as any as SVGLineElement;
        line.setAttribute('x2', point.x.toString());
        line.setAttribute('y2', point.y.toString());
        break;
    }
  }

  private finishDrawing(finalPoint: Point): void { // Added finalPoint parameter
    if (!this.currentPath || !this.drawStartPoint) return;

    let geomBounds: { x: number; y: number; width: number; height: number };

    if (this.drawingMode === 'pen') {
      geomBounds = this.calculatePenBounds();
    } else {
      // For shapes, use drawStartPoint and the passed finalPoint
      const minX = Math.min(this.drawStartPoint.x, finalPoint.x);
      const minY = Math.min(this.drawStartPoint.y, finalPoint.y);
      const maxX = Math.max(this.drawStartPoint.x, finalPoint.x);
      const maxY = Math.max(this.drawStartPoint.y, finalPoint.y);
      geomBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    let pathData = '';
    let itemWidth: number;
    let itemHeight: number;

    // Ensure minimum dimensions for visibility
    const minPenSize = 2; // Min size for a pen mark (e.g., a dot)
    const minShapeSize = 5; // Min size for other shapes

    switch (this.drawingMode) {
      case 'pen':
        itemWidth = Math.max(geomBounds.width, geomBounds.width === 0 ? minPenSize : 0);
        itemHeight = Math.max(geomBounds.height, geomBounds.height === 0 ? minPenSize : 0);
        // If it's effectively a dot (zero width/height from calculatePenBounds but drawingData has one point)
        if (geomBounds.width === 0 && geomBounds.height === 0 && this.drawingData.length === 1) {
          pathData = 'M0 0 L0.1 0.1'; // A tiny path for a dot, relative to item's origin
          // The item's x,y will be the dot's position, width/height will be minPenSize
        } else {
          pathData = this.buildSmoothPath(this.relativePoints(this.drawingData, geomBounds));
        }
        break;
      case 'rect':
        itemWidth = Math.max(geomBounds.width, minShapeSize);
        itemHeight = Math.max(geomBounds.height, minShapeSize);
        pathData = `M0 0 H${itemWidth} V${itemHeight} H0 Z`;
        break;
      case 'circle':
        itemWidth = Math.max(geomBounds.width, minShapeSize);
        itemHeight = Math.max(geomBounds.height, minShapeSize);
        const rx = itemWidth / 2;
        const ry = itemHeight / 2;
        // Ensure rx and ry are not zero to avoid invalid A command
        pathData = (rx <= 0 || ry <= 0) ? 'M0 0' : `M ${rx} 0 A ${rx} ${ry} 0 1 0 ${rx} ${itemHeight} A ${rx} ${ry} 0 1 0 ${rx} 0`;
        break;
      case 'line':
      case 'arrow':
        itemWidth = Math.max(geomBounds.width, minShapeSize); // Even for lines, width/height represent the bounding box
        itemHeight = Math.max(geomBounds.height, minShapeSize);
        // Path is from top-left (0,0) to bottom-right (width, height) of the bounding box
        pathData = (itemWidth < 0.1 && itemHeight < 0.1) ? 'M0 0' : `M0 0 L${itemWidth} ${itemHeight}`;
        break;
      default: // Should not happen
        this.isDrawing = false;
        this.drawStartPoint = null;
        if (this.currentPath && this.svgOverlay.contains(this.currentPath)) {
            this.svgOverlay.removeChild(this.currentPath);
        }
        this.currentPath = null;
        this.svgOverlay.style.pointerEvents = 'none';
        this.setDrawingMode('select');
        return;
    }

    // Add item to whiteboard
    this.board.addItem({
      type: 'shape',
      x: geomBounds.x,
      y: geomBounds.y,
      width: itemWidth,
      height: itemHeight,
      content: pathData,
      // Consider adding fill/stroke properties if they vary from defaults
    });

    // Cleanup
    if (this.currentPath && this.svgOverlay.contains(this.currentPath)) {
        this.svgOverlay.removeChild(this.currentPath);
    }
    this.currentPath = null;
    this.drawingData = [];
    this.isDrawing = false;
    this.drawStartPoint = null;
    this.svgOverlay.style.pointerEvents = 'none';
    
    // Return to select mode
    this.setDrawingMode('select');
  }

  private calculatePenBounds(): { x: number; y: number; width: number; height: number } {
    if (this.drawingData.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    
    // If only one point (a dot), position it there with zero width/height initially
    // The finishDrawing method will ensure a minimum visible size.
    if (this.drawingData.length === 1) return { x: this.drawingData[0].x, y: this.drawingData[0].y, width: 0, height: 0 };

    const xs = this.drawingData.map(p => p.x);
    const ys = this.drawingData.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  private relativePoints(points: Point[], bounds: { x: number; y: number }): Point[] {
    return points.map(p => ({ x: p.x - bounds.x, y: p.y - bounds.y }));
  }

  private buildSmoothPath(points: Point[]): string {
    if (points.length < 2) return '';
    if (points.length === 2) return `M${points[0].x} ${points[0].y} L${points[1].x} ${points[1].y}`;

    let path = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q${points[i].x} ${points[i].y} ${xc} ${yc}`;
    }
    path += ` T${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return path;
  }

  private updateDrag(point: Point): void {
    if (!this.dragStartPoint) return;

    const dx = point.x - this.dragStartPoint.x;
    const dy = point.y - this.dragStartPoint.y;

    for (const [id, initialPos] of this.draggedItems) {
      const newX = initialPos.x + dx;
      const newY = initialPos.y + dy;
      
      // Apply snapping if enabled
      const finalX = this.options.snap 
        ? Math.round(newX / this.options.gridSize) * this.options.gridSize 
        : newX;
      const finalY = this.options.snap 
        ? Math.round(newY / this.options.gridSize) * this.options.gridSize 
        : newY;

      this.board.updateItem(id, { x: finalX, y: finalY });
    }
  }

  private finishDrag(): void {
    this.isDragging = false;
    this.dragStartPoint = null;
    this.draggedItems.clear();
    this.canvas.style.cursor = 'grab';
  }

  private updatePan(clientX: number, clientY: number): void {
    if (!this.dragStartPoint) return;

    const dx = clientX - this.dragStartPoint.x;
    const dy = clientY - this.dragStartPoint.y;

    this.viewport.panX += dx;
    this.viewport.panY += dy;

    this.dragStartPoint = { x: clientX, y: clientY };
    this.updateViewport();
  }

  private finishPan(): void {
    this.isPanning = false;
    this.dragStartPoint = null;
    this.canvas.style.cursor = 'grab';
  }

  private createSelectionRect(startPoint: Point): void {
    this.selectionRect = document.createElement('div');
    Object.assign(this.selectionRect.style, {
      position: 'absolute',
      border: `2px dashed ${this.options.accentColor}`,
      backgroundColor: `${this.options.accentColor}20`,
      pointerEvents: 'none',
      zIndex: '999',
      left: `${startPoint.x}px`,
      top: `${startPoint.y}px`,
      width: '0px',
      height: '0px',
    });
    this.canvas.appendChild(this.selectionRect);
  }

  private updateSelection(point: Point): void {
    if (!this.selectionRect || !this.dragStartPoint) return;

    const x = Math.min(this.dragStartPoint.x, point.x);
    const y = Math.min(this.dragStartPoint.y, point.y);
    const width = Math.abs(point.x - this.dragStartPoint.x);
    const height = Math.abs(point.y - this.dragStartPoint.y);

    Object.assign(this.selectionRect.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
    });

    // Update selected items
    this.selectedItemsSet.clear();
    for (const item of this.board.items) {
      if (this.isItemInRect(item, { x, y, width, height })) {
        this.selectedItemsSet.add(item.id);
      }
    }
    this.updateSelectionDisplay();
  }

  private finishSelection(): void {
    this.isSelecting = false;
    this.dragStartPoint = null;
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = null;
    }
  }

  private isItemInRect(item: WhiteboardItem, rect: { x: number; y: number; width: number; height: number }): boolean {
    return item.x < rect.x + rect.width &&
           item.x + item.width > rect.x &&
           item.y < rect.y + rect.height &&
           item.y + item.height > rect.y;
  }

  private handleWheel(e: WheelEvent): void {
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(5, this.viewport.zoom * scaleFactor));
    
    // Zoom towards mouse position
    const zoomRatio = newZoom / this.viewport.zoom;
    this.viewport.panX = mouseX - (mouseX - this.viewport.panX) * zoomRatio;
    this.viewport.panY = mouseY - (mouseY - this.viewport.panY) * zoomRatio;
    this.viewport.zoom = newZoom;
    
    this.updateViewport();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        this.board.redo();
      } else {
        this.board.undo();
      }
    }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteSelectedItems();
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      this.clearSelection();
      this.setDrawingMode('select');
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      this.selectAll();
    }
  }

  private screenToCanvas(screenX: number, screenY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    const x = (screenX - rect.left - this.viewport.panX) / this.viewport.zoom;
    const y = (screenY - rect.top - this.viewport.panY) / this.viewport.zoom;
    return { x, y };
  }

  public screenToWorld(screenPoint: Point): Point {
    return this.screenToCanvas(screenPoint.x, screenPoint.y);
  }

  public getItemAt(x: number, y: number): WhiteboardItem | null {
    // Find item at position (iterate in reverse z-order)
    const items = [...this.board.items].sort((a, b) => (b.z || 0) - (a.z || 0));
    for (const item of items) {
      if (x >= item.x && x <= item.x + item.width &&
          y >= item.y && y <= item.y + item.height) {
        return item;
      }
    }
    return null;
  }

  private updateViewport(): void {
    const transform = `translate(${this.viewport.panX}px, ${this.viewport.panY}px) scale(${this.viewport.zoom})`;
    this.canvas.style.transform = transform;
    
    // Update resize handles to maintain constant size
    this.canvas.querySelectorAll('.wb-resize-handle').forEach(handle => { // Corrected class selector
      (handle as HTMLElement).style.transform = `scale(${1 / this.viewport.zoom})`;
    });
  }

  private clearSelection(): void {
    this.selectedItemsSet.clear();
    this.updateSelectionDisplay();
  }

  private selectAll(): void {
    this.selectedItemsSet.clear();
    for (const item of this.board.items) {
      this.selectedItemsSet.add(item.id);
    }
    this.updateSelectionDisplay();
  }

  private deleteSelectedItems(): void {
    for (const id of this.selectedItems) {
      this.board.deleteItem(id);
    }
    this.clearSelection();
  }

  private updateSelectionDisplay(): void {
    // Remove old selection box
    if (this.selectionBox) {
      this.selectionBox.remove();
      this.selectionBox = null;
    }

    // Update item visual states
    for (const [id, element] of this.itemElements) {
      if (this.selectedItemsSet.has(id)) {
        element.classList.add('wb-selected');
      } else {
        element.classList.remove('wb-selected');
      }
    }

    // Create selection box for multiple items
    if (this.selectedItemsSet.size > 1) {
      const items = Array.from(this.selectedItems)
        .map(id => this.board.find(id))
        .filter(Boolean) as WhiteboardItem[];

      if (items.length > 0) {
        const bounds = this.calculateSelectionBounds(items);
        this.createSelectionBox(bounds);
      }
    }
  }

  private calculateSelectionBounds(items: WhiteboardItem[]): { x: number; y: number; width: number; height: number } {
    const xs = items.map(item => item.x);
    const ys = items.map(item => item.y);
    const x2s = items.map(item => item.x + item.width);
    const y2s = items.map(item => item.y + item.height);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...x2s);
    const maxY = Math.max(...y2s);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private createSelectionBox(bounds: { x: number; y: number; width: number; height: number }): void {
    this.selectionBox = document.createElement('div');
    Object.assign(this.selectionBox.style, {
      position: 'absolute',
      left: `${bounds.x}px`,
      top: `${bounds.y}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      border: `2px dashed ${this.options.accentColor}`,
      pointerEvents: 'none',
      borderRadius: '4px',
      zIndex: '998',
    });
    this.canvas.appendChild(this.selectionBox);
  }

  // Item management
  private handleItemAdd(item: WhiteboardItem): void {
    this.createItemElement(item);
  }

  private handleItemUpdate(item: WhiteboardItem): void {
    const element = this.itemElements.get(item.id);
    if (element) {
      this.updateItemElement(element, item);
    }
  }

  private handleItemDelete(item: WhiteboardItem): void {
    const element = this.itemElements.get(item.id);
    if (element) {
      element.remove();
      this.itemElements.delete(item.id);
    }
    this.selectedItemsSet.delete(item.id);
    this.updateSelectionDisplay();
  }

  private createItemElement(item: WhiteboardItem): void {
    const element = document.createElement('div');
    element.classList.add('wb-item');
    element.dataset.id = item.id.toString();

    this.updateItemElement(element, item);
    this.setupItemInteractions(element, item);

    this.canvas.appendChild(element);
    this.itemElements.set(item.id, element);
  }

  private updateItemElement(element: HTMLDivElement, item: WhiteboardItem): void {
    // Apply base styles
    Object.assign(element.style, {
      position: 'absolute',
      left: `${item.x}px`,
      top: `${item.y}px`,
      width: `${item.width}px`,
      height: `${item.height}px`,
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      backgroundColor: item.type === 'text' ? (item.metadata?.color || '#ffffa0') : '#ffffff', // Use metadata for color
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      cursor: 'grab',
      transition: 'box-shadow 0.2s ease',
      zIndex: (item.z || 0).toString(),
      opacity: (item.opacity || 1).toString(),
      transform: `rotate(${item.rotation || 0}deg)`,
      display: 'flex', // For text item content alignment
      flexDirection: 'column', // For text item content alignment
    });

    // Clear content
    element.innerHTML = ''; // Clear previous content and handles

    // Render content based on type
    switch (item.type) {
      case 'text':
        this.renderTextItem(element, item);
        break;
      case 'image':
        // this.renderImageItem(element, item); // Assuming you have this
        break;
      case 'shape':
        // this.renderShapeItem(element, item); // Assuming you have this
        break;
      default:
        // Default rendering or placeholder
        const placeholder = document.createElement('div');
        placeholder.textContent = `Item ID: ${item.id} (type: ${item.type})`;
        placeholder.style.padding = '10px';
        element.appendChild(placeholder);
        break;
    }

    // Add resize handle if the item is selected and resizable
    // For simplicity, let's always add it for now if it's a certain type, or if selected
    if (this.selectedItemsSet.has(item.id) && (item.type === 'text' || item.type === 'image' || item.type === 'shape')) {
         this.addResizeHandle(element, item);
    }
  }

  private renderTextItem(element: HTMLDivElement, item: WhiteboardItem): void {
    const textContentDiv = document.createElement('div');
    textContentDiv.classList.add('wb-text-content');
    textContentDiv.contentEditable = 'true';
    textContentDiv.style.width = '100%';
    textContentDiv.style.height = '100%';
    textContentDiv.style.minHeight = '20px'; // Minimum height for usability
    textContentDiv.style.padding = '8px';
    textContentDiv.style.boxSizing = 'border-box';
    textContentDiv.style.outline = 'none';
    textContentDiv.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and newlines
    textContentDiv.style.wordBreak = 'break-word'; // Break words to prevent overflow
    textContentDiv.textContent = String(item.content || '');
    element.appendChild(textContentDiv);

    textContentDiv.addEventListener('focus', () => {
        this.canvas.style.cursor = 'text'; // Indicate text editing
    });

    textContentDiv.addEventListener('blur', () => {
        this.canvas.style.cursor = 'grab';
        const newContent = textContentDiv.textContent || '';
        if (item.content !== newContent) {
            this.board.updateItem(item.id, { content: newContent });
        }
    });
    
    textContentDiv.addEventListener('input', () => {
      const newContent = textContentDiv.textContent || '';
      // Update content immediately for responsiveness, but auto-resize might be better on blur or a slight delay
      // For now, let's update content and rely on explicit resize or a future auto-resize enhancement
      if (item.content !== newContent) {
         this.board.updateItem(item.id, { content: newContent }); // Corrected: Removed third argument
      }
      this.autoResizeTextItem(element, item, textContentDiv);
    });
    
    // Initial auto-resize
    this.autoResizeTextItem(element, item, textContentDiv);
  }

  private autoResizeTextItem(itemElement: HTMLDivElement, item: WhiteboardItem, textContentDiv: HTMLElement): void {
    const currentWidth = item.width;
    // Temporarily remove fixed height to measure scrollHeight
    textContentDiv.style.height = 'auto';
    itemElement.style.height = 'auto';

    let newHeight = textContentDiv.scrollHeight;
    const minHeight = parseInt(textContentDiv.style.minHeight) || 20;
    newHeight = Math.max(newHeight, minHeight);
    
    // Restore fixed height for the content div to allow scrolling if content exceeds item bounds later
    textContentDiv.style.height = '100%';

    if (Math.abs(item.height - newHeight) > 1) { // Update only if there's a significant change
        this.board.updateItem(item.id, { height: newHeight });
    } else {
        // If no significant height change, ensure the itemElement reflects the current item.height
        // This can happen if the board update was suppressed or item.height was already correct
        itemElement.style.height = `${item.height}px`;
    }
  }

  private renderImageItem(element: HTMLDivElement, item: WhiteboardItem): void {
    const img = document.createElement('img');
    img.src = String(item.content || ''); // Assuming content is the image URL
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain'; // Or 'cover', depending on desired behavior
    img.draggable = false; // Prevent native image dragging
    element.appendChild(img);
  }

  private renderShapeItem(element: HTMLDivElement, item: WhiteboardItem): void {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${item.width} ${item.height}`);
    svg.style.overflow = 'visible';

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', String(item.content || '')); // item.content is the SVG path data
    path.setAttribute('fill', item.metadata?.fillColor || item.metadata?.color || 'lightblue'); // Use metadata for fill color
    path.setAttribute('stroke', item.metadata?.strokeColor || this.options.accentColor); // Use metadata for stroke color
    path.setAttribute('stroke-width', String(item.metadata?.strokeWidth || 2)); // Use metadata for stroke width
    
    svg.appendChild(path);
    element.appendChild(svg);
  }

  private addResizeHandle(element: HTMLDivElement, item: WhiteboardItem): void {
    // Remove existing handles to prevent duplicates on re-render
    element.querySelectorAll('.wb-resize-handle').forEach(h => h.remove());

    const handleSize = 10; // Visual size of the handle
    const handleOffset = -handleSize / 2; // Offset to center the handle on the border

    // Define the handle type explicitly for clarity and to avoid `this` context issues in type definition
    type HandleType = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

    const handles: { type: HandleType, cursor: string, style: Partial<CSSStyleDeclaration> }[] = [
      { type: 'n', cursor: 'ns-resize', style: { top: `${handleOffset}px`, left: '50%', transform: `translate(-50%, -0%) scale(${1 / this.viewport.zoom})` } },
      { type: 's', cursor: 'ns-resize', style: { bottom: `${handleOffset}px`, left: '50%', transform: `translate(-50%, 0%) scale(${1 / this.viewport.zoom})` } },
      { type: 'e', cursor: 'ew-resize', style: { top: '50%', right: `${handleOffset}px`, transform: `translate(0%, -50%) scale(${1 / this.viewport.zoom})` } },
      { type: 'w', cursor: 'ew-resize', style: { top: '50%', left: `${handleOffset}px`, transform: `translate(0%, -50%) scale(${1 / this.viewport.zoom})` } },
      { type: 'ne', cursor: 'nesw-resize', style: { top: `${handleOffset}px`, right: `${handleOffset}px`, transform: `scale(${1 / this.viewport.zoom})` } },
      { type: 'nw', cursor: 'nwse-resize', style: { top: `${handleOffset}px`, left: `${handleOffset}px`, transform: `scale(${1 / this.viewport.zoom})` } },
      { type: 'se', cursor: 'nwse-resize', style: { bottom: `${handleOffset}px`, right: `${handleOffset}px`, transform: `scale(${1 / this.viewport.zoom})` } },
      { type: 'sw', cursor: 'nesw-resize', style: { bottom: `${handleOffset}px`, left: `${handleOffset}px`, transform: `scale(${1 / this.viewport.zoom})` } },
    ];

    handles.forEach(handleData => {
      const handleEl = document.createElement('div');
      handleEl.classList.add('wb-resize-handle', `wb-resize-${handleData.type}`);
      handleEl.dataset.handleType = handleData.type!;
      Object.assign(handleEl.style, {
        position: 'absolute',
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        backgroundColor: this.options.accentColor,
        border: '1px solid white',
        borderRadius: '50%',
        cursor: handleData.cursor,
        zIndex: '100',
        ...handleData.style,
      });
      element.appendChild(handleEl);
    });
  }

  private setupItemInteractions(element: HTMLDivElement, item: WhiteboardItem): void {
    // Double-click to edit text
    if (item.type === 'text') {
      element.addEventListener('dblclick', () => {
        const textContentDiv = element.querySelector('.wb-text-content') as HTMLElement;
        if (textContentDiv) {
          textContentDiv.focus();
          // Select all text for easier editing
          const range = document.createRange();
          range.selectNodeContents(textContentDiv);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      });
    }
  }

  private startResize(event: PointerEvent, item: WhiteboardItem, handleType: typeof this.activeResizeHandleType, startPoint: Point): void {
    this.isResizing = true;
    this.activeResizeItemInitialState = {
        id: item.id,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
    };
    this.resizeStartPoint = startPoint;
    this.activeResizeHandleType = handleType;
    this.canvas.style.cursor = `${handleType}-resize`; // e.g., 'se-resize'
    event.stopPropagation(); // Prevent dragging the item while resizing
  }

  private updateResize(currentPoint: Point): void {
    if (!this.isResizing || !this.activeResizeItemInitialState || !this.resizeStartPoint || !this.activeResizeHandleType) {
        return;
    }

    const initial = this.activeResizeItemInitialState;
    let dx = currentPoint.x - this.resizeStartPoint.x;
    let dy = currentPoint.y - this.resizeStartPoint.y;

    let newX = initial.x;
    let newY = initial.y;
    let newWidth = initial.width;
    let newHeight = initial.height;

    const minSize = 20; // Minimum size for an item

    // Adjust dimensions and position based on handle type
    switch (this.activeResizeHandleType) {
      case 'n':
        newHeight = Math.max(minSize, initial.height - dy);
        if (newHeight > minSize || initial.height - dy > minSize) { // Allow shrinking past minSize if dy is positive
             newY = initial.y + dy;
        } else {
            newY = initial.y + initial.height - minSize;
        }
        break;
      case 's':
        newHeight = Math.max(minSize, initial.height + dy);
        break;
      case 'w':
        newWidth = Math.max(minSize, initial.width - dx);
        if (newWidth > minSize || initial.width - dx > minSize) {
            newX = initial.x + dx;
        } else {
            newX = initial.x + initial.width - minSize;
        }
        break;
      case 'e':
        newWidth = Math.max(minSize, initial.width + dx);
        break;
      case 'nw':
        newHeight = Math.max(minSize, initial.height - dy);
        newWidth = Math.max(minSize, initial.width - dx);
        if (newHeight > minSize || initial.height - dy > minSize) newY = initial.y + dy; else newY = initial.y + initial.height - minSize;
        if (newWidth > minSize || initial.width - dx > minSize) newX = initial.x + dx; else newX = initial.x + initial.width - minSize;
        break;
      case 'ne':
        newHeight = Math.max(minSize, initial.height - dy);
        newWidth = Math.max(minSize, initial.width + dx);
        if (newHeight > minSize || initial.height - dy > minSize) newY = initial.y + dy; else newY = initial.y + initial.height - minSize;
        break;
      case 'sw':
        newHeight = Math.max(minSize, initial.height + dy);
        newWidth = Math.max(minSize, initial.width - dx);
        if (newWidth > minSize || initial.width - dx > minSize) newX = initial.x + dx; else newX = initial.x + initial.width - minSize;
        break;
      case 'se':
        newHeight = Math.max(minSize, initial.height + dy);
        newWidth = Math.max(minSize, initial.width + dx);
        break;
    }
    
    this.board.updateItem(initial.id, { x: newX, y: newY, width: newWidth, height: newHeight });
  }

  private finishResize(): void {
    if (!this.isResizing || !this.activeResizeItemInitialState) return;

    const item = this.board.find(this.activeResizeItemInitialState.id);
    if (item && item.type === 'text') {
        const itemElement = this.itemElements.get(item.id);
        const textContentDiv = itemElement?.querySelector('.wb-text-content') as HTMLElement;
        if (itemElement && textContentDiv) {
            this.autoResizeTextItem(itemElement, item, textContentDiv);
        }
    }
    
    this.isResizing = false;
    this.activeResizeItemInitialState = null;
    this.resizeStartPoint = null;
    this.activeResizeHandleType = null;
    this.canvas.style.cursor = 'grab';
    this.updateSelectionDisplay(); // Re-render selection which might update handles
  }
  
  public setDrawingMode(mode: 'select' | 'pen' | 'rect' | 'circle' | 'line' | 'arrow'): void {
    this.drawingMode = mode;
    
    // Update cursor
    switch (mode) {
      case 'select':
        this.canvas.style.cursor = 'grab';
        break;
      default:
        this.canvas.style.cursor = 'crosshair';
    }

    // Update toolbar visual state if needed
    this.container.querySelectorAll('.wb-tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = this.container.querySelector(`[data-tool="${mode}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  public addItem(type: WhiteboardItem['type'], x?: number, y?: number): void {
    const centerX = x ?? (this.container.clientWidth / 2 - this.viewport.panX) / this.viewport.zoom;
    const centerY = y ?? (this.container.clientHeight / 2 - this.viewport.panY) / this.viewport.zoom;

    const item: Omit<WhiteboardItem, 'id'> = {
      type,
      x: centerX - 50,
      y: centerY - 25,
      width: 100,
      height: 50,
      content: this.getDefaultContent(type),
    };

    this.board.addItem(item);
  }

  private getDefaultContent(type: WhiteboardItem['type']): any {
    switch (type) {
      case 'text': return 'New Text';
      case 'sticky': return 'Note';
      case 'image': return 'https://via.placeholder.com/100x50';
      case 'shape': return 'M0 0 L100 50';
      default: return '';
    }
  }

  public render(): void {
    // Clear existing items
    this.canvas.querySelectorAll('.wb-item').forEach(el => el.remove());
    this.itemElements.clear();

    // Render all items
    for (const item of this.board.items) {
      this.createItemElement(item);
    }

    this.updateSelectionDisplay();
  }

  public exportPNG(): Promise<Blob> {
    return new Promise((resolve) => {
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to match viewport
      const rect = this.canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Fill background
      ctx.fillStyle = this.options.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // For now, return a simple blob
      // In a real implementation, you'd render all items to the canvas
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  }

  public resetView(): void {
    this.viewport = { zoom: 1, panX: 0, panY: 0 };
    this.updateViewport();
  }

  public zoomToFit(): void {
    if (this.board.items.length === 0) return;

    const bounds = this.calculateSelectionBounds(this.board.items);
    const padding = 50;
    
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight - 60; // Account for toolbar
    
    const scaleX = (containerWidth - padding * 2) / bounds.width;
    const scaleY = (containerHeight - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
    
    this.viewport.zoom = scale;
    this.viewport.panX = (containerWidth / 2) - (bounds.x + bounds.width / 2) * scale;
    this.viewport.panY = (containerHeight / 2) - (bounds.y + bounds.height / 2) * scale + 30; // Account for toolbar
    
    this.updateViewport();
  }

  private injectStyles(): void {
    if (document.querySelector('#wb-styles')) return;

    const style = document.createElement('style');
    style.id = 'wb-styles';
    style.textContent = `
      .wb-container {
        font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .wb-item {
        user-select: none;
      }
      
      .wb-item:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }
      
      .wb-selected {
        outline: 2px solid ${this.options.accentColor} !important;
        outline-offset: 2px;
      }
      
      .wb-resize {
        z-index: 1001;
      }
      
      .wb-tool-btn {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
      }
      
      .wb-tool-btn:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }
      
      .wb-tool-btn.active {
        background: ${this.options.accentColor};
        color: white;
        border-color: ${this.options.accentColor};
      }
      
      .wb-toolbar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 8px;
        z-index: 1100;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
    `;
    
    document.head.appendChild(style);
  }

  // Getter for accessing private members from toolbar
  public get currentDrawingMode() { return this.drawingMode; }
  public get currentViewport() { return { ...this.viewport }; }
  public get selectedItemCount() { return this.selectedItemsSet.size; }
  public get selectedItems(): number[] { return Array.from(this.selectedItemsSet); }
}
