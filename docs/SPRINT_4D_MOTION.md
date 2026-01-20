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
- [ ] Clone and test [4DGaussians](https://github.com/hustvl/4DGaussians) locally
- [ ] Test with sample multi-view video dataset
- [ ] Measure training time and output quality
- [ ] Evaluate WebGL rendering options

#### 1.3 Format Decision
- [ ] Decide on motion format:
  - Option A: Per-frame PLY files (simple, high storage)
  - Option B: True 4D-GS model (complex, efficient)
  - Option C: Hybrid approach
- [ ] Document format specification
- [ ] Get stakeholder approval

---

### Phase 2: Processing Pipeline

#### 2.1 Modal Worker Updates
- [ ] Create new Modal worker variant for 4D-GS
- [ ] Install 4DGaussians dependencies (PyTorch, CUDA)
- [ ] Modify frame extraction to preserve timestamps
- [ ] Configure 4D-GS training parameters
- [ ] Test end-to-end processing

**Files to modify:**
- `packages/processing/modal_worker.py`
- `packages/processing/requirements.txt`

#### 2.2 Output Format
- [ ] Define 4D model output structure:
  ```
  output/
  ├── canonical.ply      # Base 3D Gaussians
  ├── deformation/       # Temporal deformation field
  │   ├── model.pth      # PyTorch model
  │   └── config.json    # Training config
  └── metadata.json      # Duration, fps, timestamps
  ```
- [ ] Implement output upload to Supabase
- [ ] Update database schema for temporal data

#### 2.3 Database Schema
- [ ] Add motion-related fields to scenes table:
  ```sql
  ALTER TABLE scenes ADD COLUMN motion_enabled BOOLEAN DEFAULT FALSE;
  ALTER TABLE scenes ADD COLUMN motion_duration_seconds FLOAT;
  ALTER TABLE scenes ADD COLUMN motion_fps INTEGER;
  ALTER TABLE scenes ADD COLUMN deformation_model_url TEXT;
  ```
- [ ] Create migration
- [ ] Update Prisma schema

---

### Phase 3: WebGL Viewer

#### 3.1 Viewer Research
- [ ] Evaluate existing 4D-GS WebGL implementations
- [ ] Check if gsplat.js supports temporal
- [ ] Assess porting effort from PyTorch renderer
- [ ] Make build-vs-buy decision

#### 3.2 Temporal Viewer Component
- [ ] Create new `TemporalSplatViewer` component
- [ ] Implement model loading (canonical + deformation)
- [ ] Implement timestamp interpolation
- [ ] Add playback API:
  ```typescript
  interface TemporalSplatViewer {
    loadModel(canonicalUrl: string, deformationUrl: string): Promise<void>;
    setTime(t: number): void;  // 0 to duration
    play(): void;
    pause(): void;
    setPlaybackSpeed(speed: number): void;
    getCurrentTime(): number;
  }
  ```
- [ ] Test with sample 4D model

**Files to create:**
- `apps/studio/src/components/viewer/TemporalSplatViewer.tsx`
- `apps/studio/src/lib/temporal-renderer.ts`

#### 3.3 Performance Optimization
- [ ] Implement frame caching
- [ ] Add LOD for distant views
- [ ] Profile GPU memory usage
- [ ] Target 30fps minimum playback

---

### Phase 4: Editor Integration

#### 4.1 Timeline Connection
- [ ] Pass `timelineTime` to viewer component
- [ ] Sync timeline scrub with viewer timestamp
- [ ] Update timeline duration from model metadata
- [ ] Add frame-accurate seeking

**Files to modify:**
- `apps/studio/src/app/editor/[experienceId]/page.tsx`
- `apps/studio/src/components/editor/Timeline.tsx`

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
