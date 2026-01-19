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

  // Store position/rotation/scale in refs to avoid effect re-runs
  const positionRef = useRef(position);
  const rotationRef = useRef(rotation);
  const scaleRef = useRef(scale);

  useEffect(() => {
    positionRef.current = position;
    rotationRef.current = rotation;
    scaleRef.current = scale;
  }, [position, rotation, scale]);

  useEffect(() => {
    if (!gl || !camera || !url || !scene) {
      console.log("[GaussianSplats] Missing dependencies:", { hasGL: !!gl, hasCamera: !!camera, hasScene: !!scene, url });
      return;
    }

    // Generate unique instance ID for this effect run
    const instanceId = Math.random().toString(36).substring(7);
    console.log(`[GaussianSplats ${instanceId}] Effect starting`);

    // Reset disposed flag for new effect run
    isDisposedRef.current = false;

    // Skip if already loading with a valid viewer (React strict mode protection)
    if (isLoadingRef.current && viewerRef.current) {
      console.log(`[GaussianSplats ${instanceId}] Already loading, skipping duplicate`);
      return;
    }
    isLoadingRef.current = true;

    console.log(`[GaussianSplats ${instanceId}] Starting load with DropInViewer for URL:`, url);

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
    console.log(`[GaussianSplats ${instanceId}] DropInViewer added to scene, children:`, viewer.children.length);
    console.log(`[GaussianSplats ${instanceId}] Scene children:`, scene.children.length);

    // Load the splat scene using refs for position/rotation/scale
    const pos = positionRef.current;
    const rot = rotationRef.current;
    const scl = scaleRef.current;

    viewer
      .addSplatScenes([{
        path: url,
        position: pos,
        rotation: [rot[0], rot[1], rot[2], "XYZ"],
        scale: [scl, scl, scl],
      }], false) // false = don't show loading UI
      .then(() => {
        if (!isDisposedRef.current) {
          console.log(`[GaussianSplats ${instanceId}] Load complete with DropInViewer`);

          // Get splat info for camera positioning
          const splatMesh = viewer.splatMesh;
          console.log(`[GaussianSplats ${instanceId}] SplatMesh:`, splatMesh);
          console.log(`[GaussianSplats ${instanceId}] DropInViewer children:`, viewer.children.length, viewer.children.map((c: THREE.Object3D) => c.type));

          if (splatMesh) {
            const splatCount = splatMesh.getSplatCount?.() || 0;
            console.log(`[GaussianSplats ${instanceId}] Total splats:`, splatCount);
            console.log(`[GaussianSplats ${instanceId}] SplatMesh visible:`, splatMesh.visible);
            console.log(`[GaussianSplats ${instanceId}] SplatMesh parent:`, splatMesh.parent?.type);
            console.log(`[GaussianSplats ${instanceId}] DropInViewer in scene:`, viewer.parent?.type);

            // Log material info
            if (splatMesh.material) {
              console.log(`[GaussianSplats ${instanceId}] Material:`, splatMesh.material.type, {
                visible: splatMesh.material.visible,
                transparent: splatMesh.material.transparent,
                depthWrite: splatMesh.material.depthWrite,
                depthTest: splatMesh.material.depthTest,
              });
            }

            // Focus camera on the middle splat
            if (splatCount > 0) {
              const middleSplatIdx = Math.floor(splatCount / 2);
              const splatPosition = new THREE.Vector3();
              if (splatMesh.getSplatCenter) {
                splatMesh.getSplatCenter(middleSplatIdx, splatPosition);
                console.log(`[GaussianSplats ${instanceId}] Middle splat position: x=${splatPosition.x.toFixed(2)}, y=${splatPosition.y.toFixed(2)}, z=${splatPosition.z.toFixed(2)}`);

                // Check if position is reasonable
                const distance = splatPosition.length();
                console.log(`[GaussianSplats ${instanceId}] Distance from origin: ${distance.toFixed(2)}`);

                camera.position.set(
                  splatPosition.x + 2,
                  splatPosition.y + 2,
                  splatPosition.z + 2
                );
                camera.lookAt(splatPosition);
                console.log(`[GaussianSplats ${instanceId}] Camera moved to: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(2)}, z=${camera.position.z.toFixed(2)}`);
              }
            }
          }

          onLoadRef.current?.();
          isReadyRef.current = true;
          console.log(`[GaussianSplats ${instanceId}] Ready for rendering`);
        } else {
          console.log(`[GaussianSplats ${instanceId}] Load complete but already disposed, ignoring`);
        }
      })
      .catch((err: Error) => {
        if (!isDisposedRef.current) {
          console.error("[GaussianSplats] Failed to load:", err);
          onErrorRef.current?.(err);
        }
      });

    return () => {
      console.log(`[GaussianSplats ${instanceId}] Cleanup - disposing DropInViewer`);
      isDisposedRef.current = true;
      isLoadingRef.current = false;
      isReadyRef.current = false;
      if (viewerRef.current) {
        // Remove from scene
        console.log(`[GaussianSplats ${instanceId}] Removing from scene and disposing`);
        scene.remove(viewerRef.current);
        try {
          viewerRef.current.dispose();
        } catch (e) {
          console.warn(`[GaussianSplats ${instanceId}] Error during dispose:`, e);
        }
        viewerRef.current = null;
      }
    };
  // Only depend on url and core Three.js objects - position/rotation/scale use refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera, scene]);

  // Frame counter for debugging
  const frameCountRef = useRef(0);

  // DropInViewer handles its own rendering and sorting when part of the scene
  // Only call update if the method exists (some versions may not have it)
  useFrame(() => {
    frameCountRef.current++;

    // Log every 60 frames (roughly every second at 60fps)
    if (frameCountRef.current % 60 === 0) {
      const viewer = viewerRef.current;
      if (viewer) {
        console.log(`[GaussianSplats] Frame ${frameCountRef.current}: viewer exists, isReady=${isReadyRef.current}, disposed=${isDisposedRef.current}`);
        // Check internal viewer state
        const internalViewer = viewer.viewer;
        if (internalViewer) {
          console.log(`[GaussianSplats] Internal viewer: initialized=${internalViewer.initialized}, splatRenderReady=${internalViewer.splatRenderReady}`);
        }
      }
    }

    if (viewerRef.current && isReadyRef.current && !isDisposedRef.current) {
      // Check if update method exists before calling
      if (typeof viewerRef.current.update === 'function') {
        viewerRef.current.update();
      }
    }
  });

  return <group ref={groupRef} />;
}

export default GaussianSplats;
