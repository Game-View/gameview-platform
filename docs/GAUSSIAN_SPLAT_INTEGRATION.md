# Gaussian Splat Integration - Technical Learnings

> Document created: January 19, 2026
> Last updated: January 19, 2026

## Overview

This document captures hard-won learnings from integrating the `@mkkellogg/gaussian-splats-3d` library into the Game View Studio web editor. These lessons apply to anyone working with WebGL-based 3D viewers in React applications.

---

## Problem Statement

The Scene Editor needed to render Gaussian Splat (.ply) files in the browser alongside React Three Fiber (R3F) overlay elements for object placement, transform controls, and other editor tools.

Initial attempts resulted in:
- Splats loading (639,874 splats) but not rendering visually
- OrbitControls not responding to mouse input
- WebGL context exhaustion ("Too many active WebGL contexts")
- `removeChild` errors during cleanup

---

## Key Learnings

### 1. Don't Fight the Library's Renderer

**Problem:** We initially tried to provide our own Three.js renderer and camera to the GaussianSplats3D Viewer, hoping to share context with R3F.

**Why it failed:** The library's internal wiring for controls, camera updates, and render loop assumes it created these objects. When you provide your own, the controls silently break.

**Solution:** Let the viewer create its own renderer, camera, and controls using documented initialization parameters:

```typescript
const viewerOptions = {
  cameraUp: [0, 1, 0],
  initialCameraPosition: [x, y, z],
  initialCameraLookAt: [tx, ty, tz],
  useBuiltInControls: true, // or false for custom FPS controls
  // ... other options
};
const viewer = new GaussianSplats3D.Viewer(viewerOptions);
```

### 2. Canvas Management

**Problem:** The library creates its canvas on `document.body` by default, but we need it in a specific container for our layout.

**Solution:** Move the canvas after initialization:

```typescript
setTimeout(() => {
  const canvas = viewer.renderer.domElement;
  if (canvas && canvas.parentElement !== container) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    container.appendChild(canvas);
  }
}, 50); // Small delay for viewer to finish setup
```

### 3. React Strict Mode Double-Mount

**Problem:** React 18 Strict Mode mounts components twice in development, causing:
- Multiple WebGL contexts created
- Race conditions in initialization
- Cleanup errors when trying to remove elements that moved

**Solution:** Multi-layered protection:

```typescript
const viewerRef = useRef<Viewer | null>(null);
const initializingRef = useRef(false);
const initializedUrlRef = useRef<string | null>(null);

useEffect(() => {
  // Guard 1: Skip if viewer exists
  if (viewerRef.current) return;

  // Guard 2: Skip if currently initializing
  if (initializingRef.current) return;

  // Guard 3: Skip if already initialized for this URL
  if (initializedUrlRef.current === splatUrl) return;

  initializingRef.current = true;

  // Delay initialization to let Strict Mode's unmount happen first
  const timeout = setTimeout(() => {
    if (!isMounted || viewerRef.current) {
      initializingRef.current = false;
      return;
    }
    // ... actual initialization
  }, 100);

  return () => {
    isMounted = false;
    clearTimeout(timeout);
    initializingRef.current = false;
    // ... cleanup
  };
}, [splatUrl]); // Minimal dependencies!
```

### 4. Safe Cleanup

**Problem:** During cleanup, the canvas might have been moved or already removed, causing `removeChild` errors.

**Solution:** Always check the actual parent before removing:

```typescript
// Cleanup
try {
  const canvas = viewer.renderer?.domElement;
  if (canvas && canvas.parentElement) {
    canvas.parentElement.removeChild(canvas); // Remove from actual parent
  }
} catch {
  // Ignore removal errors
}

try {
  viewer.stop();
  viewer.dispose();
} catch {
  // Ignore disposal errors
}
```

### 5. Dependency Array Gotchas

**Problem:** Including object props in useEffect dependencies causes infinite re-renders:

```typescript
// BAD - objects are new references each render
useEffect(() => { ... }, [splatUrl, initialPosition, initialTarget]);
```

**Solution:** Either use primitive values or read props at initialization time:

```typescript
// GOOD - only primitive dependency
useEffect(() => {
  const pos = initialPosition; // Read at init time
  const target = initialTarget;
  // ... use pos and target
}, [splatUrl]); // Only splatUrl triggers re-init
```

### 6. First-Person Controls Implementation

**Problem:** The library's built-in OrbitControls don't support WASD/FPS movement needed for motion exploration.

**Solution:** Disable built-in controls and implement custom FPS controls:

```typescript
const viewerOptions = {
  useBuiltInControls: false, // Disable orbit controls
  // ...
};

// Then implement:
// - Keyboard handlers for WASD, Space, T/G, Q
// - Pointer lock for mouse look
// - Animation loop updating camera.position and camera.quaternion
```

Key implementation details:
- Use `document.pointerLockElement` for mouse capture
- Update camera rotation via `THREE.Euler` with "YXZ" order
- Calculate movement direction from yaw angle
- Handle sprint (Shift), jump (Space), vertical movement (T/G)

---

## Architecture Decision: Layered Rendering

We use a **layered canvas approach**:

1. **Bottom layer (z-index: 0):** SceneViewer with Gaussian Splats
2. **Top layer (z-index: 1):** R3F Canvas with `pointer-events: none` for editor overlays

This allows:
- Splat viewer to handle its own input (mouse look, WASD)
- R3F to render grids, gizmos, and object previews transparently on top
- Each system to manage its own WebGL context

```tsx
<div className="relative w-full h-full">
  <div style={{ zIndex: 0 }}>
    <SceneViewer splatUrl={url} />
  </div>
  {splatLoaded && (
    <div style={{ zIndex: 1, pointerEvents: 'none' }}>
      <Canvas gl={{ alpha: true }} style={{ background: 'transparent' }}>
        <EditorOverlays />
      </Canvas>
    </div>
  )}
</div>
```

---

## TypeScript Considerations

The `@mkkellogg/gaussian-splats-3d` types are incomplete. Use type assertions for:

1. Viewer options (many undocumented but working options):
```typescript
const viewer = new GaussianSplats3D.Viewer(options as any);
```

2. Internal properties (renderer, camera):
```typescript
const viewerInternal = viewer as any;
const camera = viewerInternal.camera;
const renderer = viewerInternal.renderer;
```

---

## Performance Considerations

- **WebGL Context Limit:** Browsers typically allow 8-16 contexts. Proper cleanup is essential.
- **Spherical Harmonics:** Set `sphericalHarmonicsDegree: 0` for faster loading if SH data isn't needed.
- **Progressive Loading:** Enable `progressiveLoad: true` for better UX on large files.
- **Render Mode:** Use `RenderMode.Always` for smooth interaction, `RenderMode.OnChange` to save GPU.

---

## Testing Checklist

When modifying splat rendering code, verify:

- [ ] Splats render on initial load
- [ ] Mouse/keyboard controls respond
- [ ] No WebGL context warnings in console
- [ ] No `removeChild` errors on navigation away
- [ ] Works after React Fast Refresh
- [ ] Works in production build (no Strict Mode)

---

## Related Files

- `/apps/studio/src/components/viewer/SceneViewer.tsx` - Main viewer component
- `/apps/studio/src/components/editor/SceneEditor.tsx` - Editor with R3F overlay
- `/apps/studio/src/components/playtest/FirstPersonControls.tsx` - Reference FPS implementation

---

## References

- [GaussianSplats3D GitHub](https://github.com/mkkellogg/GaussianSplats3D)
- [React 18 Strict Mode](https://react.dev/reference/react/StrictMode)
- [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
