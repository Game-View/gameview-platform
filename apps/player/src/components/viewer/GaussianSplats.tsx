"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * GaussianSplats component for rendering splat scenes in R3F (Player app)
 *
 * Composites splat rendering on top of R3F scene using manual render control.
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
  const { gl, camera, scene } = useThree();
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Store callbacks in refs to avoid re-running useEffect when they change
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onLoad, onError, onProgress]);

  useEffect(() => {
    if (!gl || !camera || !scene || !url) return;

    let isMounted = true;

    // Delay to handle React Strict Mode double-mount
    const initTimeout = setTimeout(() => {
      if (!isMounted) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewer = new GaussianSplats3D.Viewer({
        renderer: gl,
        camera: camera as THREE.PerspectiveCamera,
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
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
        antialiased: true,
        focalAdjustment: 1.0,
        logLevel: GaussianSplats3D.LogLevel.None,
        sphericalHarmonicsDegree: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      viewerRef.current = viewer;

      console.log("[Player] Loading Gaussian splats from:", url);
      viewer
        .addSplatScene(url, {
          showLoadingUI: false,
          progressiveLoad: true,
          position: position,
          rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
          scale: [scale, scale, scale],
          onProgress: (percent: number) => {
            if (!isMounted) return;
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted) return;
          console.log("[Player] Gaussian splats loaded successfully");
          setIsReady(true);
          onLoadRef.current?.();
        })
        .catch((err: Error) => {
          if (!isMounted) return;
          console.error("[Player] Failed to load Gaussian splats:", err);
          onErrorRef.current?.(err);
        });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);

      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera, scene, JSON.stringify(position), JSON.stringify(rotation), scale]);

  // First useFrame: Run early (priority -1) to clear and render R3F scene manually
  useFrame(({ gl: renderer, scene: r3fScene, camera: r3fCamera }) => {
    renderer.autoClear = false;
    renderer.clear(true, true, true);
    renderer.render(r3fScene, r3fCamera);
  }, -1);

  // Second useFrame: Run after R3F render (priority 1) to composite splats on top
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
  }, 1);

  return null;
}

export default GaussianSplats;
