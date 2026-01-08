# Game View GPU Processing (Modal)

This package contains the Modal-based GPU processing worker for converting videos to 3D Gaussian Splats using **GPU-accelerated Structure from Motion**.

## Key Features

- **GPU-Accelerated Pipeline**: Full CUDA acceleration for COLMAP and GLOMAP
- **cuDSS Bundle Adjustment**: 2-5x faster sparse reconstruction using NVIDIA's CUDA Direct Sparse Solver
- **Commercial-Ready**: Apache 2.0 licensed stack (COLMAP, GLOMAP, Ceres Solver)
- **Serverless GPUs**: Modal handles scaling and GPU provisioning

## Quick Start

### 1. Install Modal CLI

```bash
pip install modal
```

### 2. Authenticate with Modal

```bash
modal token new
```

This opens a browser to authenticate. Your token is automatically saved.

### 3. Create Supabase Secret in Modal

The worker needs access to Supabase for downloading videos and uploading results:

```bash
modal secret create supabase-credentials \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 4. Deploy the Worker

```bash
cd packages/processing
modal deploy modal_worker.py
```

**Note:** First deployment takes 30-60 minutes to build the GPU-accelerated image with CUDA-enabled COLMAP, GLOMAP, and Ceres Solver.

### 5. Configure Vercel Environment

Add to Vercel environment variables:
- `MODAL_ENDPOINT_URL` = `https://<username>--gameview-processing-trigger.modal.run`

### 6. Test the Deployment

```bash
# Run a test locally (uses Modal's cloud GPUs)
modal run modal_worker.py
```

## Architecture

```
┌─────────────────┐      ┌─────────────────────────────────────┐      ┌─────────────────┐
│  Studio App     │      │           Modal GPU Worker          │      │   Supabase      │
│  (Vercel)       │──────│  ┌─────────────────────────────┐   │──────│   Storage       │
│                 │      │  │   CUDA 12.4 + cuDSS 0.3     │   │      │                 │
└────────┬────────┘      │  │   Ceres 2.2 (CUDA enabled)  │   │      └─────────────────┘
         │               │  │   COLMAP 3.9.1 (GPU)        │   │
         │ 1. Trigger    │  │   GLOMAP (GPU BA)           │   │
         │ via webhook   │  │   3DGS Training             │   │
         │ ──────────────│  └─────────────────────────────┘   │
         │               │              │                      │
         │               │  3. Download │ 4. Extract frames    │
         │               │  5. COLMAP feature extraction (GPU) │
         │               │  6. COLMAP matching (GPU)           │
         │               │  7. GLOMAP sparse recon (GPU BA)    │
         │               │  8. Train Gaussian Splats (GPU)     │
         │               │  9. Upload results                  │
         │ 10. Callback ─│──────────────┘                      │
         │               └─────────────────────────────────────┘
```

## Processing Pipeline

### GPU-Accelerated Steps

| Stage | Tool | GPU Acceleration |
|-------|------|------------------|
| **Frame Extraction** | FFmpeg | Hardware decode (NVDEC) |
| **Feature Extraction** | COLMAP | CUDA SIFT (SiftGPU) |
| **Feature Matching** | COLMAP | CUDA exhaustive matching |
| **Sparse Reconstruction** | GLOMAP | cuDSS bundle adjustment |
| **3DGS Training** | gsplat | Full CUDA training |

### Pipeline Flow

1. **Download** - Fetch source videos from Supabase Storage
2. **Frame Extraction** - Use FFmpeg with NVDEC hardware decode
3. **Feature Extraction** - COLMAP with CUDA-accelerated SIFT
4. **Feature Matching** - COLMAP GPU exhaustive matcher
5. **Sparse Reconstruction** - GLOMAP with GPU-accelerated bundle adjustment
6. **Gaussian Splatting** - Train 3D Gaussian Splats on GPU
7. **Export** - Generate PLY file, cameras.json, and thumbnail
8. **Upload** - Push results to Supabase Storage
9. **Callback** - Notify Studio app of completion

## Technology Stack

### Licensing

All components use commercially-friendly open source licenses:

| Component | License | Commercial Use |
|-----------|---------|----------------|
| COLMAP | BSD-3-Clause | ✅ Yes |
| GLOMAP | Apache 2.0 | ✅ Yes |
| Ceres Solver | Apache 2.0 | ✅ Yes |
| cuDSS | NVIDIA EULA | ✅ Yes (with NVIDIA GPUs) |
| gsplat | Apache 2.0 | ✅ Yes |

### Build Components

The Modal image includes:

- **Base**: `nvidia/cuda:12.4.0-devel-ubuntu22.04`
- **cuDSS 0.3.0**: CUDA Direct Sparse Solver for GPU bundle adjustment
- **Ceres Solver 2.2**: Built from source with `-DUSE_CUDA=ON`
- **COLMAP 3.9.1**: Built from source with `-DCUDA_ENABLED=ON`
- **GLOMAP**: Latest, using CUDA-enabled Ceres
- **CMake 3.28+**: Required for modern CUDA builds
- **CUDA Architectures**: 70 (Volta), 75 (Turing/T4), 80 (Ampere/A10G), 86 (RTX 30xx), 89 (Ada)

## Configuration

### Quality Presets

| Preset | Steps | Max Splats | FPS | Duration | Est. Processing |
|--------|-------|------------|-----|----------|-----------------|
| Fast | 5,000 | 5M | 15 | 5 min | ~5-10 min |
| Balanced | 15,000 | 10M | 24 | 10 min | ~15-25 min |
| High | 30,000 | 20M | 30 | 15 min | ~30-45 min |

### GPU Options

Modify `modal_worker.py` to change GPU type:

```python
@app.function(
    gpu="T4",      # Default: Good for most jobs
    # gpu="A10G",  # Faster: 2x performance
    # gpu="A100",  # Fastest: For large scenes
)
```

### Performance Expectations

With GPU-accelerated bundle adjustment:

| Video Duration | Frames @ 24fps | CPU Time | GPU Time (Est.) |
|----------------|----------------|----------|-----------------|
| 10 seconds | 240 | ~60 min | ~10-15 min |
| 30 seconds | 720 | ~3+ hours | ~25-35 min |
| 60 seconds | 1440 | ~8+ hours | ~45-60 min |

## Costs

Modal charges per-second of GPU usage:

- **T4**: ~$0.000028/sec (~$0.10/hr)
- **A10G**: ~$0.000083/sec (~$0.30/hr)
- **A100**: ~$0.000556/sec (~$2.00/hr)

Typical processing costs (with GPU acceleration):
- Fast preset: 5-10 min → ~$0.02-0.05
- Balanced preset: 15-25 min → ~$0.05-0.10
- High preset: 30-45 min → ~$0.10-0.20

## Environment Variables

### Vercel (Studio App)

```bash
MODAL_ENDPOINT_URL=https://<username>--gameview-processing-trigger.modal.run
INTERNAL_API_URL=https://your-app.vercel.app  # For callbacks
```

### Modal Secrets

```bash
# Create Supabase credentials
modal secret create supabase-credentials \
  SUPABASE_URL="https://xxx.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

## Troubleshooting

### "Function not found" Error

Make sure you've deployed the function:
```bash
modal deploy modal_worker.py
```

### "Secret not found" Error

Create the Supabase secret:
```bash
modal secret create supabase-credentials ...
```

### Processing Stuck

Check Modal logs:
```bash
modal app logs gameview-processing
```

### GPU Not Detected

If logs show "NVIDIA Driver was not detected":
1. Ensure the Modal image uses a CUDA base image
2. Verify GPU is requested in the function decorator
3. Check Modal dashboard for GPU availability

### COLMAP/GLOMAP Fails

Common issues:
- **Not enough overlap**: Ensure camera angles have 60%+ overlap
- **Poor image quality**: Check video resolution and lighting
- **Too few frames**: Increase FPS or video duration
- **Permission denied**: Ensure binaries have execute permissions

### Build Takes Too Long

First deployment builds the entire CUDA toolchain (~30-60 minutes). Subsequent deployments use cached layers and are much faster (~2-5 minutes).

## Development

### Local Testing

```bash
# Run the worker locally (still uses Modal's GPUs)
modal run modal_worker.py

# Run with custom arguments
modal run modal_worker.py::process_production \
  --production-id test123 \
  --source-videos '[{"url": "...", "filename": "video.mp4"}]'
```

### Updating the Image

After modifying `modal_worker.py`:
```bash
modal deploy modal_worker.py
```

If you change the image build commands, expect a longer rebuild.

## Architecture Decisions

### Why GLOMAP over pure COLMAP?

GLOMAP (Global Structure-from-Motion) offers:
- **Global optimization**: More robust to drift than incremental SfM
- **GPU bundle adjustment**: Via CUDA-enabled Ceres Solver
- **Faster convergence**: Especially for large image sets

### Why cuDSS?

NVIDIA cuDSS (CUDA Direct Sparse Solver) accelerates the bundle adjustment step:
- **2-5x speedup** on sparse linear systems
- **Reduced memory**: More efficient than dense solvers
- **Seamless integration**: Drop-in replacement via Ceres

### Why Apache 2.0 Stack?

We evaluated alternatives:
- **MASt3R**: CC BY-NC-SA 4.0 (non-commercial only) ❌
- **InstantSplat**: Custom license requiring consent ❌
- **GLOMAP + COLMAP**: Apache 2.0 / BSD-3 (commercial ready) ✅

## References

- [GLOMAP Paper](https://arxiv.org/abs/2404.11324)
- [COLMAP Documentation](https://colmap.github.io/)
- [Ceres Solver CUDA Support](http://ceres-solver.org/installation.html#cuda)
- [cuDSS Documentation](https://developer.nvidia.com/cudss)
- [Modal Documentation](https://modal.com/docs)
