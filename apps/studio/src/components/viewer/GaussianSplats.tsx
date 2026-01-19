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
  const mountedRef = useRef(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!gl || !camera) return;

    // Track if this effect instance is still active (handles React Strict Mode)
    mountedRef.current = true;
    const instanceId = Math.random().toString(36).substr(2, 9);

    console.log(`[GaussianSplats:${instanceId}] Initializing Viewer...`);
    console.log(`[GaussianSplats:${instanceId}] URL:`, url);

    // Create viewer with R3F's renderer and camera
    // selfDrivenMode: false means we control update/render via useFrame
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewerOptions: any = {
      renderer: gl,
      camera: camera,
      useBuiltInControls: false,
      selfDrivenMode: false, // Critical: don't start own render loop
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
          // Only report progress if still mounted
          if (!mountedRef.current) return;
          console.log(`[GaussianSplats:${instanceId}] Loading progress: ${percent.toFixed(1)}%`);
          onProgress?.(percent);
        },
      })
      .then(() => {
        // Check if component was unmounted during async load
        if (!mountedRef.current) {
          console.log(`[GaussianSplats:${instanceId}] Load completed but component unmounted, ignoring`);
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
                }
              : null,
          });
        }

        setIsReady(true);
        onLoad?.();
      })
      .catch((err: Error) => {
        // Only report error if still mounted
        if (!mountedRef.current) {
          console.log(`[GaussianSplats:${instanceId}] Load failed but component unmounted, ignoring`);
          return;
        }
        console.error(`[GaussianSplats:${instanceId}] Failed to load:`, err);
        onError?.(err);
      });

    return () => {
      console.log(`[GaussianSplats:${instanceId}] Disposing Viewer...`);
      mountedRef.current = false;
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
      setIsReady(false);
    };
  }, [url, gl, camera, position, rotation, scale, onLoad, onError, onProgress]);

  // Manually update and render in R3F's frame loop
  useFrame(() => {
    if (!isReady || !viewerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewer = viewerRef.current as any;

    // Call viewer's update and render methods
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
