# Game View Platform - Handoff Document

> **Last Updated:** January 20, 2026
> **Current Sprint:** 4D Motion Implementation
> **Branch:** `claude/fix-splats-rendering-sh1k7`

---

## Quick Start for New Sessions

```bash
# 1. Read the active sprint plan
cat docs/SPRINT_4D_MOTION.md

# 2. Check current branch and status
git status
git log --oneline -5

# 3. Review key technical docs
cat docs/4D_MOTION_ARCHITECTURE.md
cat docs/GAUSSIAN_SPLAT_INTEGRATION.md
```

---

## Current State Summary

### Platform Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Spark (Phase 1)** | Complete | AI brief creation works |
| **Build (Phase 2)** | Complete | Editor, objects, interactions work |
| **Platform (Phase 3)** | Complete | Player app, playback works |
| **4D Motion** | **IN PROGRESS** | Core differentiator, critical path |

### What's Working
- Static 3D Gaussian Splat rendering
- First-person controls (WASD, mouse look, Space jump, T/G vertical)
- Orbit controls for scene editing
- Object placement and interactions
- Game logic and win conditions
- Publishing and player experience
- Timeline UI (built but NOT connected to playback)

### What's NOT Working (Critical)
- **Motion playback** - Objects/people don't move
- **Temporal data** - Pipeline discards timing info
- **Timeline ↔ Viewer** - UI exists but does nothing

---

## The Core Problem

**Game View's value proposition is MOTION** - real 3D captures where objects and people move. Currently, the web platform produces STATIC splats only. The desktop app (gvdw) shows real motion that loops every video duration. We must achieve parity.

### Solution: True 4D Gaussian Splatting

Replace OpenSplat (static 3D) with 4DGaussians (temporal 4D):
- Adds time dimension to Gaussian parameters
- Uses deformation field to model motion
- Enables smooth playback at any timestamp

See `docs/4D_MOTION_ARCHITECTURE.md` for full technical analysis.

---

## Active Sprint: 4D Motion

**Sprint Plan:** `docs/SPRINT_4D_MOTION.md`

### Current Phase: Research & Validation

**Completed:**
- [x] Research 4D-GS technology (CVPR 2024)
- [x] Document architecture options
- [x] Fix static splat rendering
- [x] Implement first-person controls
- [x] Fix WebGL context management

**Next Steps:**
- [ ] Clone and test 4DGaussians locally
- [ ] Test with sample multi-view video
- [ ] Evaluate WebGL rendering options
- [ ] Get access to gvdw desktop for format analysis

---

## Key Files

### Viewer Components
```
apps/studio/src/components/viewer/SceneViewer.tsx    # Main splat viewer
apps/studio/src/components/viewer/GaussianSplats.tsx # Splat component
apps/studio/src/components/editor/SceneEditor.tsx    # Editor with R3F overlay
apps/studio/src/components/editor/Timeline.tsx       # Timeline UI (disconnected)
```

### Processing Pipeline
```
packages/processing/modal_worker.py  # GPU processing (needs 4D-GS update)
packages/queue/src/worker.ts         # Job queue
```

### Documentation
```
docs/SPRINT_4D_MOTION.md            # Active sprint plan (tasks to check off)
docs/4D_MOTION_ARCHITECTURE.md      # Technical research and options
docs/GAUSSIAN_SPLAT_INTEGRATION.md  # Learnings from static implementation
docs/PRODUCT_BRIEF.md               # Product vision
docs/archive/                       # Old sprint plans (for reference)
```

---

## Technical Context

### Viewer Configuration
The splat viewer uses these quality settings:
```typescript
const viewerOptions = {
  sphericalHarmonicsDegree: 2,  // Highest quality
  antialiased: true,
  useBuiltInControls: true,     // Orbit controls
  gpuAcceleratedSort: true,
  // FPS controls layer on top when pointer locked
};
```

### React Strict Mode Protection
Double-mount protection using refs:
```typescript
const initializingRef = useRef(false);
const initializedUrlRef = useRef<string | null>(null);

if (viewerRef.current || initializingRef.current || initializedUrlRef.current === splatUrl) {
  return; // Skip duplicate initialization
}
```

### Canvas Architecture
Layered approach:
- Bottom (z-index: 0): SceneViewer with Gaussian Splats
- Top (z-index: 1): R3F Canvas with editor overlays (pointer-events: none)

---

## External Dependencies

| Resource | URL | Purpose |
|----------|-----|---------|
| 4DGaussians | https://github.com/hustvl/4DGaussians | Training pipeline |
| OpenSplat | https://github.com/pierotofy/OpenSplat | Current static pipeline |
| gvdw Desktop | https://github.com/Game-View/gvdw | Reference implementation |
| GaussianSplats3D | npm: @mkkellogg/gaussian-splats-3d | Current WebGL viewer |

---

## Environment

- **Runtime:** Node.js, pnpm monorepo
- **Framework:** Next.js 14, React 18
- **3D:** Three.js, React Three Fiber, GaussianSplats3D
- **Processing:** Modal (GPU), COLMAP, GLOMAP, OpenSplat
- **Database:** Supabase (Postgres), Prisma
- **Auth:** Clerk
- **Deployment:** Vercel

---

## Common Tasks

### Run Development Server
```bash
pnpm dev
```

### Check for Build Errors
```bash
pnpm build
```

### View Splat in Editor
1. Navigate to `/editor/[experienceId]`
2. Scene loads automatically if `plyUrl` exists
3. Use mouse to orbit, click to enter first-person mode

### Test Processing Pipeline
Processing happens via Modal workers - check Modal dashboard for logs.

---

## Recent Commits (This Branch)

```
6d2b658 Add 4D motion architecture research documentation
e0edcf5 Improve splat render quality settings
37a466b Fix ESLint errors - remove unused var, add eslint-disable
6657146 Fix controls conflict - keep orbit controls, layer FPS on top
93f8747 Add diagnostic logging to debug splat rendering
```

---

## Questions for Product Owner

1. **Desktop Access:** Can we get access to examine gvdw output format?
2. **Processing Time:** Is 30-60 minutes acceptable for 4D processing?
3. **Quality Priority:** Match desktop exactly, or "good enough" faster?
4. **Mobile Support:** Do we need motion playback on mobile?

---

## Notes

- Motion is the #1 priority - "motion motion motion, quality quality quality"
- The desktop app already has working motion - web needs parity
- 4D-GS (CVPR 2024) is production-ready technology
- Timeline UI exists and is beautiful - just needs connection to viewer

---

*This document should be read at the start of every new Claude session.*
