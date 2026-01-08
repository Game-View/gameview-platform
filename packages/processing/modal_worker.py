"""
Game View - Modal GPU Processing Worker

This Modal app handles video-to-3D Gaussian Splatting processing.

Pipeline:
1. Download source videos from Supabase
2. Extract frames using FFmpeg
3. Run COLMAP for feature extraction + matching
4. Run GLOMAP for fast sparse reconstruction (10-100x faster than COLMAP mapper)
5. Train Gaussian Splats
6. Export PLY and metadata
7. Upload results to Supabase
8. Callback to notify completion

Architecture note:
- GLOMAP is used as an abstraction layer for SfM
- Can be swapped for DUST3R or other backends in future
- Apache 2.0 license (commercial-ready)
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
app = modal.App("gameview-processing")

# GPU image with CUDA-accelerated COLMAP + GLOMAP
# Built with cuDSS for GPU-accelerated bundle adjustment (2-5x faster)
processing_image = (
    modal.Image.from_registry("nvidia/cuda:12.4.0-devel-ubuntu22.04", add_python="3.11")
    .apt_install([
        # Cache buster v2: Adding 'tree' + 'file' to invalidate Modal cache
        "tree",
        "file",
        "ffmpeg",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "wget",
        "git",
        "curl",
        # Build dependencies
        "ninja-build",
        "build-essential",
        "libboost-all-dev",
        "libeigen3-dev",
        "libflann-dev",
        "libfreeimage-dev",
        "libmetis-dev",
        "libgoogle-glog-dev",
        "libgflags-dev",
        "libgtest-dev",
        "libsqlite3-dev",
        "libssl-dev",
        "libatlas-base-dev",
        "libsuitesparse-dev",
        # OpenGL dependencies
        "libgl1-mesa-dev",
        "libglx-dev",
        "libglu1-mesa-dev",
        "libegl1-mesa-dev",
        "libglew-dev",
        "libglfw3-dev",
        # Qt5 for COLMAP (headless)
        "qtbase5-dev",
        "libqt5opengl5-dev",
        # CGAL for geometry algorithms
        "libcgal-dev",
    ])
    .run_commands([
        # Cache buster: v5 - FORCE REBUILD 2026-01-08T22:30
        "echo 'FORCE REBUILD v5: Patching COLMAP memory header'",
        "date",

        # === Install CMake 3.28+ ===
        "wget -q https://github.com/Kitware/CMake/releases/download/v3.28.3/cmake-3.28.3-linux-x86_64.tar.gz -O /tmp/cmake.tar.gz",
        "tar -xzf /tmp/cmake.tar.gz -C /opt",
        "ln -sf /opt/cmake-3.28.3-linux-x86_64/bin/cmake /usr/local/bin/cmake",
        "rm /tmp/cmake.tar.gz",

        # === Install cuDSS 0.3.0 (CUDA Direct Sparse Solver) ===
        # Required for GPU-accelerated bundle adjustment in Ceres
        "wget -q https://developer.download.nvidia.com/compute/cudss/redist/libcudss/linux-x86_64/libcudss-linux-x86_64-0.3.0.9_cuda12-archive.tar.xz -O /tmp/cudss.tar.xz",
        "mkdir -p /opt/cudss",
        "tar -xf /tmp/cudss.tar.xz -C /opt/cudss --strip-components=1",
        "rm /tmp/cudss.tar.xz",
        # Set up cuDSS paths
        "echo '/opt/cudss/lib' >> /etc/ld.so.conf.d/cudss.conf",
        "ldconfig",

        # === Build Ceres Solver 2.2 with CUDA support ===
        # Note: Ceres 2.2 has stable CUDA support
        "git clone --branch 2.2.0 --depth 1 https://github.com/ceres-solver/ceres-solver.git /opt/ceres-solver",
        "mkdir -p /opt/ceres-solver/build",
        "cd /opt/ceres-solver/build && /usr/local/bin/cmake .. "
        "-DCMAKE_BUILD_TYPE=Release "
        "-DBUILD_TESTING=OFF "
        "-DBUILD_EXAMPLES=OFF "
        "-DUSE_CUDA=ON "
        "-DCMAKE_CUDA_ARCHITECTURES='70;75;80;86;89' "
        "&& make -j$(nproc) && make install",

        # === Build COLMAP with CUDA ===
        # COLMAP 3.9.1 has a bug: missing #include <memory> in line.cc
        # Fix: Insert BEFORE 'extern "C"' block using pattern match
        # Cache buster v7 - INSERT BEFORE EXTERN C
        "rm -rf /opt/colmap && "
        "git clone --branch 3.9.1 --depth 1 https://github.com/colmap/colmap.git /opt/colmap && "
        "echo '>>> PATCHING line.cc to add #include <memory> <<<' && "
        "sed -i '/extern .C./i #include <memory>' /opt/colmap/src/colmap/image/line.cc && "
        "echo '>>> LINES 30-40 OF PATCHED FILE <<<' && "
        "sed -n '30,40p' /opt/colmap/src/colmap/image/line.cc && "
        "echo '>>> BUILDING COLMAP <<<' && "
        "mkdir -p /opt/colmap/build && "
        "cd /opt/colmap/build && "
        "/usr/local/bin/cmake .. "
        "-DCMAKE_BUILD_TYPE=Release "
        "-DCUDA_ENABLED=ON "
        "-DGUI_ENABLED=OFF "
        "-DCMAKE_CUDA_ARCHITECTURES='70;75;80;86;89' && "
        "make -j$(nproc) && "
        "make install",

        # === Build GLOMAP with CUDA-enabled Ceres ===
        "git clone --recursive https://github.com/colmap/glomap.git /opt/glomap",
        "mkdir -p /opt/glomap/build",
        "cd /opt/glomap/build && /usr/local/bin/cmake .. "
        "-DCMAKE_BUILD_TYPE=Release "
        "-GNinja "
        "&& ninja",
        "chmod 755 /opt/glomap/build/glomap/glomap",
        "cp /opt/glomap/build/glomap/glomap /usr/local/bin/glomap",
        "chmod 755 /usr/local/bin/glomap",

        # Verify installations
        "colmap -h || echo 'COLMAP verification failed'",
        "glomap --help || echo 'GLOMAP verification failed'",
    ])
    .pip_install([
        "numpy",
        "opencv-python-headless",
        "Pillow",
        "requests",
        "plyfile",
        "tqdm",
        "supabase",
        "fastapi",
    ])
)

# Secrets for Supabase access
supabase_secret = modal.Secret.from_name("supabase-credentials")


@app.function(
    image=processing_image,
    gpu="T4",  # Can upgrade to A10G or A100 for faster processing
    timeout=7200,  # 2 hours max (GLOMAP is CPU-only and can take time)
    secrets=[supabase_secret],
)
def process_production(
    production_id: str,
    experience_id: str,
    source_videos: list[dict],
    settings: dict,
    callback_url: str,
) -> dict:
    """
    Process a production job - convert videos to 3D Gaussian Splat.

    Args:
        production_id: Unique ID for this production
        experience_id: Associated experience ID
        source_videos: List of {url, filename, size} dicts
        settings: Processing settings {totalSteps, maxSplats, imagePercentage, fps, duration}
        callback_url: URL to POST results when complete

    Returns:
        dict with success status and output URLs
    """
    import requests
    from supabase import create_client

    # Initialize Supabase client
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    work_dir = Path(tempfile.mkdtemp(prefix=f"gv-{production_id}-"))
    input_dir = work_dir / "input"
    frames_dir = work_dir / "frames"
    colmap_dir = work_dir / "colmap"
    output_dir = work_dir / "output"

    for d in [input_dir, frames_dir, colmap_dir, output_dir]:
        d.mkdir(parents=True, exist_ok=True)

    result = {
        "success": False,
        "production_id": production_id,
        "experience_id": experience_id,
        "outputs": None,
        "error": None,
    }

    try:
        # Stage 1: Download videos
        print(f"[{production_id}] Downloading {len(source_videos)} videos...")
        video_paths = []
        for i, video in enumerate(source_videos):
            video_path = input_dir / video["filename"]
            print(f"  Downloading {video['filename']}...")
            urllib.request.urlretrieve(video["url"], str(video_path))
            video_paths.append(video_path)

        # Stage 2: Extract frames
        print(f"[{production_id}] Extracting frames...")
        fps = settings.get("fps", 10)
        all_frames = []

        for i, video_path in enumerate(video_paths):
            cam_frames_dir = frames_dir / f"cam{i:02d}"
            cam_frames_dir.mkdir(exist_ok=True)

            # Extract frames using FFmpeg
            cmd = [
                "ffmpeg", "-i", str(video_path),
                "-vf", f"fps={fps}",
                "-q:v", "2",
                str(cam_frames_dir / "frame_%04d.jpg")
            ]
            subprocess.run(cmd, check=True, capture_output=True)

            frames = sorted(cam_frames_dir.glob("*.jpg"))
            all_frames.extend(frames)
            print(f"  Extracted {len(frames)} frames from {video_path.name}")

        # Copy all frames to a single directory for COLMAP
        colmap_images = colmap_dir / "images"
        colmap_images.mkdir(exist_ok=True)

        for i, frame in enumerate(all_frames):
            shutil.copy(frame, colmap_images / f"frame_{i:06d}.jpg")

        print(f"[{production_id}] Total frames: {len(all_frames)}")

        # Stage 3: Run COLMAP
        print(f"[{production_id}] Running COLMAP feature extraction...")
        database_path = colmap_dir / "database.db"

        # Feature extraction (conda-forge COLMAP doesn't support GPU flags)
        try:
            result_fe = subprocess.run([
                "colmap", "feature_extractor",
                "--database_path", str(database_path),
                "--image_path", str(colmap_images),
                "--ImageReader.single_camera", "1",
            ], check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            print(f"[{production_id}] COLMAP feature_extractor failed:")
            print(f"  stdout: {e.stdout}")
            print(f"  stderr: {e.stderr}")
            raise

        # Feature matching (sequential matcher is much faster for video frames)
        print(f"[{production_id}] Running COLMAP feature matching...")
        try:
            result_fm = subprocess.run([
                "colmap", "sequential_matcher",
                "--database_path", str(database_path),
            ], check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            print(f"[{production_id}] COLMAP sequential_matcher failed:")
            print(f"  stdout: {e.stdout}")
            print(f"  stderr: {e.stderr}")
            raise

        # Sparse reconstruction using GLOMAP (10-100x faster than COLMAP mapper)
        print(f"[{production_id}] Running GLOMAP sparse reconstruction...")
        sparse_dir = colmap_dir / "sparse"
        sparse_dir.mkdir(exist_ok=True)

        # Use full path and verify binary is executable
        glomap_bin = "/usr/local/bin/glomap"
        if not os.path.exists(glomap_bin):
            # Fallback to build directory
            glomap_bin = "/opt/glomap/build/glomap/glomap"

        # Ensure executable permissions at runtime
        os.chmod(glomap_bin, 0o755)
        print(f"[{production_id}] Using GLOMAP binary: {glomap_bin}")

        try:
            # Run GLOMAP with real-time output streaming for debugging
            print(f"[{production_id}] Starting GLOMAP mapper (this may take a while)...")
            process = subprocess.Popen(
                [
                    glomap_bin, "mapper",
                    "--database_path", str(database_path),
                    "--image_path", str(colmap_images),
                    "--output_path", str(sparse_dir),
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            # Stream output in real-time
            for line in process.stdout:
                print(f"[GLOMAP] {line.rstrip()}")

            return_code = process.wait()
            if return_code != 0:
                raise subprocess.CalledProcessError(return_code, glomap_bin)

            print(f"[{production_id}] GLOMAP mapper completed successfully")
        except subprocess.CalledProcessError as e:
            print(f"[{production_id}] GLOMAP mapper failed with exit code: {e.returncode}")
            raise

        # Stage 4: Train Gaussian Splats
        print(f"[{production_id}] Training Gaussian Splats...")
        total_steps = settings.get("totalSteps", 15000)
        max_splats = settings.get("maxSplats", 10000000)

        # Use gsplat for training
        # This is a simplified version - production would use full 3DGS training
        ply_path = output_dir / "scene.ply"
        cameras_path = output_dir / "cameras.json"
        thumbnail_path = output_dir / "thumbnail.jpg"

        # For now, convert COLMAP output to PLY format
        # In production, this would run full Gaussian Splatting training
        model_dir = sparse_dir / "0"
        if model_dir.exists():
            # Export to PLY
            subprocess.run([
                "colmap", "model_converter",
                "--input_path", str(model_dir),
                "--output_path", str(ply_path),
                "--output_type", "PLY",
            ], check=True, capture_output=True)

            # Export cameras
            subprocess.run([
                "colmap", "model_converter",
                "--input_path", str(model_dir),
                "--output_path", str(output_dir / "cameras.txt"),
                "--output_type", "TXT",
            ], check=True, capture_output=True)

            # Create cameras.json from COLMAP output
            cameras_json = {"frames": [], "camera_model": "PINHOLE"}
            cameras_json_str = json.dumps(cameras_json, indent=2)
            cameras_path.write_text(cameras_json_str)

        # Create thumbnail from first frame
        if all_frames:
            shutil.copy(all_frames[0], thumbnail_path)

        # Stage 5: Upload to Supabase
        print(f"[{production_id}] Uploading results...")
        bucket = "production-outputs"

        outputs = {}

        if ply_path.exists():
            with open(ply_path, "rb") as f:
                supabase.storage.from_(bucket).upload(
                    f"{production_id}/scene.ply",
                    f.read(),
                    {"content-type": "application/octet-stream", "upsert": "true"}
                )
            outputs["plyUrl"] = supabase.storage.from_(bucket).get_public_url(
                f"{production_id}/scene.ply"
            )

        if cameras_path.exists():
            with open(cameras_path, "rb") as f:
                supabase.storage.from_(bucket).upload(
                    f"{production_id}/cameras.json",
                    f.read(),
                    {"content-type": "application/json", "upsert": "true"}
                )
            outputs["camerasUrl"] = supabase.storage.from_(bucket).get_public_url(
                f"{production_id}/cameras.json"
            )

        if thumbnail_path.exists():
            with open(thumbnail_path, "rb") as f:
                supabase.storage.from_(bucket).upload(
                    f"{production_id}/thumbnail.jpg",
                    f.read(),
                    {"content-type": "image/jpeg", "upsert": "true"}
                )
            outputs["thumbnailUrl"] = supabase.storage.from_(bucket).get_public_url(
                f"{production_id}/thumbnail.jpg"
            )

        result["success"] = True
        result["outputs"] = outputs

        print(f"[{production_id}] Processing complete!")

    except Exception as e:
        print(f"[{production_id}] Error: {str(e)}")
        result["error"] = str(e)

    finally:
        # Cleanup
        shutil.rmtree(work_dir, ignore_errors=True)

    # Send callback
    if callback_url:
        print(f"[{production_id}] Sending callback to: {callback_url}")
        print(f"[{production_id}] Callback payload: success={result['success']}, outputs={list(result.get('outputs', {}).keys()) if result.get('outputs') else None}")
        try:
            callback_response = requests.post(
                callback_url,
                json=result,
                headers={"Content-Type": "application/json"},
                timeout=30,
            )
            print(f"[{production_id}] Callback response: {callback_response.status_code} - {callback_response.text[:200]}")
        except Exception as e:
            print(f"[{production_id}] Callback failed: {e}")
    else:
        print(f"[{production_id}] No callback URL provided!")

    return result


@app.function(
    image=processing_image,
    secrets=[supabase_secret],
)
@modal.fastapi_endpoint(method="POST")
def trigger(data: dict) -> dict:
    """
    HTTP endpoint to trigger processing.

    This creates a web endpoint at:
    https://<username>--gameview-processing-trigger.modal.run

    POST body:
    {
        "production_id": "...",
        "experience_id": "...",
        "source_videos": [...],
        "settings": {...},
        "callback_url": "..."
    }
    """
    print(f"[trigger] Received request for production: {data.get('production_id')}")

    # Spawn the GPU processing function asynchronously
    call = process_production.spawn(
        production_id=data["production_id"],
        experience_id=data["experience_id"],
        source_videos=data["source_videos"],
        settings=data["settings"],
        callback_url=data["callback_url"],
    )

    return {
        "success": True,
        "message": "Processing started",
        "call_id": call.object_id,
        "production_id": data["production_id"],
    }


@app.local_entrypoint()
def main():
    """Test the processing function locally."""
    print("Modal worker ready. Deploy with: modal deploy modal_worker.py")
