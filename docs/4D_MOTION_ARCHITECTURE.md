# 4D Motion Architecture Analysis

> Created: January 20, 2026
> Status: Research Complete

---

## Executive Summary

**Current State**: The web platform produces static 3D Gaussian Splats with NO temporal/motion support. The processing pipeline (OpenSplat) discards temporal information from video frames.

**Goal**: Enable true 4D motion where objects/people move in 3D space, looping every video duration - matching the desktop app (gvdw) capability.

**Key Insight**: Motion is the core differentiator. Without it, Game View is "just another 3D viewer."

---

## Current Architecture (Static Only)

```
Video Files → FFmpeg (frames) → COLMAP (features) → GLOMAP (SfM) → OpenSplat → single scene.ply
```

**What's Lost**:
- Temporal sequence (which frame came when)
- Object motion between frames
- Dynamic scene content

**What's Produced**:
- Single static PLY file averaging all frames
- Static camera poses (cameras.json)
- No way to "play" motion

---

## 4D Gaussian Splatting Technology

### Research Background (CVPR 2024)

4D Gaussian Splatting (4D-GS) adds a temporal dimension to static 3D Gaussians:

| Attribute | 3D-GS (Static) | 4D-GS (Dynamic) |
|-----------|----------------|-----------------|
| Position | (x, y, z) | (x, y, z, t) via deformation field |
| Rotation | Quaternion | Time-varying quaternion |
| Scale | Fixed | Time-varying scale |
| Color/SH | Static | Can vary with time |

### Key Methods

1. **HexPlane Deformation** (CVPR 2024)
   - Maintains canonical 3D Gaussians + learned 4D deformation field
   - Deformation field predicts (dx, dy, dz, drotation, dscale) at timestamp t
   - 82 FPS at 800x800 on RTX 3090
   - 8 minute training for simple scenes

2. **4D-Rotor Gaussians**
   - Native 4D XYZT Gaussians
   - Temporal slicing for rendering
   - 277 FPS on RTX 3090, 583 FPS on RTX 4090

3. **Spacetime Gaussians (STG)**
   - Time-dependent opacity
   - Polynomial motion/rotation parameterization
   - Handles transient content (appearing/disappearing objects)

### Resources
- [4D-GS GitHub](https://github.com/hustvl/4DGaussians) - CVPR 2024 implementation
- [4D-GS Paper](https://arxiv.org/abs/2310.08528) - Technical details
- [D-NeRF Dataset](https://github.com/albertpumarola/D-NeRF) - Standard benchmark

---

## Implementation Options

### Option A: Frame-Sequence Approach (Simpler)

**Concept**: Store multiple PLY files, one per keyframe, and switch between them on timeline scrub.

**Processing Pipeline Change**:
```
Video → FFmpeg (frames) → COLMAP → OpenSplat (run N times, once per keyframe)
```

**Storage**:
- N PLY files (e.g., 30 keyframes for a 10-second video at 3fps)
- Each PLY ~50-100MB → Total ~1.5-3GB per scene
- Could use compression or delta encoding

**Viewer Change**:
- Preload N PLY files
- On timeline change: swap active PLY
- Simple crossfade between frames

**Pros**:
- Minimal pipeline changes (same tools)
- Simple viewer implementation
- Works with existing PLY format

**Cons**:
- High storage requirements
- Discontinuous motion (frame jumps)
- Long processing time (N × training time)

**Estimated Effort**: 2-3 weeks

---

### Option B: True 4D-GS (Recommended)

**Concept**: Replace OpenSplat with 4D Gaussian Splatting for native temporal support.

**Processing Pipeline Change**:
```
Video → FFmpeg (frames + timestamps) → COLMAP → 4DGaussians training → 4D model
```

**Storage**:
- Single 4D model file (deformation field + canonical Gaussians)
- Estimated 100-200MB per scene
- Much more efficient than Option A

**Viewer Change**:
- New WebGL renderer supporting 4D-GS format
- Timeline controls query model at timestamp t
- Smooth interpolation between any timestamps

**Pros**:
- Smooth continuous motion
- Efficient storage
- Real-time playback (30-60+ FPS)
- State-of-the-art quality

**Cons**:
- Requires new training pipeline (4DGaussians vs OpenSplat)
- Need custom WebGL viewer or port of 4D-GS renderer
- More complex integration

**Estimated Effort**: 4-6 weeks

---

### Option C: Hybrid Approach

**Concept**: Use frame-sequence for v1 MVP, then upgrade to 4D-GS.

**Phase 1 (2 weeks)**:
- Implement frame-sequence playback
- Test with existing pipeline (multiple OpenSplat runs)
- Ship motion capability quickly

**Phase 2 (3-4 weeks)**:
- Integrate 4D-GS training
- Build custom viewer
- Migrate existing content

**Pros**:
- Faster time-to-market
- Validates motion feature with users
- Gradual complexity increase

**Cons**:
- Technical debt from frame-sequence approach
- Two migrations for users

---

## Recommended Path: Option B (True 4D-GS)

**Rationale**:
1. Motion is the CORE product differentiator
2. 4D-GS is production-ready (CVPR 2024, active development)
3. Better quality and performance than frame-sequence
4. Lower long-term storage costs
5. Desktop already has motion - need parity

**Implementation Plan**:

### Week 1: Pipeline Integration
- [ ] Clone and test 4DGaussians locally
- [ ] Create Modal worker variant for 4D-GS
- [ ] Test with sample multi-view video
- [ ] Export 4D model format

### Week 2: Viewer Development
- [ ] Research WebGL 4D-GS renderers (or port from PyTorch)
- [ ] Build timeline-aware viewer component
- [ ] Implement timestamp interpolation
- [ ] Test with exported 4D models

### Week 3: Integration
- [ ] Connect new viewer to editor
- [ ] Wire Timeline component to playback
- [ ] Database schema for 4D models
- [ ] Upload/download flow for 4D files

### Week 4: Polish & Testing
- [ ] Quality comparison with desktop
- [ ] Performance optimization
- [ ] Error handling
- [ ] Documentation

---

## Technical Requirements

### Processing (Modal Worker)

```python
# Changes needed to modal_worker.py

# Instead of:
# opensplat input_dir -n 15000 -o scene.ply

# Use:
# python train_4dgs.py -s input_dir --iterations 30000 --model_path output_dir

# Output:
# - point_cloud/iteration_30000/point_cloud.ply (canonical Gaussians)
# - deformation/ (learned deformation field)
```

### Database Schema

```sql
-- Add to scenes table:
ALTER TABLE scenes ADD COLUMN motion_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE scenes ADD COLUMN motion_duration FLOAT; -- seconds
ALTER TABLE scenes ADD COLUMN deformation_url TEXT; -- URL to deformation model
```

### Viewer API

```typescript
interface TemporalSplatViewer {
  // Load 4D model
  loadModel(plyUrl: string, deformationUrl: string): Promise<void>;

  // Set playback time (0 to duration)
  setTime(t: number): void;

  // Playback controls
  play(): void;
  pause(): void;
  setPlaybackSpeed(speed: number): void;

  // Events
  onTimeUpdate: (t: number) => void;
  onLoadProgress: (progress: number) => void;
}
```

---

## Open Questions

1. **4D-GS Web Renderer**: Does a WebGL implementation exist, or do we need to port from PyTorch/CUDA?
   - Possible lead: Check if gsplat.js or similar supports 4D
   - May need to build custom renderer

2. **Desktop Compatibility**: What format does gvdw use? Can we achieve format compatibility?
   - Need to examine gvdw repository in detail

3. **Processing Time**: 4D-GS training takes longer than static. What's acceptable?
   - D-NeRF benchmark: 8 minutes
   - Real scenes: Likely 30-60 minutes

4. **Memory Requirements**: 4D models require more VRAM. Do we need GPU tier upgrade?
   - Current: A10G (24GB)
   - May need: A100 (40GB) for complex scenes

---

## References

- [4D Gaussian Splatting - CVPR 2024](https://github.com/hustvl/4DGaussians)
- [OpenSplat](https://github.com/pierotofy/OpenSplat) - Current static pipeline
- [SuperSplat](https://superspl.at/editor) - Animation via camera paths (not 4D)
- [4DV.ai](https://4dv.ai) - Commercial 4D platform
- [MEGA: Memory-Efficient 4D-GS](https://openaccess.thecvf.com/content/ICCV2025/papers/Zhang_MEGA_Memory-Efficient_4D_Gaussian_Splatting_for_Dynamic_Scenes_ICCV_2025_paper.pdf)

---

## Next Steps

1. **Immediate**: Test 4DGaussians training locally with sample video
2. **This Week**: Evaluate WebGL rendering options
3. **Decision Point**: Choose Option B (full 4D-GS) or Option C (hybrid)
4. **Begin Implementation**: Based on decision

---

Document Version: 1.0
Last Updated: January 20, 2026
