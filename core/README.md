# gvcore-cli

Qt-free command-line tool for 3D reconstruction from multi-camera video.

## Overview

`gvcore-cli` is the processing engine used by all Game View products. It handles:

1. **Frame Extraction** - Extract synchronized frames from multiple video files
2. **Structure from Motion** - Run COLMAP for camera pose estimation
3. **Gaussian Splatting** - Train 3D Gaussian Splat model using Brush
4. **Export** - Generate PLY file for viewing

## Building

The CLI is built separately from this monorepo. See the main gvdw repository for build instructions.

### Requirements

- CMake 3.19+
- C++17 compiler
- OpenCV (optional, for frame extraction)
- COLMAP (external, called via subprocess)
- Brush (external, called via subprocess or FFI)

### Build Commands

```bash
# From gvdw repository root
mkdir build && cd build
cmake -DGVDW_BUILD_CLI_ONLY=ON ..
cmake --build .
```

## Usage

```bash
# Create a new production
gvcore-cli create --name "My Production" --output /path/to/output

# Add videos
gvcore-cli add-videos --production /path/to/production.json \
  --video camera1.mp4 --video camera2.mp4

# Apply preset
gvcore-cli apply-preset --production /path/to/production.json --preset balanced

# Process
gvcore-cli process --production /path/to/production.json

# Or run everything in one command
gvcore-cli run \
  --video camera1.mp4 --video camera2.mp4 \
  --output /path/to/output \
  --preset balanced
```

## JSON Output

When run with `--json` flag (default), the CLI outputs JSON progress messages:

```json
{"stage": "extracting_frames", "progress": 25.0, "message": "Extracting frames from video 1/2"}
{"stage": "running_colmap", "progress": 50.0, "message": "Running feature extraction"}
{"stage": "running_brush", "progress": 75.0, "message": "Training iteration 1000/7000"}
{"stage": "completed", "progress": 100.0, "message": "Output saved to /path/to/output.ply"}
```

## Presets

| Preset | Frames | COLMAP Quality | Brush Iterations |
|--------|--------|----------------|------------------|
| fast | 100 | low | 3000 |
| balanced | 200 | medium | 7000 |
| high | 300 | high | 15000 |
| maximum | 500 | extreme | 30000 |

## Integration

### Tauri Desktop

The desktop app spawns `gvcore-cli` as a subprocess and parses JSON output for progress updates.

```rust
let child = Command::new("gvcore-cli")
    .args(["process", "--production", path])
    .stdout(Stdio::piped())
    .spawn()?;
```

### Server (Game View Hub)

The server uses BullMQ to queue processing jobs that spawn `gvcore-cli`:

```typescript
const job = await processingQueue.add('process', {
  productionPath: '/path/to/production.json',
  preset: 'balanced',
});
```

## Source Location

The source code for gvcore-cli is maintained in the main gvdw repository:

- `core/` - Core library (Qt-free)
- `cli/` - CLI application
- `CMakeLists.txt` - Build configuration

This `core/` directory in the monorepo is for documentation and reference only.
The actual binary is built separately and bundled with the desktop app.
