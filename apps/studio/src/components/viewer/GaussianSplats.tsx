"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
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

  // Store position/rotation/scale in refs to avoid effect re-runs
  const positionRef = useRef(position);
  const rotationRef = useRef(rotation);
  const scaleRef = useRef(scale);

  useEffect(() => {
    positionRef.current = position;
    rotationRef.current = rotation;
    scaleRef.current = scale;
  }, [position, rotation, scale]);

  useEffect(() => {
    if (!gl || !camera || !url) {
      console.log("[GaussianSplats] Missing dependencies:", { hasGL: !!gl, hasCamera: !!camera, url });
      return;
    }

    // Generate unique instance ID for this effect run
    const instanceId = Math.random().toString(36).substring(7);
    console.log(`[GaussianSplats ${instanceId}] Effect starting`);

    // Reset disposed flag for new effect run
    isDisposedRef.current = false;

    // Skip if already loading with a valid viewer (React strict mode protection)
    if (isLoadingRef.current && viewerRef.current) {
      console.log(`[GaussianSplats ${instanceId}] Already loading, skipping duplicate`);
      return;
    }
    isLoadingRef.current = true;

    console.log(`[GaussianSplats ${instanceId}] Starting load with Viewer for URL:`, url);

    // Track if THIS specific effect run has been disposed
    let isThisRunDisposed = false;

    // Use the regular Viewer class (like the player) - NOT DropInViewer
    // This gives us direct control over rendering
    const viewer = new GaussianSplats3D.Viewer({
      renderer: gl,
      camera: camera as THREE.PerspectiveCamera,
      useBuiltInControls: false, // We're using our own controls
      ignoreDevicePixelRatio: false,
      gpuAcceleratedSort: true,
      enableSIMDInSort: true,
      sharedMemoryForWorkers: false, // Disabled - requires cross-origin isolation headers
      integerBasedSort: false, // Disable - causes issues with large scene ranges
      halfPrecisionCovariancesOnGPU: true,
      dynamicScene: true,
      webXRMode: GaussianSplats3D.WebXRMode.None,
      renderMode: GaussianSplats3D.RenderMode.Always,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      antialiased: true,
      focalAdjustment: 1.0,
      logLevel: GaussianSplats3D.LogLevel.Debug,
      sphericalHarmonicsDegree: 0,
    });

    viewerRef.current = viewer;

    // Load the splat scene using refs for position/rotation/scale
    const pos = positionRef.current;
    const rot = rotationRef.current;
    const scl = scaleRef.current;

    viewer
      .addSplatScene(url, {
        showLoadingUI: false,
        progressiveLoad: true,
        position: pos,
        rotation: [rot[0], rot[1], rot[2], "XYZ"] as [number, number, number, string],
        scale: [scl, scl, scl],
        onProgress: (percent: number) => {
          onProgressRef.current?.(percent);
        },
      })
      .then(() => {
        // Check BOTH the local flag AND verify this viewer is still current
        if (!isThisRunDisposed && viewerRef.current === viewer) {
          console.log(`[GaussianSplats ${instanceId}] Load complete`);

          // Get splat info for camera positioning
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const splatMesh = (viewer as any).splatMesh;
          if (splatMesh) {
            const splatCount = splatMesh.getSplatCount?.() || 0;
            console.log(`[GaussianSplats ${instanceId}] Total splats:`, splatCount);

            // Focus camera on the middle splat
            if (splatCount > 0) {
              const middleSplatIdx = Math.floor(splatCount / 2);
              const splatPosition = new THREE.Vector3();
              if (splatMesh.getSplatCenter) {
                splatMesh.getSplatCenter(middleSplatIdx, splatPosition);
                console.log(`[GaussianSplats ${instanceId}] Middle splat position: x=${splatPosition.x.toFixed(2)}, y=${splatPosition.y.toFixed(2)}, z=${splatPosition.z.toFixed(2)}`);

                camera.position.set(
                  splatPosition.x + 2,
                  splatPosition.y + 2,
                  splatPosition.z + 2
                );
                camera.lookAt(splatPosition);
                console.log(`[GaussianSplats ${instanceId}] Camera moved to: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(2)}, z=${camera.position.z.toFixed(2)}`);
              }
            }
          }

          // Start the viewer's render loop - this is key!
          viewer.start();
          console.log(`[GaussianSplats ${instanceId}] Viewer started`);

          onLoadRef.current?.();
        } else {
          console.log(`[GaussianSplats ${instanceId}] Load complete but this run was disposed`);
        }
      })
      .catch((err: Error) => {
        if (!isThisRunDisposed && viewerRef.current === viewer) {
          console.error(`[GaussianSplats ${instanceId}] Failed to load:`, err);
          onErrorRef.current?.(err);
        } else {
          console.log(`[GaussianSplats ${instanceId}] Load error but this run was disposed, ignoring:`, err.message);
        }
      });

    return () => {
      console.log(`[GaussianSplats ${instanceId}] Cleanup - disposing Viewer`);
      // Mark this specific effect run as disposed
      isThisRunDisposed = true;
      isDisposedRef.current = true;
      isLoadingRef.current = false;
      if (viewerRef.current === viewer) {
        // Only dispose if this is still the current viewer
        console.log(`[GaussianSplats ${instanceId}] Stopping and disposing viewer`);
        try {
          viewer.stop();
          viewer.dispose();
        } catch (e) {
          console.warn(`[GaussianSplats ${instanceId}] Error during dispose:`, e);
        }
        viewerRef.current = null;
      } else {
        console.log(`[GaussianSplats ${instanceId}] Viewer was replaced, skipping dispose`);
      }
    };
  // Only depend on url and core Three.js objects - position/rotation/scale use refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera]);

  // Frame counter for debugging
  const frameCountRef = useRef(0);

  // Log rendering status periodically
  useFrame(() => {
    frameCountRef.current++;

    // Log every 300 frames (~5 seconds at 60fps)
    if (frameCountRef.current % 300 === 0 && viewerRef.current) {
      // Cast to any to access internal properties for debugging
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewer = viewerRef.current as any;
      console.log(`[GaussianSplats] Frame ${frameCountRef.current}: initialized=${viewer.initialized}, splatRenderReady=${viewer.splatRenderReady}`);
    }
  });

  return <group ref={groupRef} />;
}

export default GaussianSplats;
