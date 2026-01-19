"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

// DropInViewer exists at runtime but isn't in the TypeScript types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DropInViewer = (GaussianSplats3D as any).DropInViewer as new (options: Record<string, unknown>) => THREE.Group & {
  addSplatScene: (url: string, options: Record<string, unknown>) => Promise<void>;
  dispose: () => Promise<void>;
};

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
 * Uses DropInViewer which is specifically designed to integrate with existing
 * Three.js scenes. It extends THREE.Group and uses onBeforeRender callback
 * to trigger updates in the Three.js render cycle, avoiding conflicts with R3F.
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
  const { scene } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    console.log("[GaussianSplats] Initializing DropInViewer...");
    console.log("[GaussianSplats] URL:", url);

    // DropInViewer is designed for integration with existing Three.js scenes
    // It extends THREE.Group and handles all the rendering integration internally
    // via onBeforeRender callbacks - no need for useFrame or manual render calls
    const viewer = new DropInViewer({
      gpuAcceleratedSort: true,
      enableSIMDInSort: true,
      sharedMemoryForWorkers: false,
      integerBasedSort: true,
      halfPrecisionCovariancesOnGPU: true,
      dynamicScene: false,
      renderMode: GaussianSplats3D.RenderMode.OnChange,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      antialiased: true,
      focalAdjustment: 1.0,
      logLevel: GaussianSplats3D.LogLevel.Debug,
      sphericalHarmonicsDegree: 0,
    });

    viewerRef.current = viewer;

    // Add the viewer (THREE.Group) directly to R3F's scene
    scene.add(viewer);
    console.log("[GaussianSplats] Added DropInViewer to scene");

    // Load the splat scene
    viewer
      .addSplatScene(url, {
        showLoadingUI: false,
        progressiveLoad: true,
        position: position,
        rotation: [rotation[0], rotation[1], rotation[2], "XYZ"],
        scale: [scale, scale, scale],
        onProgress: (percent: number) => {
          console.log(`[GaussianSplats] Loading progress: ${percent.toFixed(1)}%`);
          onProgress?.(percent);
        },
      })
      .then(() => {
        console.log("[GaussianSplats] Scene loaded successfully");

        // Debug: Inspect internal state
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viewerAny = viewer as any;
        console.log("[GaussianSplats] DropInViewer state:", {
          children: viewer.children.length,
          splatMesh: viewerAny.splatMesh,
          visible: viewer.visible,
          position: viewer.position,
        });

        if (viewerAny.splatMesh) {
          const mesh = viewerAny.splatMesh;
          console.log("[GaussianSplats] SplatMesh details:", {
            visible: mesh.visible,
            frustumCulled: mesh.frustumCulled,
            renderOrder: mesh.renderOrder,
            geometry: mesh.geometry
              ? {
                  attributes: Object.keys(mesh.geometry.attributes || {}),
                  drawRange: mesh.geometry.drawRange,
                }
              : null,
            material: mesh.material
              ? {
                  type: mesh.material.type,
                  visible: mesh.material.visible,
                  transparent: mesh.material.transparent,
                  depthWrite: mesh.material.depthWrite,
                  depthTest: mesh.material.depthTest,
                  side: mesh.material.side,
                }
              : null,
          });
        }

        onLoad?.();
      })
      .catch((err: Error) => {
        console.error("[GaussianSplats] Failed to load:", err);
        onError?.(err);
      });

    return () => {
      console.log("[GaussianSplats] Disposing DropInViewer...");
      if (viewerRef.current) {
        scene.remove(viewerRef.current);
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [url, scene, position, rotation, scale, onLoad, onError, onProgress]);

  // The DropInViewer handles its own rendering via onBeforeRender callbacks
  // No need for useFrame or manual render calls
  return null;
}

export default GaussianSplats;
