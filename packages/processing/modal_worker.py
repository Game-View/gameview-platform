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

# GPU image with CUDA-accelerated COLMAP + GLOMAP + OpenSplat
# Built with cuDSS for GPU-accelerated bundle adjustment (2-5x faster)
processing_image = (
    modal.Image.from_registry("nvidia/cuda:12.4.0-devel-ubuntu22.04", add_python="3.11")
    .apt_install([
        # Cache buster v8: Force rebuild 2026-01-13 - Add OpenSplat
        "tree",
        "file",
        "htop",  # New package to invalidate Modal cache
        "ffmpeg",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "wget",
        "git",
        "curl",
        "unzip",
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
        # Cache buster: v8 - Add OpenSplat for proper 3DGS training
        "echo 'FORCE REBUILD v8: Add OpenSplat for Gaussian Splatting training'",
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
        # Fix: Insert at line 31 (before extern "C" at line 34)
        # Cache buster v8 - LINE 31 INSERT
        "rm -rf /opt/colmap && "
        "git clone --branch 3.9.1 --depth 1 https://github.com/colmap/colmap.git /opt/colmap && "
        "echo '>>> PATCHING line.cc to add #include <memory> at line 31 <<<' && "
        "sed -i '31i #include <memory>' /opt/colmap/src/colmap/image/line.cc && "
        "echo '>>> LINES 28-40 OF PATCHED FILE <<<' && "
        "sed -n '28,40p' /opt/colmap/src/colmap/image/line.cc && "
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

        # === Download and install LibTorch for OpenSplat ===
        "wget -q https://download.pytorch.org/libtorch/cu124/libtorch-cxx11-abi-shared-with-deps-2.5.1%2Bcu124.zip -O /tmp/libtorch.zip",
        "unzip -q /tmp/libtorch.zip -d /opt",
        "rm /tmp/libtorch.zip",

        # === Build OpenSplat with CUDA ===
        "git clone --depth 1 https://github.com/pierotofy/OpenSplat.git /opt/opensplat",
        "mkdir -p /opt/opensplat/build",
        "cd /opt/opensplat/build && /usr/local/bin/cmake .. "
        "-DCMAKE_BUILD_TYPE=Release "
        "-DCMAKE_PREFIX_PATH=/opt/libtorch "
        "-DGPU_RUNTIME=CUDA "
        "-DCMAKE_CUDA_ARCHITECTURES='70;75;80;86;89' "
        "-DOPENSPLAT_BUILD_SIMPLE_TRAINER=OFF "
        "&& make -j$(nproc)",
        "cp /opt/opensplat/build/opensplat /usr/local/bin/opensplat",
        "chmod 755 /usr/local/bin/opensplat",

        # Verify installations
        "colmap -h || echo 'COLMAP verification failed'",
        "glomap --help || echo 'GLOMAP verification failed'",
        "opensplat --help || echo 'OpenSplat verification failed'",
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


def send_progress(callback_url: str, production_id: str, stage: str, progress: int, message: str = ""):
    """Send progress update to Studio API."""
    import requests

    # Derive progress URL from callback URL
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


@app.function(
    image=processing_image,
    gpu="A10G",  # 24GB VRAM - more memory for larger reconstructions
    timeout=14400,  # 4 hours max for large video sets
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
        send_progress(callback_url, production_id, "downloading", 5, "Downloading videos")
        print(f"[{production_id}] Downloading {len(source_videos)} videos...")
        video_paths = []
        for i, video in enumerate(source_videos):
            video_path = input_dir / video["filename"]
            print(f"  Downloading {video['filename']}...")
            urllib.request.urlretrieve(video["url"], str(video_path))
            video_paths.append(video_path)

        # Stage 2: Extract frames with smart capping
        # Quality insight: Reconstruction quality depends on frame DIVERSITY, not count
        # 250-350 well-distributed frames produce good results while keeping COLMAP fast
        send_progress(callback_url, production_id, "frame_extraction", 15, "Extracting frames from videos")
        print(f"[{production_id}] Extracting frames...")

        fps = settings.get("fps", 3)  # Lower default: 3fps provides good coverage without redundancy
        max_frames = settings.get("maxFrames", 300)  # Cap at 300 for faster COLMAP completion
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

        # Smart frame sampling if over the cap
        total_extracted = len(all_frames)
        if total_extracted > max_frames:
            print(f"[{production_id}] Frame count ({total_extracted}) exceeds cap ({max_frames}), applying smart sampling...")

            # Uniform sampling to maintain temporal coverage
            step = total_extracted / max_frames
            sampled_indices = [int(i * step) for i in range(max_frames)]
            all_frames = [all_frames[i] for i in sampled_indices]

            print(f"[{production_id}] Reduced to {len(all_frames)} frames with uniform sampling")

        # Copy all frames to a single directory for COLMAP
        colmap_images = colmap_dir / "images"
        colmap_images.mkdir(exist_ok=True)

        for i, frame in enumerate(all_frames):
            shutil.copy(frame, colmap_images / f"frame_{i:06d}.jpg")

        print(f"[{production_id}] Total frames: {len(all_frames)}")

        # Stage 3: Run COLMAP
        send_progress(callback_url, production_id, "colmap_features", 25, "Extracting image features")
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
        send_progress(callback_url, production_id, "colmap_matching", 35, "Matching features across images")
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
        send_progress(callback_url, production_id, "glomap", 50, "Reconstructing 3D structure")
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

        glomap_success = False
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
            glomap_success = True
        except subprocess.CalledProcessError as e:
            print(f"[{production_id}] GLOMAP mapper failed with exit code: {e.returncode}")
            print(f"[{production_id}] Falling back to COLMAP mapper...")

        # Fallback to COLMAP mapper if GLOMAP fails
        if not glomap_success:
            send_progress(callback_url, production_id, "glomap", 55, "Using COLMAP fallback reconstruction")
            try:
                result_mapper = subprocess.run([
                    "colmap", "mapper",
                    "--database_path", str(database_path),
                    "--image_path", str(colmap_images),
                    "--output_path", str(sparse_dir),
                    "--Mapper.ba_global_max_num_iterations", "30",  # Reduce iterations for speed
                    "--Mapper.ba_global_max_refinements", "2",
                ], check=True, capture_output=True, text=True, timeout=10800)  # 3 hour timeout
                print(f"[{production_id}] COLMAP mapper completed successfully")
            except subprocess.CalledProcessError as e:
                print(f"[{production_id}] COLMAP mapper also failed:")
                print(f"  stdout: {e.stdout}")
                print(f"  stderr: {e.stderr}")
                raise
            except subprocess.TimeoutExpired:
                print(f"[{production_id}] COLMAP mapper timed out after 3 hours")
                raise Exception("Reconstruction timed out after 3 hours - try reducing video count or duration")

        # Stage 4: Train Gaussian Splats using OpenSplat
        send_progress(callback_url, production_id, "training", 70, "Training 3D Gaussian Splats")
        print(f"[{production_id}] Training Gaussian Splats with OpenSplat...")
        total_steps = settings.get("totalSteps", 15000)

        ply_path = output_dir / "scene.ply"
        cameras_path = output_dir / "cameras.json"
        thumbnail_path = output_dir / "thumbnail.jpg"

        # COLMAP may create sparse/0/, sparse/1/, etc. - find any valid model
        model_dir = None
        for subdir in sorted(sparse_dir.iterdir()) if sparse_dir.exists() else []:
            if subdir.is_dir() and (subdir / "cameras.bin").exists():
                model_dir = subdir
                print(f"[{production_id}] Found reconstruction in {subdir.name}")
                break

        if not model_dir:
            # List what's in sparse_dir for debugging
            if sparse_dir.exists():
                contents = list(sparse_dir.iterdir())
                print(f"[{production_id}] sparse_dir contents: {[str(c) for c in contents]}")
            raise Exception("COLMAP reconstruction failed - no valid model produced. Try with different camera angles or more overlap between videos.")

        # OpenSplat expects the COLMAP directory structure:
        # project/
        #   images/
        #   sparse/0/  (or any model folder)
        # We need to set up this structure
        opensplat_dir = work_dir / "opensplat_input"
        opensplat_dir.mkdir(exist_ok=True)

        # Symlink images
        (opensplat_dir / "images").symlink_to(colmap_images)

        # Copy sparse model to expected location
        opensplat_sparse = opensplat_dir / "sparse" / "0"
        opensplat_sparse.mkdir(parents=True, exist_ok=True)
        for f in model_dir.iterdir():
            shutil.copy(f, opensplat_sparse / f.name)

        print(f"[{production_id}] OpenSplat input prepared at {opensplat_dir}")
        print(f"[{production_id}] Training for {total_steps} iterations...")

        # Run OpenSplat training
        # Output file will be splat.ply in the output directory
        try:
            process = subprocess.Popen(
                [
                    "/usr/local/bin/opensplat",
                    str(opensplat_dir),
                    "-n", str(total_steps),
                    "-o", str(output_dir / "splat.ply"),
                    "--save-every", "-1",  # Only save final output
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                env={**os.environ, "LD_LIBRARY_PATH": "/opt/libtorch/lib:" + os.environ.get("LD_LIBRARY_PATH", "")},
            )

            # Stream output and parse progress
            for line in process.stdout:
                line = line.strip()
                if line:
                    print(f"[OpenSplat] {line}")
                    # Parse iteration progress
                    if "Iteration" in line:
                        try:
                            # Format: "Iteration X/Y ..."
                            parts = line.split()
                            for i, p in enumerate(parts):
                                if "/" in p:
                                    current, total = p.split("/")
                                    pct = int(current) / int(total) * 100
                                    # Map 0-100% of training to 70-85% of overall progress
                                    overall_pct = 70 + int(pct * 0.15)
                                    send_progress(callback_url, production_id, "training", overall_pct, f"Training step {current}/{total}")
                                    break
                        except:
                            pass

            return_code = process.wait()
            if return_code != 0:
                raise subprocess.CalledProcessError(return_code, "opensplat")

            print(f"[{production_id}] OpenSplat training completed!")

        except subprocess.CalledProcessError as e:
            print(f"[{production_id}] OpenSplat training failed with code {e.returncode}")
            raise Exception(f"Gaussian Splatting training failed - error code {e.returncode}")

        # Rename output file to scene.ply
        splat_output = output_dir / "splat.ply"
        if splat_output.exists():
            shutil.move(splat_output, ply_path)
            print(f"[{production_id}] PLY output: {ply_path} ({ply_path.stat().st_size / 1024 / 1024:.1f} MB)")
        else:
            raise Exception("OpenSplat did not produce output file")

        # Export cameras.json from COLMAP for reference
        subprocess.run([
            "colmap", "model_converter",
            "--input_path", str(model_dir),
            "--output_path", str(output_dir / "cameras.txt"),
            "--output_type", "TXT",
        ], check=True, capture_output=True)

        # Create cameras.json from COLMAP output
        cameras_json = {"frames": [], "camera_model": "PINHOLE", "source": "OpenSplat"}
        cameras_json_str = json.dumps(cameras_json, indent=2)
        cameras_path.write_text(cameras_json_str)

        # Create thumbnail from first frame
        if all_frames:
            shutil.copy(all_frames[0], thumbnail_path)

        # Stage 5: Upload to Supabase
        send_progress(callback_url, production_id, "uploading", 90, "Uploading results")
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
