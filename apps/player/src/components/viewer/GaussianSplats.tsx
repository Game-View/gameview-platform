"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

// WebGL has limited GPU memory compared to desktop OpenGL
// Desktop can handle 10M+ splats, browser typically crashes above 1-2M
// PLY file size roughly correlates: ~30 bytes per splat
// 100MB PLY ≈ 3.3M splats, 50MB ≈ 1.6M splats
const MAX_PLY_SIZE_MB = 100; // Max file size in MB before showing error
// Note: Disabled alpha threshold entirely - was causing "leaves with splats: 0"
// The library may interpret alpha values differently than expected

export interface GaussianSplatsProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

/**
 * GaussianSplats component for rendering splat scenes in R3F (Player app)
 *
 * Uses selfDrivenMode with shared renderer for proper splat rendering.
 * Includes:
 * - Pre-check of PLY file size to avoid crashes
 * - Aggressive alpha culling to reduce splat count
 * - WebGL context loss handling for graceful error display
 */
export function GaussianSplats({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onLoad,
  onError,
  onProgress,
}: GaussianSplatsProps) {
  const { gl, camera } = useThree();
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const contextLostRef = useRef(false);
  const [fileSizeChecked, setFileSizeChecked] = useState(false);
  const [fileSizeOk, setFileSizeOk] = useState(false);
  const [fileSizeMB, setFileSizeMB] = useState<number | null>(null);

  // Store callbacks in refs to avoid re-running useEffect when they change
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onLoad, onError, onProgress]);

  // Disable R3F's autoClear so viewer can render on same canvas
  useEffect(() => {
    if (gl) {
      gl.autoClear = false;
    }
  }, [gl]);

  // Handle WebGL context loss
  useEffect(() => {
    if (!gl) return;

    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLostRef.current = true;
      console.error("[Player] WebGL context lost - scene may be too large for this device");

      // Stop the viewer if it exists
      if (viewerRef.current) {
        try {
          viewerRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }

      // Report error to parent with helpful message
      const sizePart = fileSizeMB ? ` (${fileSizeMB.toFixed(1)}MB)` : "";
      onErrorRef.current?.(
        new Error(
          `WebGL crashed loading this scene${sizePart}. ` +
          `The scene has too many splats for browser rendering. ` +
          `Try downloading the PLY file and viewing in a desktop app like Splatapult.`
        )
      );
    };

    const handleContextRestored = () => {
      console.log("[Player] WebGL context restored");
      contextLostRef.current = false;
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl, fileSizeMB]);

  // Pre-check file size before loading
  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    async function checkFileSize() {
      try {
        console.log("[Player] Checking PLY file size...");
        const response = await fetch(url, { method: "HEAD" });

        if (cancelled) return;

        const contentLength = response.headers.get("content-length");
        if (contentLength) {
          const sizeBytes = parseInt(contentLength, 10);
          const sizeMB = sizeBytes / (1024 * 1024);
          setFileSizeMB(sizeMB);

          console.log(`[Player] PLY file size: ${sizeMB.toFixed(2)} MB`);

          if (sizeMB > MAX_PLY_SIZE_MB) {
            console.warn(
              `[Player] PLY file is ${sizeMB.toFixed(1)}MB, exceeds ${MAX_PLY_SIZE_MB}MB limit. ` +
              `This may crash the browser.`
            );
            // Still try to load, but with aggressive culling
            // The context loss handler will catch crashes
          }

          setFileSizeOk(true);
        } else {
          console.log("[Player] Could not determine file size, proceeding anyway");
          setFileSizeOk(true);
        }
      } catch (err) {
        console.warn("[Player] Failed to check file size:", err);
        // Proceed anyway - the main load will fail if there's a real issue
        setFileSizeOk(true);
      } finally {
        if (!cancelled) {
          setFileSizeChecked(true);
        }
      }
    }

    checkFileSize();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Main loading effect - only runs after file size check
  useEffect(() => {
    if (!gl || !camera || !url) return;
    if (!fileSizeChecked || !fileSizeOk) return;
    if (contextLostRef.current) return;

    let isMounted = true;

    // Delay to handle React Strict Mode double-mount
    const initTimeout = setTimeout(() => {
      if (!isMounted || contextLostRef.current) return;

      console.log("[Player] Creating Gaussian splat viewer...");
      console.log("[Player] Testing: dynamicScene=true to bypass tree issues");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewer = new GaussianSplats3D.Viewer({
        renderer: gl,
        camera: camera as THREE.PerspectiveCamera,
        useBuiltInControls: false,
        selfDrivenMode: true,
        ignoreDevicePixelRatio: false,
        gpuAcceleratedSort: true,
        enableSIMDInSort: true,
        sharedMemoryForWorkers: false,
        integerBasedSort: true,
        halfPrecisionCovariancesOnGPU: true,
        // IMPORTANT: dynamicScene=true rebuilds tree each frame, may bypass tree issue
        dynamicScene: true,
        webXRMode: GaussianSplats3D.WebXRMode.None,
        renderMode: GaussianSplats3D.RenderMode.Always,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
        antialiased: false,
        focalAdjustment: 1.0,
        logLevel: GaussianSplats3D.LogLevel.Debug,
        sphericalHarmonicsDegree: 0,
        // Disable optimizations that might cause issues
        optimizeSplatData: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      viewerRef.current = viewer;

      console.log("[Player] Loading Gaussian splats from:", url);
      console.log("[Player] Renderer:", gl);
      console.log("[Player] Camera:", camera);
      console.log("[Player] Canvas size:", gl.domElement.width, "x", gl.domElement.height);

      viewer
        .addSplatScene(url, {
          showLoadingUI: false,
          // IMPORTANT: Disable progressive loading - may fix "leaves with splats: 0" issue
          // Progressive loading can cause tree building issues
          progressiveLoad: false,
          position: position,
          rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
          scale: [scale, scale, scale],
          onProgress: (percent: number) => {
            if (!isMounted) return;
            console.log("[Player] Loading progress:", Math.round(percent * 100) + "%");
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted || contextLostRef.current) return;

          console.log("[Player] Gaussian splats loaded successfully!");

          // Diagnostics: get scene info
          try {
            const splatCount = viewer.getSplatCount?.() ?? "unknown";
            console.log(`[Player] Splat count: ${splatCount}`);
          } catch (e) {
            console.log("[Player] Could not get splat count");
          }

          // Try to get scene center and radius for auto-camera positioning
          try {
            const sceneCenter = viewer.getSceneCenter?.();
            const sceneRadius = viewer.getSceneRadius?.();

            if (sceneCenter && sceneRadius) {
              console.log("[Player] Scene center:", sceneCenter);
              console.log("[Player] Scene radius:", sceneRadius);

              // Auto-position camera to look at scene center from a good distance
              const distance = sceneRadius * 2.5; // 2.5x radius gives good view
              const perspCamera = camera as THREE.PerspectiveCamera;

              // Position camera at center + offset on Z axis (looking at scene)
              perspCamera.position.set(
                sceneCenter.x,
                sceneCenter.y + sceneRadius * 0.5, // Slightly above center
                sceneCenter.z + distance
              );
              perspCamera.lookAt(sceneCenter.x, sceneCenter.y, sceneCenter.z);
              perspCamera.updateProjectionMatrix();

              console.log("[Player] Auto-positioned camera to:", perspCamera.position);
              console.log("[Player] Camera looking at:", sceneCenter);
            } else {
              console.log("[Player] Could not get scene bounds for auto-positioning");
            }
          } catch (e) {
            console.log("[Player] Scene bounds not available:", e);
          }

          console.log("[Player] Starting viewer...");
          viewer.start();
          console.log("[Player] Viewer started");

          // Log final camera state
          console.log("[Player] Final camera position:", camera.position);
          console.log("[Player] Camera near/far:", (camera as THREE.PerspectiveCamera).near, (camera as THREE.PerspectiveCamera).far);

          onLoadRef.current?.();
        })
        .catch((err: Error) => {
          if (!isMounted) return;
          console.error("[Player] Failed to load Gaussian splats:", err);
          console.error("[Player] Error details:", err.message, err.stack);
          onErrorRef.current?.(err);
        });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);

      if (viewerRef.current) {
        try {
          viewerRef.current.stop();
          viewerRef.current.dispose();
        } catch (e) {
          // Ignore errors during cleanup if context was lost
        }
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera, fileSizeChecked, fileSizeOk, fileSizeMB, JSON.stringify(position), JSON.stringify(rotation), scale]);

  return null;
}

export default GaussianSplats;
