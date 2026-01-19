"use client";

import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
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
 * Uses the Viewer with selfDrivenMode: false to manually integrate
 * with R3F's render loop via useFrame.
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
  const [isReady, setIsReady] = useState(false);

  // Use refs for callbacks to avoid re-running effect when callbacks change
  // This is critical because onProgress updates parent state, causing re-renders
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  // Keep refs up to date
  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onLoad, onError, onProgress]);

  useEffect(() => {
    if (!gl || !camera) return;

    // Track if this effect instance is still active
    let isMounted = true;
    const instanceId = Math.random().toString(36).substr(2, 9);

    console.log(`[GaussianSplats:${instanceId}] Effect started, waiting for stability...`);

    // Delay viewer creation to handle React Strict Mode's mount/unmount cycle
    const initTimeout = setTimeout(() => {
      if (!isMounted) {
        console.log(`[GaussianSplats:${instanceId}] Unmounted during delay, skipping initialization`);
        return;
      }

      console.log(`[GaussianSplats:${instanceId}] Initializing Viewer...`);
      console.log(`[GaussianSplats:${instanceId}] URL:`, url);

      // Create viewer with R3F's renderer and camera
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewerOptions: any = {
        renderer: gl,
        camera: camera,
        useBuiltInControls: false,
        selfDrivenMode: false,
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
            // Use ref to call latest callback without triggering effect re-run
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted) {
            console.log(`[GaussianSplats:${instanceId}] Load completed but unmounted, ignoring`);
            return;
          }

          console.log(`[GaussianSplats:${instanceId}] Scene loaded successfully!`);

          // Debug: Inspect internal viewer state
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const viewerAny = viewer as any;
          console.log(`[GaussianSplats:${instanceId}] Viewer internal state:`, {
            splatMesh: viewerAny.splatMesh,
            scene: viewerAny.scene,
            running: viewerAny.running,
          });

          if (viewerAny.splatMesh) {
            const mesh = viewerAny.splatMesh;
            console.log(`[GaussianSplats:${instanceId}] SplatMesh details:`, {
              visible: mesh.visible,
              frustumCulled: mesh.frustumCulled,
              renderOrder: mesh.renderOrder,
              parent: mesh.parent?.type,
              geometryAttributes: mesh.geometry ? Object.keys(mesh.geometry.attributes || {}) : null,
              materialType: mesh.material?.type,
            });
          }

          setIsReady(true);
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
        console.log(`[GaussianSplats:${instanceId}] Disposing Viewer...`);
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
      setIsReady(false);
    };
    // Only re-run effect when URL or transform changes, NOT when callbacks change
    // Serialize arrays to prevent re-running when parent creates new array references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera, JSON.stringify(position), JSON.stringify(rotation), scale]);

  // Manually update and render in R3F's frame loop
  useFrame(() => {
    if (!isReady || !viewerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewer = viewerRef.current as any;

    if (typeof viewer.update === "function") {
      viewer.update();
    }
    if (typeof viewer.render === "function") {
      viewer.render();
    }
  });

  return null;
}

export default GaussianSplats;
