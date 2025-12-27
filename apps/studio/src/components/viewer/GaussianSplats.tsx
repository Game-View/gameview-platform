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

  useEffect(() => {
    if (!gl || !camera) return;

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
          onProgress?.(percent);
        },
      })
      .then(() => {
        onLoad?.();
        viewer.start();
      })
      .catch((err: Error) => {
        console.error("Failed to load Gaussian splats:", err);
        onError?.(err);
      });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [url, gl, camera, position, rotation, scale, onLoad, onError, onProgress]);

  // Update viewer each frame
  useFrame(() => {
    if (viewerRef.current) {
      viewerRef.current.update();
    }
  });

  return <group ref={groupRef} />;
}

export default GaussianSplats;
