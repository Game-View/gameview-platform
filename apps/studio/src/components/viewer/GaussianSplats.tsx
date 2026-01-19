"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
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

/**
 * GaussianSplats component for rendering Gaussian Splat scenes in R3F
 *
 * Strategy: Let the viewer run in selfDrivenMode with shared renderer.
 * Disable R3F's autoClear so both can render to the same canvas.
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

  // Use refs for callbacks to avoid re-running effect when callbacks change
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  // Keep refs up to date
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

  useEffect(() => {
    if (!gl || !camera) return;

    let isMounted = true;
    const instanceId = Math.random().toString(36).substr(2, 9);

    console.log(`[GaussianSplats:${instanceId}] Effect started, waiting for stability...`);

    // Delay viewer creation to handle React Strict Mode's mount/unmount cycle
    const initTimeout = setTimeout(() => {
      if (!isMounted) {
        console.log(`[GaussianSplats:${instanceId}] Unmounted during delay, skipping initialization`);
        return;
      }

      console.log(`[GaussianSplats:${instanceId}] Initializing Viewer with selfDrivenMode...`);
      console.log(`[GaussianSplats:${instanceId}] URL:`, url);

      // Create viewer with selfDrivenMode: true - let it run its own render loop
      // It will share the WebGL context with R3F
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewerOptions: any = {
        renderer: gl,
        camera: camera,
        useBuiltInControls: false,
        selfDrivenMode: true, // Let viewer run its own animation loop
        ignoreDevicePixelRatio: false,
        gpuAcceleratedSort: true,
        enableSIMDInSort: true,
        sharedMemoryForWorkers: false,
        integerBasedSort: true,
        halfPrecisionCovariancesOnGPU: true,
        dynamicScene: false,
        webXRMode: GaussianSplats3D.WebXRMode.None,
        renderMode: GaussianSplats3D.RenderMode.Always,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
        antialiased: true,
        focalAdjustment: 1.0,
        logLevel: GaussianSplats3D.LogLevel.Debug,
        sphericalHarmonicsDegree: 0,
      };

      const viewer = new GaussianSplats3D.Viewer(viewerOptions);
      viewerRef.current = viewer;

      console.log(`[GaussianSplats:${instanceId}] Viewer created, loading scene...`);

      // Load the splat scene
      viewer
        .addSplatScene(url, {
          showLoadingUI: false,
          progressiveLoad: true,
          position: position,
          rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
          scale: [scale, scale, scale],
          onProgress: (percent: number) => {
            if (!isMounted) return;
            console.log(`[GaussianSplats:${instanceId}] Loading progress: ${percent.toFixed(1)}%`);
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted) {
            console.log(`[GaussianSplats:${instanceId}] Load completed but unmounted, ignoring`);
            return;
          }

          console.log(`[GaussianSplats:${instanceId}] Scene loaded, starting viewer...`);

          // Start the viewer's render loop
          viewer.start();

          console.log(`[GaussianSplats:${instanceId}] Viewer started!`);
          onLoadRef.current?.();
        })
        .catch((err: Error) => {
          if (!isMounted) {
            console.log(`[GaussianSplats:${instanceId}] Load failed but unmounted, ignoring:`, err.message);
            return;
          }
          console.error(`[GaussianSplats:${instanceId}] Failed to load:`, err);
          onErrorRef.current?.(err);
        });
    }, 100);

    return () => {
      console.log(`[GaussianSplats:${instanceId}] Cleanup starting...`);
      isMounted = false;
      clearTimeout(initTimeout);

      if (viewerRef.current) {
        console.log(`[GaussianSplats:${instanceId}] Stopping and disposing Viewer...`);
        viewerRef.current.stop();
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera, JSON.stringify(position), JSON.stringify(rotation), scale]);

  return null;
}

export default GaussianSplats;
