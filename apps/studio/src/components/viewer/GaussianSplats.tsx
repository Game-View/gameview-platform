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
 * GaussianSplats component for rendering Gaussian Splat scenes in R3F
 *
 * Strategy: Extract the splatMesh from the viewer and add it to R3F's scene.
 * This lets R3F handle rendering while we call viewer.update() for sorting.
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
  const splatMeshRef = useRef<THREE.Object3D | null>(null);
  const [isReady, setIsReady] = useState(false);

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

  useEffect(() => {
    if (!gl || !camera || !scene) return;

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
      // We use selfDrivenMode: false so we control when update() is called
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
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted) {
            console.log(`[GaussianSplats:${instanceId}] Load completed but unmounted, ignoring`);
            return;
          }

          console.log(`[GaussianSplats:${instanceId}] Scene loaded successfully!`);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const viewerAny = viewer as any;

          // Extract the splatMesh and add it to R3F's scene
          // This is the key: R3F will now render the mesh as part of its scene
          if (viewerAny.splatMesh) {
            const mesh = viewerAny.splatMesh as THREE.Object3D;

            console.log(`[GaussianSplats:${instanceId}] SplatMesh found:`, {
              visible: mesh.visible,
              frustumCulled: (mesh as THREE.Mesh).frustumCulled,
              renderOrder: mesh.renderOrder,
              currentParent: mesh.parent?.type,
            });

            // Remove from viewer's internal scene if present
            if (mesh.parent) {
              mesh.parent.remove(mesh);
            }

            // Configure mesh for R3F rendering
            mesh.visible = true;
            (mesh as THREE.Mesh).frustumCulled = false;
            mesh.renderOrder = 1000; // Render after other objects

            // Add to R3F's scene
            scene.add(mesh);
            splatMeshRef.current = mesh;

            console.log(`[GaussianSplats:${instanceId}] SplatMesh added to R3F scene`);
          } else {
            console.warn(`[GaussianSplats:${instanceId}] No splatMesh found on viewer!`);
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

      // Remove splatMesh from R3F scene
      if (splatMeshRef.current && scene) {
        console.log(`[GaussianSplats:${instanceId}] Removing splatMesh from R3F scene`);
        scene.remove(splatMeshRef.current);
        splatMeshRef.current = null;
      }

      if (viewerRef.current) {
        console.log(`[GaussianSplats:${instanceId}] Disposing Viewer...`);
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera, scene, JSON.stringify(position), JSON.stringify(rotation), scale]);

  // Call viewer.update() each frame to sort splats based on camera position
  // R3F handles the actual rendering since the mesh is in its scene
  useFrame(() => {
    if (!isReady || !viewerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewer = viewerRef.current as any;

    // Only call update() for splat sorting - R3F handles rendering
    if (typeof viewer.update === "function") {
      viewer.update();
    }
  });

  return null;
}

export default GaussianSplats;
