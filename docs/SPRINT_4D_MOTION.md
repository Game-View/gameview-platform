# Sprint Plan: True 4D Gaussian Splatting

> **Created:** January 20, 2026
> **Status:** Active Sprint
> **Goal:** Implement real motion playback where objects/people move in 3D space
> **Branch:** `claude/fix-splats-rendering-sh1k7`

---

## Executive Summary

**The Core Problem:** The web platform currently produces static 3D Gaussian Splats. Motion is discarded during processing. The desktop app (gvdw) shows REAL motion - this is what we must achieve.

**The Solution:** Replace OpenSplat with 4D Gaussian Splatting (4D-GS) for native temporal support.

**Why This Matters:** Motion is the ENTIRE value proposition. Without it, Game View is "just another 3D viewer." With it, we're creating an entirely new category of content.

---

## KEY FINDING: 4DGaussians Export (January 20, 2026)

After cloning and analyzing the [4DGaussians](https://github.com/hustvl/4DGaussians) repository, we discovered a critical capability:

### The `export_perframe_3DGS.py` Script

This script exports **standard PLY files for each timestamp**:

```bash
python export_perframe_3DGS.py --iteration 14000 --configs arguments/dnerf/lego.py --model_path output/dnerf/lego
```

**Output:** `output/dnerf/lego/gaussian_pertimestamp/`
- `time_00000.ply`
- `time_00001.ply`
- `time_00002.ply`
- ... (one per frame)

### Why This Changes Everything

1. **Standard PLY format** - Compatible with our existing `@mkkellogg/gaussian-splats-3d` viewer
2. **No custom renderer needed** - We can reuse `SceneViewer.tsx`
3. **Simpler architecture** - Just switch which PLY is loaded based on timeline
4. **Faster MVP** - Days instead of weeks

### Training Parameters (from `arguments/__init__.py`)

```python
# Key deformation settings
net_width = 64          # Deformation MLP width
defor_depth = 1         # Deformation MLP depth
kplanes_config = {
  'resolution': [64, 64, 64, 25]  # [spatial³, temporal]
}

# Training iterations
iterations = 30_000
coarse_iterations = 3_000

# Training time: ~8 min (synthetic), ~30 min (real scenes)
```

### Data Format Required

```
data/
└── multipleview/
    └── scene_name/
        ├── cam01/
        │   ├── frame_00001.jpg
        │   ├── frame_00002.jpg
        │   └── ...
        ├── cam02/
        │   └── ...
        ├── sparse_/          # COLMAP output
        └── points3D_multipleview.ply
```

---

## Current State (January 20, 2026)

### What's Working
- [x] Static splat rendering in web editor
- [x] First-person controls (WASD, mouse look, jump)
- [x] Orbit controls for editor
- [x] WebGL context management (no leaks)
- [x] React Strict Mode handling
- [x] Quality settings (SH degree 2, antialiased)
- [x] Timeline UI component (built but disconnected)

### What's NOT Working
- [ ] **Motion playback** - Core feature, completely missing
- [ ] **Temporal data capture** - Pipeline discards timing info
- [ ] **Timeline ↔ Splat connection** - UI exists but does nothing
- [ ] **4D model format support** - Only static PLY supported

---

## Sprint Tasks

### Phase 1: Research & Validation (Current)

#### 1.1 Desktop Analysis
- [ ] Get access to gvdw desktop repository
- [ ] Document how desktop handles temporal data
- [ ] Identify desktop output format (per-frame PLY? 4D model?)
- [ ] Understand desktop's motion loop mechanism

#### 1.2 4D-GS Evaluation
- [x] Research 4D Gaussian Splatting technology
- [x] Document architecture options (see `4D_MOTION_ARCHITECTURE.md`)
- [x] Clone and test [4DGaussians](https://github.com/hustvl/4DGaussians) locally
- [x] Analyze export script and output format
- [ ] Test with sample multi-view video dataset
- [ ] Measure training time and output quality

#### 1.3 Format Decision - RESOLVED
**Decision: Per-Frame PLY Export (Option A)**

Key discovery from 4DGaussians analysis:
- `export_perframe_3DGS.py` exports **standard PLY files per timestamp**
- Output: `gaussian_pertimestamp/time_00000.ply`, `time_00001.ply`, etc.
- **These PLY files are compatible with our existing viewer!**

This means we can:
1. Train 4D-GS model (captures temporal deformation)
2. Export per-frame PLY files
3. Load them in our EXISTING web viewer
4. Switch frames based on timeline position

**No custom WebGL renderer needed for MVP!**

| Approach | Complexity | Storage | Quality |
|----------|------------|---------|---------|
| Per-frame PLY | Low | ~50-100MB × N frames | High |
| Native 4D | High (custom renderer) | ~100-200MB total | High |

**Chosen:** Per-frame PLY for faster time-to-motion

---

### Phase 2: Processing Pipeline

#### 2.1 Modal Worker Updates - DONE
- [x] Create new Modal worker variant for 4D-GS (`modal_worker_4d.py`)
- [x] Install 4DGaussians dependencies (PyTorch, CUDA)
- [x] Modify frame extraction to preserve timestamps
- [x] Configure 4D-GS training parameters
- [ ] Deploy and test end-to-end processing

**Files created:**
- `packages/processing/modal_worker_4d.py` - New 4D processing worker

#### 2.2 Output Format (Per-Frame PLY) - DONE
- [x] Define output structure (implemented in worker):
  ```
  output/
  ├── frames/
  │   ├── frame_00000.ply
  │   ├── frame_00001.ply
  │   └── ... (one per timestamp)
  ├── metadata.json
  │   {
  │     "motionEnabled": true,
  │     "frameCount": 150,
  │     "fps": 15,
  │     "duration": 10.0,
  │     "frameUrls": ["...", "...", ...]
  │   }
  └── thumbnail.jpg
  ```
- [x] Implement batch upload to Supabase Storage
- [x] Generate metadata.json with frame URLs
- [x] Update database schema for temporal data

#### 2.3 Database Schema - DONE
- [x] Add motion-related fields to Experience model:
  - `motionEnabled` Boolean
  - `motionDuration` Float
  - `motionFps` Int
  - `motionMetadataUrl` String
  - `motionFrameCount` Int
- [x] Add motion-related fields to ProcessingJob model:
  - `motionEnabled` Boolean
  - `motionFps` Int
  - `motionMaxFrames` Int
  - `outputMotionMetadataUrl` String
  - `outputMotionFrameCount` Int
  - `outputMotionDuration` Float
- [ ] Create and run migration
- [x] Update Prisma schema

---

### Phase 3: WebGL Viewer (SIMPLIFIED)

**Key Insight:** Using per-frame PLY export, we can reuse our existing viewer!

#### 3.1 Frame-Switching Viewer
- [x] Create `TemporalSceneViewer` component wrapping SceneViewer
- [ ] Implement frame preloading (load N frames ahead)
- [ ] Implement smooth frame switching (< 100ms)

#### 3.2 Playback Controller - DONE
- [x] Create `FramePlaybackController` class in `lib/frame-playback.ts`
- [x] Implement animation loop with requestAnimationFrame
- [x] Handle loop/repeat behavior
- [x] Create `useFramePlayback` React hook
- [x] Support play/pause/stop/seek/step operations

#### 3.3 Performance Optimization
- [ ] Preload frames in background (Web Workers)
- [ ] Cache loaded PLY data in memory
- [ ] Implement frame dropping if behind
- [ ] Target 30fps playback minimum

**Files created:**
- `apps/studio/src/lib/frame-playback.ts` - Playback controller + hook
- `apps/studio/src/components/viewer/TemporalSceneViewer.tsx` - Frame-aware viewer

---

### Phase 4: Editor Integration - DONE

#### 4.1 Timeline Connection - DONE
- [x] Pass `timelineTime` to viewer component
- [x] Sync timeline scrub with viewer timestamp
- [x] Update timeline duration from model metadata
- [x] Bi-directional sync: timeline controls viewer, viewer updates timeline

**Implementation:**
- Editor page detects `motionEnabled` flag on experience
- Fetches motion metadata to get frame URLs
- Conditionally renders `TemporalSceneViewer` for motion, `SceneEditor` for static
- Timeline duration dynamically set from `motionDuration`
- `currentTime` and `isPlaying` synced between Timeline and viewer

**Files modified:**
- `apps/studio/src/app/editor/[experienceId]/page.tsx`

#### 4.2 Experience Data Model
- [x] Add motion fields to ExperienceData interface
- [x] Fetch motion metadata on load
- [x] Handle fallback to static rendering

#### 4.2 Playback Controls
- [ ] Wire play/pause button to viewer
- [ ] Add playback speed control (0.5x, 1x, 2x)
- [ ] Add loop toggle
- [ ] Show current timecode in HUD

#### 4.3 Editor UX
- [ ] Show motion preview in scene list
- [ ] Display motion duration on cards
- [ ] Add "Motion" badge to temporal scenes
- [ ] Warning when editing moving scene

---

### Phase 5: Quality & Polish

#### 5.1 Quality Comparison
- [ ] Side-by-side comparison: web vs desktop
- [ ] Document quality settings that matter
- [ ] Implement quality presets (Performance/Balanced/Quality)
- [ ] Match desktop render quality

#### 5.2 Error Handling
- [ ] Handle missing deformation model gracefully
- [ ] Fallback to static render if motion fails
- [ ] Progress indicators for model loading
- [ ] Clear error messages for users

#### 5.3 Documentation
- [ ] Update `GAUSSIAN_SPLAT_INTEGRATION.md` with 4D info
- [ ] Create user guide for motion features
- [ ] Document processing requirements
- [ ] Add troubleshooting section

---

## Technical Specifications

### Processing Requirements

| Stage | Tool | Time (est.) | GPU |
|-------|------|-------------|-----|
| Frame extraction | FFmpeg | 1-2 min | No |
| Feature extraction | COLMAP | 5-10 min | Optional |
| Sparse reconstruction | GLOMAP | 5-10 min | Yes |
| 4D-GS training | 4DGaussians | 20-40 min | Yes (A10G) |
| **Total** | - | **30-60 min** | - |

### Output Size Estimates

| Component | Size (est.) |
|-----------|-------------|
| Canonical PLY | 50-100 MB |
| Deformation model | 20-50 MB |
| Metadata | < 1 KB |
| **Total per scene** | **70-150 MB** |

### Viewer Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Load time | < 10s | With progress indicator |
| Playback FPS | 30+ | On mid-tier GPU |
| Memory usage | < 2 GB | VRAM |
| Seek latency | < 100ms | For timeline scrubbing |

---

## Risk Mitigation

### Risk 1: No WebGL 4D Renderer Exists
**Mitigation:**
- Start with frame-sequence approach (multiple PLYs)
- Build custom WebGL renderer in parallel
- Consider WebGPU for better performance

### Risk 2: Training Takes Too Long
**Mitigation:**
- Use GPU instances (A10G minimum)
- Implement progressive training (show preview early)
- Cache intermediate results
- Consider A100 for complex scenes

### Risk 3: Quality Not Matching Desktop
**Mitigation:**
- Profile exact settings desktop uses
- Match spherical harmonics degree
- Ensure same training iterations
- Compare render pipelines

### Risk 4: Large File Sizes
**Mitigation:**
- Implement model compression
- Use delta encoding for deformation
- CDN with edge caching
- Progressive loading

---

## Success Criteria

### MVP (Minimum Viable Product)
- [ ] Upload video → Process → See motion in editor
- [ ] Timeline scrub shows different timestamps
- [ ] Play button starts motion playback
- [ ] Motion loops at video duration
- [ ] Quality visually comparable to desktop

### Full Feature
- [ ] Smooth 30fps playback
- [ ] < 60 minute processing time
- [ ] < 200 MB storage per scene
- [ ] Works on mid-tier hardware (GTX 1060+)
- [ ] Mobile playback (reduced quality OK)

---

## Dependencies

### External
- [4DGaussians](https://github.com/hustvl/4DGaussians) - Training pipeline
- Modal GPU instances (A10G or better)
- WebGL 2.0 support in browsers

### Internal
- Current splat viewer working (done)
- Timeline component (done)
- Processing pipeline (working, needs modification)

---

## Open Questions

1. **Desktop format:** What exactly does gvdw output? Need access to examine.

2. **WebGL renderer:** Build custom or adapt existing? Need to evaluate options.

3. **Processing cost:** A10G vs A100? What's the cost/speed tradeoff?

4. **Mobile support:** Can we do reduced-quality motion on mobile?

5. **Backward compatibility:** How to handle existing static scenes?

---

## References

- [4D Gaussian Splatting (CVPR 2024)](https://github.com/hustvl/4DGaussians)
- [4D-GS Paper](https://arxiv.org/abs/2310.08528)
- [4D Motion Architecture Doc](./4D_MOTION_ARCHITECTURE.md)
- [Gaussian Splat Integration Doc](./GAUSSIAN_SPLAT_INTEGRATION.md)
- [gvdw Desktop Repository](https://github.com/Game-View/gvdw)

---

## Changelog

| Date | Change |
|------|--------|
| Jan 20, 2026 | Initial sprint plan created |
| Jan 20, 2026 | Research phase items marked based on completed work |

---

*This is the ACTIVE sprint plan. All work should reference and update this document.*
