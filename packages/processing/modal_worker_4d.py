"""
Game View - Modal GPU Processing Worker for 4D Gaussian Splatting

This Modal app handles video-to-4D Gaussian Splatting processing for MOTION capture.

Pipeline:
1. Download source videos from Supabase
2. Extract frames with TIMESTAMPS preserved
3. Organize frames by camera view
4. Run COLMAP for camera pose estimation
5. Train 4D Gaussian Splatting (temporal motion)
6. Export per-frame PLY files
7. Upload results to Supabase (frames + metadata)
8. Callback to notify completion

Key difference from static pipeline:
- Uses 4DGaussians instead of OpenSplat
- Preserves temporal information
- Exports PER-FRAME PLY files for motion playback
- Outputs metadata.json with frame URLs and timing

Based on: https://github.com/hustvl/4DGaussians (CVPR 2024)
SfM: COLMAP (apt package)
"""

import modal
import os
import json
import subprocess
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
import urllib.request
import urllib.parse

# Modal app definition
app = modal.App("gameview-4d-processing")

# GPU image with CUDA + COLMAP + 4DGaussians dependencies
# Fully cloud-based, no local processing required
# Cache buster v3: Fix CUDA arch detection for rasterizer build
processing_image_4d = (
    modal.Image.from_registry("pytorch/pytorch:2.1.0-cuda12.1-cudnn8-devel")
    .env({
        "DEBIAN_FRONTEND": "noninteractive",
        "TZ": "UTC",
        # Set CUDA architectures for building without GPU present
        # 7.0=V100, 7.5=T4, 8.0=A100, 8.6=A10G/RTX3090, 8.9=L4/RTX4090
        "TORCH_CUDA_ARCH_LIST": "7.0;7.5;8.0;8.6;8.9+PTX",
    })
    .apt_install([
        "git",
        "wget",
        "ffmpeg",
        "ninja-build",
        "build-essential",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "colmap",  # SfM for camera pose estimation
    ])
    .pip_install([
        # Core dependencies
        "numpy",
        "opencv-python-headless",
        "Pillow",
        "plyfile",
        "tqdm",
        "scipy",
        "lpips",
        "tensorboard",
        "roma",  # Rotation utilities
        # Supabase and API
        "requests",
        "supabase",
        "fastapi",
    ])
    .run_commands([
        # Clone 4DGaussians
        "git clone https://github.com/hustvl/4DGaussians.git /opt/4DGaussians",
        "cd /opt/4DGaussians && git submodule update --init --recursive",
        # Build 4DGaussians CUDA extensions
        "cd /opt/4DGaussians && pip install -e submodules/depth-diff-gaussian-rasterization",
        "cd /opt/4DGaussians && pip install -e submodules/simple-knn",
    ])
)

# Secrets for Supabase access
supabase_secret = modal.Secret.from_name("supabase-credentials")


def send_progress(callback_url: str, production_id: str, stage: str, progress: int, message: str = ""):
    """Send progress update to Studio API."""
    import requests

    progress_url = callback_url.replace("/api/processing/callback", "/api/processing/progress")

    try:
        response = requests.post(
            progress_url,
            json={
                "production_id": production_id,
                "stage": stage,
                "progress": progress,
                "message": message,
            },
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print(f"[{production_id}] Progress update: {stage} {progress}% - {response.status_code}")
    except Exception as e:
        print(f"[{production_id}] Progress update failed: {e}")


def organize_frames_for_4dgs(frames_dir: Path, output_dir: Path, fps: float) -> dict:
    """
    Organize extracted frames into 4DGaussians multipleview format.

    4DGaussians expects:
    data/multipleview/scene_name/
        cam01/frame_00001.jpg, frame_00002.jpg, ...
        cam02/frame_00001.jpg, frame_00002.jpg, ...
        ...

    For single-camera video, we treat it as cam01.
    For multi-camera, we use the existing cam## directories.

    Returns metadata about the frames.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Check if frames are already organized by camera
    cam_dirs = sorted([d for d in frames_dir.iterdir() if d.is_dir() and d.name.startswith("cam")])

    if cam_dirs:
        # Multi-camera setup - copy structure
        frame_count = 0
        for cam_dir in cam_dirs:
            dest_cam = output_dir / cam_dir.name
            dest_cam.mkdir(exist_ok=True)

            frames = sorted(cam_dir.glob("*.jpg"))
            for i, frame in enumerate(frames):
                dest_path = dest_cam / f"frame_{i+1:05d}.jpg"
                shutil.copy(frame, dest_path)
                frame_count = max(frame_count, i + 1)

        return {
            "num_cameras": len(cam_dirs),
            "num_frames": frame_count,
            "fps": fps,
            "duration": frame_count / fps,
        }
    else:
        # Single camera - all frames in one directory
        all_frames = sorted(frames_dir.glob("*.jpg"))
        cam_dir = output_dir / "cam01"
        cam_dir.mkdir(exist_ok=True)

        for i, frame in enumerate(all_frames):
            dest_path = cam_dir / f"frame_{i+1:05d}.jpg"
            shutil.copy(frame, dest_path)

        return {
            "num_cameras": 1,
            "num_frames": len(all_frames),
            "fps": fps,
            "duration": len(all_frames) / fps,
        }


def create_4dgs_config(config_path: Path, num_frames: int, iterations: int = 30000):
    """
    Create a 4DGaussians configuration file for training.
    """
    # Temporal resolution should be about half the frame count
    temporal_resolution = max(10, num_frames // 2)

    config_content = f'''
# 4DGaussians configuration for Game View
# Auto-generated for {num_frames} frames

ModelHiddenParams = dict(
    kplanes_config = dict(
        grid_dimensions = 2,
        input_coordinate_dim = 4,
        output_coordinate_dim = 32,
        resolution = [64, 64, 64, {temporal_resolution}]
    ),
    multires = [1, 2, 4, 8],
    defor_depth = 1,
    net_width = 64,
    plane_tv_weight = 0.0001,
    time_smoothness_weight = 0.01,
    l1_time_planes = 0.0001,
    no_do = True,
    no_dshs = True,
)

OptimizationParams = dict(
    dataloader = True,
    iterations = {iterations},
    coarse_iterations = 3000,
    batch_size = 1,
    densify_until_iter = 15000,
)
'''
    config_path.write_text(config_content)
    return config_path


@app.function(
    image=processing_image_4d,
    gpu="A10G",  # 24GB VRAM
    timeout=43200,  # 12 hours max - 4D training takes longer
    secrets=[supabase_secret],
)
def process_production_4d(
    production_id: str,
    experience_id: str,
    source_videos: list[dict],
    settings: dict,
    callback_url: str,
) -> dict:
    """
    Process a production job with 4D Gaussian Splatting for MOTION.

    This produces per-frame PLY files that can be played back as motion.

    Args:
        production_id: Unique ID for this production
        experience_id: Associated experience ID
        source_videos: List of {url, filename, size} dicts
        settings: Processing settings including:
            - fps: Frame extraction rate (default: 15)
            - maxFrames: Maximum frames to process (default: 150)
            - iterations: 4D-GS training iterations (default: 30000)
            - motionEnabled: Should be True for this endpoint
        callback_url: URL to POST results when complete

    Returns:
        dict with success status and output URLs including:
            - frameUrls: Array of PLY URLs for each timestamp
            - metadataUrl: URL to metadata.json
            - thumbnailUrl: URL to thumbnail
    """
    import requests
    from supabase import create_client

    # Initialize Supabase client
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    work_dir = Path(tempfile.mkdtemp(prefix=f"gv4d-{production_id}-"))
    input_dir = work_dir / "input"
    frames_dir = work_dir / "frames"
    data_dir = work_dir / "data" / "multipleview" / production_id
    colmap_dir = work_dir / "colmap"
    output_dir = work_dir / "output"
    model_dir = output_dir / "model"
    frames_output_dir = output_dir / "frames"

    for d in [input_dir, frames_dir, data_dir, colmap_dir, output_dir, model_dir, frames_output_dir]:
        d.mkdir(parents=True, exist_ok=True)

    result = {
        "success": False,
        "production_id": production_id,
        "experience_id": experience_id,
        "outputs": None,
        "error": None,
        "motion_enabled": True,
    }

    try:
        # Stage 1: Download videos
        send_progress(callback_url, production_id, "downloading", 5, "Downloading videos")
        print(f"[{production_id}] Downloading {len(source_videos)} videos...")
        video_paths = []
        for i, video in enumerate(source_videos):
            video_path = input_dir / video["filename"]
            print(f"  Downloading {video['filename']}...")
            urllib.request.urlretrieve(video["url"], str(video_path))
            video_paths.append(video_path)

        # Stage 2: Extract frames with timestamp preservation
        send_progress(callback_url, production_id, "frame_extraction", 10, "Extracting frames with timestamps")
        print(f"[{production_id}] Extracting frames for 4D motion...")

        fps = settings.get("fps", 15)  # Higher FPS for motion (vs 3 for static)
        max_frames = settings.get("maxFrames", 150)  # Fewer frames needed for 4D

        for i, video_path in enumerate(video_paths):
            cam_frames_dir = frames_dir / f"cam{i:02d}"
            cam_frames_dir.mkdir(exist_ok=True)

            # Extract frames at specified FPS
            cmd = [
                "ffmpeg", "-i", str(video_path),
                "-vf", f"fps={fps}",
                "-q:v", "2",
                str(cam_frames_dir / "frame_%05d.jpg")
            ]
            subprocess.run(cmd, check=True, capture_output=True)

            frames = sorted(cam_frames_dir.glob("*.jpg"))
            print(f"  Extracted {len(frames)} frames from {video_path.name}")

            # Cap frames per camera
            if len(frames) > max_frames:
                print(f"  Capping to {max_frames} frames...")
                step = len(frames) / max_frames
                keep_indices = set(int(i * step) for i in range(max_frames))
                for j, frame in enumerate(frames):
                    if j not in keep_indices:
                        frame.unlink()

        # Organize frames for 4DGaussians
        frame_metadata = organize_frames_for_4dgs(frames_dir, data_dir, fps)
        print(f"[{production_id}] Organized {frame_metadata['num_frames']} frames from {frame_metadata['num_cameras']} camera(s)")

        # Stage 3: Run COLMAP for camera poses
        send_progress(callback_url, production_id, "colmap_features", 20, "Extracting image features")
        print(f"[{production_id}] Running COLMAP...")

        # Collect all frames into single directory for COLMAP
        # Use camera prefix naming so COLMAP can group images by camera
        # Format: cam00_frame_00001.jpg, cam00_frame_00002.jpg, cam01_frame_00001.jpg, etc.
        colmap_images = colmap_dir / "images"
        colmap_images.mkdir(exist_ok=True)

        num_cameras = 0
        total_frames = 0
        for cam_dir in sorted(data_dir.iterdir()):
            if cam_dir.is_dir() and cam_dir.name.startswith("cam"):
                cam_name = cam_dir.name  # e.g., "cam00", "cam01"
                num_cameras += 1
                for frame in sorted(cam_dir.glob("*.jpg")):
                    # Preserve camera info in filename for COLMAP camera grouping
                    new_name = f"{cam_name}_{frame.name}"  # e.g., "cam00_frame_00001.jpg"
                    shutil.copy(frame, colmap_images / new_name)
                    total_frames += 1

        print(f"[{production_id}] Total frames for COLMAP: {total_frames} from {num_cameras} camera(s)")

        database_path = colmap_dir / "database.db"

        # Create environment with offscreen Qt for COLMAP on headless servers
        # COLMAP's GPU feature extraction uses Qt internally, which needs a display
        colmap_env = os.environ.copy()
        colmap_env["QT_QPA_PLATFORM"] = "offscreen"

        # Feature extraction - configure for multi-camera setup
        # DO NOT use single_camera=1 for multi-camera footage!
        # Use OPENCV camera model which handles most camera types well
        feature_cmd = [
            "colmap", "feature_extractor",
            "--database_path", str(database_path),
            "--image_path", str(colmap_images),
            "--ImageReader.camera_model", "OPENCV",
            # For multi-camera: each camera gets its own intrinsics
            # COLMAP will group images by prefix automatically
            "--ImageReader.single_camera", "0",
            # GPU acceleration for faster processing
            "--SiftExtraction.use_gpu", "1",
            # Limit image size to manage memory with many frames
            "--SiftExtraction.max_image_size", "1600",
            "--SiftExtraction.max_num_features", "8192",
        ]
        print(f"[{production_id}] Running: {' '.join(feature_cmd)}")

        proc = subprocess.run(feature_cmd, capture_output=True, text=True, env=colmap_env)
        if proc.returncode != 0:
            print(f"[{production_id}] Feature extraction stderr: {proc.stderr}")
            raise Exception(f"COLMAP feature extraction failed: {proc.stderr[:500]}")

        # Feature matching - use vocab tree for large image sets, sequential for small
        send_progress(callback_url, production_id, "colmap_matching", 30, "Matching features")

        if total_frames > 500:
            # For large sets, use exhaustive matching with spatial verification
            # This is more robust for multi-camera setups
            print(f"[{production_id}] Using exhaustive matching for {total_frames} frames")
            match_cmd = [
                "colmap", "exhaustive_matcher",
                "--database_path", str(database_path),
                "--SiftMatching.use_gpu", "1",
                "--SiftMatching.max_num_matches", "32768",
            ]
        else:
            # Sequential matcher works well for video frames from same camera
            print(f"[{production_id}] Using sequential matching for {total_frames} frames")
            match_cmd = [
                "colmap", "sequential_matcher",
                "--database_path", str(database_path),
                "--SiftMatching.use_gpu", "1",
                "--SequentialMatching.overlap", "10",
                "--SequentialMatching.quadratic_overlap", "1",
            ]

        proc = subprocess.run(match_cmd, capture_output=True, text=True, env=colmap_env)
        if proc.returncode != 0:
            print(f"[{production_id}] Feature matching stderr: {proc.stderr}")
            raise Exception(f"COLMAP feature matching failed: {proc.stderr[:500]}")

        # Sparse reconstruction with COLMAP
        send_progress(callback_url, production_id, "colmap_mapper", 40, "Reconstructing 3D structure")
        sparse_dir = colmap_dir / "sparse"
        sparse_dir.mkdir(exist_ok=True)

        # Mapper settings optimized for multi-camera video footage
        mapper_cmd = [
            "colmap", "mapper",
            "--database_path", str(database_path),
            "--image_path", str(colmap_images),
            "--output_path", str(sparse_dir),
            # Multi-camera specific settings
            "--Mapper.ba_refine_focal_length", "1",
            "--Mapper.ba_refine_principal_point", "0",
            "--Mapper.ba_refine_extra_params", "1",
            # Robustness settings for multi-view
            "--Mapper.min_num_matches", "15",
            "--Mapper.init_min_num_inliers", "100",
            "--Mapper.abs_pose_min_num_inliers", "30",
            "--Mapper.filter_max_reproj_error", "4.0",
            # Try to register more images
            "--Mapper.multiple_models", "0",
        ]
        print(f"[{production_id}] Running: {' '.join(mapper_cmd)}")

        proc = subprocess.run(mapper_cmd, capture_output=True, text=True, env=colmap_env)
        if proc.returncode != 0:
            print(f"[{production_id}] COLMAP mapper stderr: {proc.stderr}")
            print(f"[{production_id}] COLMAP mapper stdout: {proc.stdout}")
            raise Exception(f"COLMAP sparse reconstruction failed: {proc.stderr[:500]}")

        # Find the reconstruction model
        model_subdir = None
        for subdir in sorted(sparse_dir.iterdir()):
            if subdir.is_dir() and (subdir / "cameras.bin").exists():
                model_subdir = subdir
                break

        if not model_subdir:
            raise Exception("COLMAP reconstruction failed - no valid model")

        # Copy sparse model to 4DGaussians expected location
        sparse_4dgs = data_dir / "sparse_"
        sparse_4dgs.mkdir(exist_ok=True)
        for f in model_subdir.iterdir():
            shutil.copy(f, sparse_4dgs / f.name)

        # Export point cloud for 4DGaussians
        points_ply = data_dir / "points3D_multipleview.ply"
        subprocess.run([
            "colmap", "model_converter",
            "--input_path", str(model_subdir),
            "--output_path", str(points_ply),
            "--output_type", "PLY",
        ], check=True, capture_output=True, env=colmap_env)

        # Stage 4: Train 4D Gaussian Splatting
        send_progress(callback_url, production_id, "training_4d", 50, "Training 4D Gaussian Splatting (this takes a while)")
        print(f"[{production_id}] Training 4D Gaussian Splatting...")

        iterations = settings.get("iterations", 30000)

        # Create config file
        config_path = work_dir / "config.py"
        create_4dgs_config(config_path, frame_metadata["num_frames"], iterations)

        # Run 4DGaussians training
        train_cmd = [
            "python", "/opt/4DGaussians/train.py",
            "-s", str(data_dir),
            "--port", "6017",
            "--expname", production_id,
            "--configs", str(config_path),
            "--model_path", str(model_dir),
        ]

        print(f"[{production_id}] Running: {' '.join(train_cmd)}")

        process = subprocess.Popen(
            train_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd="/opt/4DGaussians",
        )

        for line in process.stdout:
            line = line.strip()
            if line:
                print(f"[4DGS] {line}")
                # Parse training progress
                if "Iteration" in line and "/" in line:
                    try:
                        parts = line.split()
                        for p in parts:
                            if "/" in p and p[0].isdigit():
                                current, total = p.split("/")
                                pct = int(current) / int(total) * 100
                                overall_pct = 50 + int(pct * 0.3)  # 50-80%
                                send_progress(callback_url, production_id, "training_4d", overall_pct, f"Training {current}/{total}")
                                break
                    except:
                        pass

        return_code = process.wait()
        if return_code != 0:
            raise Exception(f"4DGaussians training failed with code {return_code}")

        print(f"[{production_id}] 4DGaussians training completed!")

        # Stage 5: Export per-frame PLY files
        send_progress(callback_url, production_id, "exporting", 85, "Exporting per-frame PLY files")
        print(f"[{production_id}] Exporting per-frame PLY files...")

        export_cmd = [
            "python", "/opt/4DGaussians/export_perframe_3DGS.py",
            "--iteration", str(iterations),
            "--configs", str(config_path),
            "--model_path", str(model_dir),
        ]

        subprocess.run(export_cmd, check=True, cwd="/opt/4DGaussians")

        # Find exported frames
        gaussian_frames_dir = model_dir / "gaussian_pertimestamp"
        if not gaussian_frames_dir.exists():
            raise Exception("Per-frame export failed - no output directory")

        exported_frames = sorted(gaussian_frames_dir.glob("time_*.ply"))
        print(f"[{production_id}] Exported {len(exported_frames)} frame PLY files")

        if len(exported_frames) == 0:
            raise Exception("Per-frame export produced no files")

        # Copy frames to output directory with consistent naming
        for i, frame in enumerate(exported_frames):
            shutil.copy(frame, frames_output_dir / f"frame_{i:05d}.ply")

        # Create thumbnail from first video frame
        thumbnail_path = output_dir / "thumbnail.jpg"
        first_frame = next((data_dir / "cam00").glob("*.jpg"), None)
        if first_frame:
            shutil.copy(first_frame, thumbnail_path)

        # Stage 6: Upload to Supabase
        send_progress(callback_url, production_id, "uploading", 90, "Uploading results")
        print(f"[{production_id}] Uploading results...")

        bucket = "production-outputs"
        frame_urls = []

        # Upload each frame PLY
        output_frames = sorted(frames_output_dir.glob("frame_*.ply"))
        for i, frame_path in enumerate(output_frames):
            frame_key = f"{production_id}/frames/frame_{i:05d}.ply"
            with open(frame_path, "rb") as f:
                supabase.storage.from_(bucket).upload(
                    frame_key,
                    f.read(),
                    {"content-type": "application/octet-stream", "upsert": "true"}
                )
            frame_url = supabase.storage.from_(bucket).get_public_url(frame_key)
            frame_urls.append(frame_url)

            # Progress update every 10 frames
            if i % 10 == 0:
                pct = 90 + int((i / len(output_frames)) * 8)
                send_progress(callback_url, production_id, "uploading", pct, f"Uploading frame {i+1}/{len(output_frames)}")

        # Create and upload metadata
        metadata = {
            "motionEnabled": True,
            "frameCount": len(frame_urls),
            "fps": fps,
            "duration": len(frame_urls) / fps,
            "frameUrls": frame_urls,
            "createdAt": datetime.utcnow().isoformat(),
            "settings": {
                "iterations": iterations,
                "maxFrames": max_frames,
                "sourceFps": fps,
            }
        }

        metadata_path = output_dir / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2))

        with open(metadata_path, "rb") as f:
            supabase.storage.from_(bucket).upload(
                f"{production_id}/metadata.json",
                f.read(),
                {"content-type": "application/json", "upsert": "true"}
            )
        metadata_url = supabase.storage.from_(bucket).get_public_url(f"{production_id}/metadata.json")

        # Upload thumbnail
        thumbnail_url = None
        if thumbnail_path.exists():
            with open(thumbnail_path, "rb") as f:
                supabase.storage.from_(bucket).upload(
                    f"{production_id}/thumbnail.jpg",
                    f.read(),
                    {"content-type": "image/jpeg", "upsert": "true"}
                )
            thumbnail_url = supabase.storage.from_(bucket).get_public_url(f"{production_id}/thumbnail.jpg")

        # Also upload first frame as scene.ply for backwards compatibility
        if output_frames:
            with open(output_frames[0], "rb") as f:
                supabase.storage.from_(bucket).upload(
                    f"{production_id}/scene.ply",
                    f.read(),
                    {"content-type": "application/octet-stream", "upsert": "true"}
                )

        result["success"] = True
        result["outputs"] = {
            "motionEnabled": True,
            "frameUrls": frame_urls,
            "metadataUrl": metadata_url,
            "thumbnailUrl": thumbnail_url,
            "plyUrl": supabase.storage.from_(bucket).get_public_url(f"{production_id}/scene.ply"),  # First frame for compat
            "frameCount": len(frame_urls),
            "fps": fps,
            "duration": len(frame_urls) / fps,
        }

        print(f"[{production_id}] 4D Processing complete! {len(frame_urls)} frames uploaded.")

    except Exception as e:
        print(f"[{production_id}] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        result["error"] = str(e)

    finally:
        # Cleanup
        shutil.rmtree(work_dir, ignore_errors=True)

    # Send callback
    if callback_url:
        send_progress(callback_url, production_id, "complete", 100, "Processing complete")
        print(f"[{production_id}] Sending callback...")
        try:
            import requests
            callback_response = requests.post(
                callback_url,
                json=result,
                headers={"Content-Type": "application/json"},
                timeout=30,
            )
            print(f"[{production_id}] Callback response: {callback_response.status_code}")
        except Exception as e:
            print(f"[{production_id}] Callback failed: {e}")

    return result


@app.function(
    image=processing_image_4d,
    secrets=[supabase_secret],
)
@modal.fastapi_endpoint(method="POST")
def trigger_4d(data: dict) -> dict:
    """
    HTTP endpoint to trigger 4D motion processing.

    POST body:
    {
        "production_id": "...",
        "experience_id": "...",
        "source_videos": [...],
        "settings": {"motionEnabled": true, "fps": 15, ...},
        "callback_url": "..."
    }
    """
    print(f"[trigger_4d] Received 4D motion request for: {data.get('production_id')}")

    # Spawn the GPU processing function
    call = process_production_4d.spawn(
        production_id=data["production_id"],
        experience_id=data["experience_id"],
        source_videos=data["source_videos"],
        settings=data["settings"],
        callback_url=data["callback_url"],
    )

    return {
        "success": True,
        "message": "4D Motion processing started",
        "call_id": call.object_id,
        "production_id": data["production_id"],
        "motion_enabled": True,
    }


@app.local_entrypoint()
def main():
    """Test the 4D processing function locally."""
    print("4D Motion Modal worker ready. Deploy with: modal deploy modal_worker_4d.py")
