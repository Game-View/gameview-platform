# Game View: Branch Separation Guide

**Purpose:** Prevent crossover between Production and R&D work streams
**Date:** January 2026

---

## Branch Structure

| Branch | Purpose | Owner Session |
|--------|---------|---------------|
| `claude/resume-project-new-partner-Ua5KV` | **PRODUCTION** - Beta sprint, shipping features | Production Session |
| `claude/game-view-labs-3d-IXV7z` | **R&D** - Experimental 3D reconstruction | R&D Session |

---

## What Belongs Where

### Production Branch (Beta Sprint)
- COLMAP + GLOMAP pipeline (stable, proven)
- Studio app features (upload, viewer, publishing)
- Player app (3D viewer, game mechanics)
- Object Library (GLB assets)
- Game mechanics (scavenger hunt)
- Vercel deployment configs
- Modal GPU worker (production pipeline only)

### R&D Branch (Experimental)
- SLAM3R experiments
- DUST3R / MASt3R testing
- Feed-forward Gaussian Splatting
- Neural SfM research
- Performance benchmarks
- Alternative pipelines

---

## Recent Crossover Incident

### What Happened
1. R&D work on SLAM3R/pycuda required `clang` compiler
2. This dependency accidentally got committed to production branch
3. Modal builds on production started failing with pycuda errors

### Resolution
- Removed `clang` dependency from production `modal_worker.py`
- Production pipeline uses only COLMAP + GLOMAP (no SLAM3R)
- Commit: `fe9a167 fix: Remove clang/SLAM3R dependency from production pipeline`

---

## Prevention Rules

### For Production Session
1. **Never add** packages for SLAM3R, DUST3R, pycuda, or experimental pipelines
2. **Keep modal_worker.py** focused on: COLMAP + GLOMAP + gsplat only
3. **If unsure** whether something is R&D, don't add it

### For R&D Session
1. **Create separate Modal app** for experiments (e.g., `gameview-research`)
2. **Never push** experimental code to production branch
3. **Document experiments** in R&D branch only
4. **When ready to integrate:** Create a clean PR with just the proven changes

---

## How to Verify Branch State

### Check for R&D contamination:
```bash
# Should return empty on production branch
grep -r "slam3r\|SLAM3R\|dust3r\|DUST3R\|pycuda" packages/processing/
```

### Check Modal worker dependencies:
```bash
# Should NOT contain: clang, pycuda, torch-related R&D packages
grep -A 50 "apt_install" packages/processing/modal_worker.py
```

---

## Current Production Pipeline

```
Video Upload → FFmpeg Frames → COLMAP Features → GLOMAP SfM → Gaussian Splats → PLY Output
```

**Key dependencies (production only):**
- COLMAP 3.9.1 (with `#include <memory>` patch)
- GLOMAP (latest from colmap/glomap)
- Ceres 2.2 with CUDA
- cuDSS 0.3.0
- No neural networks, no PyTorch, no pycuda

---

## Questions?

If there's any doubt about whether a change belongs on production:
1. Ask: "Is this experimental or proven?"
2. Ask: "Does this add new dependencies?"
3. Ask: "Would this break the current stable pipeline?"

If any answer suggests R&D, it goes on the R&D branch.
