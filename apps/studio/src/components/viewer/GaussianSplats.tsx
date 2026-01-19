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
    if (!gl || !camera || !url) return;

    // Prevent double-loading in React strict mode
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    isDisposedRef.current = false;

    // Create viewer that integrates with existing Three.js scene
    const viewer = new GaussianSplats3D.Viewer({
      renderer: gl,
      camera: camera as THREE.PerspectiveCamera,
      useBuiltInControls: false, // We're using our own controls
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
    });

    viewerRef.current = viewer;

    // Load the splat scene
    viewer
      .addSplatScene(url, {
        showLoadingUI: false,
        progressiveLoad: true,
        position: position,
        rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
        scale: [scale, scale, scale],
        onProgress: (percent: number) => {
          if (!isDisposedRef.current) {
            onProgressRef.current?.(percent);
          }
        },
      })
      .then(() => {
        if (!isDisposedRef.current) {
          onLoadRef.current?.();
          viewer.start();
        }
      })
      .catch((err: Error) => {
        if (!isDisposedRef.current) {
          console.error("Failed to load Gaussian splats:", err);
          onErrorRef.current?.(err);
        }
      });

    return () => {
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
