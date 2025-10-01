# Pinch-to-Zoom Implementation Flow

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Interaction                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Two fingers down │
                    │   (touchstart)   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │  onTouchStart()              │
                    │  - Check touches.length === 2│
                    │  - Store initial distance    │
                    │  - Store initial zoom        │
                    │  - Store center point        │
                    └──────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Fingers move     │
                    │  (touchmove)     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │  onTouchMove()               │
                    │  - Check touches.length === 2│
                    │  - Prevent default           │
                    │  - Store event               │
                    │  - Schedule RAF              │
                    └──────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │  handlePinchMove() [RAF]     │
                    │  - Calculate new distance    │
                    │  - Calculate scale           │
                    │  - Clamp zoom (0.1-5)        │
                    │  - Get new center            │
                    │  - Update viewport.zoom      │
                    │  - Adjust pan (keep stable)  │
                    │  - Apply to element          │
                    │  - Trigger updateViewport()  │
                    └──────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Fingers lift     │
                    │   (touchend)     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │  onTouchEnd()                │
                    │  - Check touches.length < 2  │
                    │  - Reset pinchStartDist      │
                    │  - Cancel RAF                │
                    │  - Clear events              │
                    └──────────────────────────────┘
```

## Key Components

### State Properties
```typescript
pinchStartDist: number | null      // Initial distance between fingers
pinchStartZoom: number            // Zoom level when pinch started
pinchStartCenter: Point           // Center point between fingers
pinchRafId: number | null         // RequestAnimationFrame ID
lastPinchEvent: TouchEvent | null // Last touch event
```

### Helper Methods
```typescript
getTouchesDistance(touches: TouchList): number
  → Calculates Euclidean distance between two touch points
  → Uses Math.hypot(dx, dy) for accuracy

getTouchesCenter(touches: TouchList): Point
  → Calculates midpoint between two touch points
  → Returns { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
```

### Zoom Calculation
```
scale = newDistance / initialDistance
newZoom = clamp(initialZoom * scale, 0.1, 5)

Example:
  Initial distance: 100px
  Initial zoom: 1.0
  New distance: 200px
  → scale = 200 / 100 = 2
  → newZoom = 1.0 * 2 = 2.0 (200% zoom)
```

### Pan Adjustment
```
To keep the pinch center stable during zoom:

centerX = (touch1.x + touch2.x) / 2
centerY = (touch1.y + touch2.y) / 2

mouseX = centerX - canvasRect.left
mouseY = centerY - canvasRect.top

zoomRatio = newZoom / oldZoom
newPanX = mouseX - (mouseX - oldPanX) * zoomRatio
newPanY = mouseY - (mouseY - oldPanY) * zoomRatio
```

## Performance Optimization

### RequestAnimationFrame Throttling
```
touchmove events can fire 60+ times per second
→ Use RAF to limit to max 60 FPS
→ Store last event, process on next frame
→ Cancel RAF on touchend to prevent leaks

Visual improvement:
Without RAF: Janky, CPU intensive
With RAF:    Smooth 60 FPS, efficient
```

## Touch Event Sequence Example

```
Time  Event         Touches  Action
----  -----------   -------  --------------------------------
0ms   touchstart    2        Initialize pinch (dist: 100px)
16ms  touchmove     2        Schedule RAF
17ms  RAF callback  -        Update zoom (dist: 110px, +10%)
33ms  touchmove     2        Schedule RAF  
34ms  RAF callback  -        Update zoom (dist: 120px, +20%)
50ms  touchmove     2        Schedule RAF
51ms  RAF callback  -        Update zoom (dist: 150px, +50%)
67ms  touchend      0        Reset state, cancel RAF
```

## Comparison with visualMindmap.ts

Both implementations use the same pattern:

| Aspect           | visualMindmap.ts | InteractionLayer.ts |
|------------------|------------------|---------------------|
| State tracking   | ✓ Same           | ✓ Same              |
| Helper methods   | ✓ Same names     | ✓ Same names        |
| RAF throttling   | ✓ Yes            | ✓ Yes               |
| Zoom clamping    | 0.2 - 4.0        | 0.1 - 5.0           |
| Pan adjustment   | ✓ Yes            | ✓ Yes               |
| preventDefault   | ✓ Yes            | ✓ Yes               |

## Browser Compatibility

✓ Modern browsers with touch support
✓ iOS Safari 13+
✓ Chrome/Edge mobile
✓ Firefox mobile
✓ Android browsers
