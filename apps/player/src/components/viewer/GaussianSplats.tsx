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

  // Store callbacks in refs to avoid re-running useEffect when they change
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  // Keep refs updated
  onLoadRef.current = onLoad;
  onErrorRef.current = onError;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!gl || !camera || !url) return;

    // Prevent double-initialization
    if (viewerRef.current) return;

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
      logLevel: GaussianSplats3D.LogLevel.Debug, // Enable debug logging
      sphericalHarmonicsDegree: 0,
    });

    viewerRef.current = viewer;

    // Load the splat scene
    console.log("Loading Gaussian splats from:", url);
    viewer
      .addSplatScene(url, {
        showLoadingUI: false,
        progressiveLoad: true,
        position: position,
        rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
        scale: [scale, scale, scale],
        onProgress: (percent: number) => {
          onProgressRef.current?.(percent);
        },
      })
      .then(() => {
        console.log("Gaussian splats loaded successfully");
        onLoadRef.current?.();
        viewer.start();
      })
      .catch((err: Error) => {
        console.error("Failed to load Gaussian splats:", err);
        onErrorRef.current?.(err);
      });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [url, gl, camera, position, rotation, scale]);

  return <group ref={groupRef} />;
}

export default GaussianSplats;
