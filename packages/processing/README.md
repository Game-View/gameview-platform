# Game View GPU Processing (Modal)

This package contains the Modal-based GPU processing worker for converting videos to 3D Gaussian Splats.

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

### 5. Get API Token for Vercel

1. Go to [Modal Dashboard](https://modal.com/settings) → API Tokens
2. Create a new token
3. Add to Vercel environment variables:
   - `MODAL_API_TOKEN` = your token

### 6. Test the Deployment

```bash
# Run a test locally (uses Modal's cloud GPUs)
modal run modal_worker.py
```

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Studio App     │      │     Modal       │      │   Supabase      │
│  (Vercel)       │──────│   GPU Worker    │──────│   Storage       │
│                 │      │   (T4/A10G)     │      │                 │
└────────┬────────┘      └────────┬────────┘      └─────────────────┘
         │                        │
         │ 1. Create production   │
         │ 2. Trigger Modal ──────│
         │                        │ 3. Download videos
         │                        │ 4. Extract frames
         │                        │ 5. Run COLMAP
         │                        │ 6. Train splats
         │                        │ 7. Upload results
         │ 8. Callback ───────────│
         │                        │
```

## Processing Pipeline

1. **Download** - Fetch source videos from Supabase Storage
2. **Frame Extraction** - Use FFmpeg to extract frames at configured FPS
3. **COLMAP** - Structure from Motion for camera pose estimation
4. **Gaussian Splatting** - Train 3D Gaussian Splats from frames
5. **Export** - Generate PLY file, cameras.json, and thumbnail
6. **Upload** - Push results to Supabase Storage
7. **Callback** - Notify Studio app of completion

## Configuration

### Quality Presets

| Preset | Steps | Max Splats | FPS | Duration |
|--------|-------|------------|-----|----------|
| Fast | 5,000 | 5M | 5 | 5 min |
| Balanced | 15,000 | 10M | 10 | 10 min |
| High | 30,000 | 20M | 15 | 15 min |

### GPU Options

Modify `modal_worker.py` to change GPU type:

```python
@app.function(
    gpu="T4",      # Default: ~$0.10/hr
    # gpu="A10G",  # Faster: ~$0.30/hr
    # gpu="A100",  # Fastest: ~$2.00/hr
)
```

## Costs

Modal charges per-second of GPU usage:

- **T4**: ~$0.000028/sec (~$0.10/hr)
- **A10G**: ~$0.000083/sec (~$0.30/hr)
- **A100**: ~$0.000556/sec (~$2.00/hr)

Typical processing times:
- Fast preset: 5-10 min → ~$0.05-0.10
- Balanced preset: 15-30 min → ~$0.15-0.30
- High preset: 30-60 min → ~$0.30-0.60

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

### COLMAP Fails

COLMAP may fail if:
- Not enough overlap between video frames
- Poor image quality
- Too few frames extracted

Try increasing FPS or using the High quality preset.
