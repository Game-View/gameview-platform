"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

export interface GaussianSplatsProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

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
  const groupRef = useRef<THREE.Group>(null);
  const isLoadingRef = useRef(false);
  const isDisposedRef = useRef(false);

  // Use refs for callbacks to avoid effect re-runs
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  // Update refs when callbacks change
  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onLoad, onError, onProgress]);

  useEffect(() => {
    if (!gl || !camera || !url) {
      console.log("[GaussianSplats] Missing dependencies:", { hasGL: !!gl, hasCamera: !!camera, url });
      return;
    }

    // Prevent double-loading in React strict mode
    if (isLoadingRef.current) {
      console.log("[GaussianSplats] Already loading, skipping");
      return;
    }
    isLoadingRef.current = true;
    isDisposedRef.current = false;

    console.log("[GaussianSplats] Starting load for URL:", url);

    // Create viewer that integrates with existing Three.js scene
    const viewer = new GaussianSplats3D.Viewer({
      renderer: gl,
      camera: camera as THREE.PerspectiveCamera,
      useBuiltInControls: false, // Use our own OrbitControls
      ignoreDevicePixelRatio: false,
      gpuAcceleratedSort: true,
      enableSIMDInSort: true,
      sharedMemoryForWorkers: false, // Disabled - requires cross-origin isolation headers
      integerBasedSort: false, // Disable - causes issues with large scene ranges
      halfPrecisionCovariancesOnGPU: true,
      dynamicScene: true, // Try dynamic scene for better tree building
      webXRMode: GaussianSplats3D.WebXRMode.None,
      renderMode: GaussianSplats3D.RenderMode.Always,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant, // Try instant reveal
      antialiased: true,
      focalAdjustment: 1.0,
      logLevel: GaussianSplats3D.LogLevel.Debug,
      sphericalHarmonicsDegree: 0, // Try degree 0 - PLY might not have higher SH
    });

    viewerRef.current = viewer;

    // Load the splat scene
    viewer
      .addSplatScene(url, {
        showLoadingUI: false,
        progressiveLoad: false, // Disable progressive load for compatibility
        position: position,
        rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
        scale: [scale, scale, scale],
        onProgress: (percent: number) => {
          if (!isDisposedRef.current) {
            console.log("[GaussianSplats] Progress:", percent + "%");
            onProgressRef.current?.(percent);
          }
        },
      })
      .then(() => {
        if (!isDisposedRef.current) {
          console.log("[GaussianSplats] Load complete, starting viewer");

          // Try to get splat count and focus on middle splat
          const splatMesh = viewer.getSplatMesh();
          if (splatMesh) {
            const splatCount = splatMesh.getSplatCount();
            console.log("[GaussianSplats] Total splats:", splatCount);

            // Focus camera on the middle splat to center the view
            if (splatCount > 0) {
              const middleSplatIdx = Math.floor(splatCount / 2);
              console.log("[GaussianSplats] Focusing on splat:", middleSplatIdx);

              // Get splat position to log for debugging
              const splatPosition = new THREE.Vector3();
              splatMesh.getSplatCenter(middleSplatIdx, splatPosition);
              console.log("[GaussianSplats] Middle splat position:", splatPosition);

              // Move camera to look at this position
              camera.position.set(
                splatPosition.x + 2,
                splatPosition.y + 2,
                splatPosition.z + 2
              );
              camera.lookAt(splatPosition);
            }
          }

          onLoadRef.current?.();
          viewer.start();
        }
      })
      .catch((err: Error) => {
        if (!isDisposedRef.current) {
          console.error("[GaussianSplats] Failed to load:", err);
          onErrorRef.current?.(err);
        }
      });

    return () => {
      console.log("[GaussianSplats] Cleanup - disposing viewer");
      isDisposedRef.current = true;
      isLoadingRef.current = false;
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  // Only re-run when URL or core dependencies change, not callbacks
  }, [url, gl, camera]);

  return <group ref={groupRef} />;
}

export default GaussianSplats;
