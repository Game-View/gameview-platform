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
  const { gl, camera, scene } = useThree();
  // DropInViewer extends THREE.Object3D and can be added directly to scene
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const isLoadingRef = useRef(false);
  const isDisposedRef = useRef(false);
  const isReadyRef = useRef(false);

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
    if (!gl || !camera || !url || !scene) {
      console.log("[GaussianSplats] Missing dependencies:", { hasGL: !!gl, hasCamera: !!camera, hasScene: !!scene, url });
      return;
    }

    // Prevent double-loading in React strict mode
    if (isLoadingRef.current) {
      console.log("[GaussianSplats] Already loading, skipping");
      return;
    }
    isLoadingRef.current = true;
    isDisposedRef.current = false;

    console.log("[GaussianSplats] Starting load with DropInViewer for URL:", url);

    // Use DropInViewer - designed to be added to existing Three.js scenes
    // It extends THREE.Object3D and integrates with the scene graph
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DropInViewer = (GaussianSplats3D as any).DropInViewer;

    if (!DropInViewer) {
      console.error("[GaussianSplats] DropInViewer not found in library!");
      return;
    }

    const viewer = new DropInViewer({
      gpuAcceleratedSort: true,
      enableSIMDInSort: true,
      sharedMemoryForWorkers: false, // Disabled - requires cross-origin isolation headers
      integerBasedSort: false, // Disable - causes issues with large scene ranges
      halfPrecisionCovariancesOnGPU: true,
      dynamicScene: true,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      antialiased: true,
      logLevel: GaussianSplats3D.LogLevel.Debug,
      sphericalHarmonicsDegree: 0,
    });

    viewerRef.current = viewer;

    // Add DropInViewer to the R3F scene - this is the key!
    // DropInViewer extends THREE.Object3D so it can be added like any mesh
    scene.add(viewer);
    console.log("[GaussianSplats] DropInViewer added to scene");

    // Load the splat scene
    viewer
      .addSplatScenes([{
        path: url,
        position: position,
        rotation: [rotation[0], rotation[1], rotation[2], "XYZ"],
        scale: [scale, scale, scale],
      }], false) // false = don't show loading UI
      .then(() => {
        if (!isDisposedRef.current) {
          console.log("[GaussianSplats] Load complete with DropInViewer");

          // Get splat info for camera positioning
          const splatMesh = viewer.splatMesh;
          if (splatMesh) {
            const splatCount = splatMesh.getSplatCount?.() || 0;
            console.log("[GaussianSplats] Total splats:", splatCount);
            console.log("[GaussianSplats] DropInViewer in scene:", viewer.parent?.type);

            // Focus camera on the middle splat
            if (splatCount > 0) {
              const middleSplatIdx = Math.floor(splatCount / 2);
              const splatPosition = new THREE.Vector3();
              if (splatMesh.getSplatCenter) {
                splatMesh.getSplatCenter(middleSplatIdx, splatPosition);
                console.log("[GaussianSplats] Middle splat position: x=" + splatPosition.x + ", y=" + splatPosition.y + ", z=" + splatPosition.z);

                camera.position.set(
                  splatPosition.x + 2,
                  splatPosition.y + 2,
                  splatPosition.z + 2
                );
                camera.lookAt(splatPosition);
                console.log("[GaussianSplats] Camera moved to: x=" + camera.position.x + ", y=" + camera.position.y + ", z=" + camera.position.z);
              }
            }
          }

          onLoadRef.current?.();
          isReadyRef.current = true;
          console.log("[GaussianSplats] Ready for rendering");
        }
      })
      .catch((err: Error) => {
        if (!isDisposedRef.current) {
          console.error("[GaussianSplats] Failed to load:", err);
          onErrorRef.current?.(err);
        }
      });

    return () => {
      console.log("[GaussianSplats] Cleanup - disposing DropInViewer");
      isDisposedRef.current = true;
      isLoadingRef.current = false;
      isReadyRef.current = false;
      if (viewerRef.current) {
        // Remove from scene
        scene.remove(viewerRef.current);
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [url, gl, camera, scene, position, rotation, scale]);

  // DropInViewer handles its own rendering when part of the scene
  // We just need to call update() each frame for sorting
  useFrame(() => {
    if (viewerRef.current && isReadyRef.current && !isDisposedRef.current) {
      viewerRef.current.update();
    }
  });

  return <group ref={groupRef} />;
}

export default GaussianSplats;
