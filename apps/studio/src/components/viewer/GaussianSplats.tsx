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
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
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

    console.log("[GaussianSplats] Starting load for URL:", url);

    // Create viewer using dropInMode for integration with existing Three.js scene
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewerOptions: any = {
      // dropInMode: integrate with existing Three.js app
      // The splatMesh will be added to our scene, and we handle rendering
      threeScene: scene,
      renderer: gl,
      camera: camera as THREE.PerspectiveCamera,
      useBuiltInControls: false, // Use our own OrbitControls
      selfDrivenMode: false, // We control the render loop
      ignoreDevicePixelRatio: false,
      gpuAcceleratedSort: true,
      enableSIMDInSort: true,
      sharedMemoryForWorkers: false, // Disabled - requires cross-origin isolation headers
      integerBasedSort: false, // Disable - causes issues with large scene ranges
      halfPrecisionCovariancesOnGPU: true,
      dynamicScene: true,
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

    // Load the splat scene
    viewer
      .addSplatScene(url, {
        showLoadingUI: false,
        progressiveLoad: false,
        position: position,
        rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
        scale: [scale, scale, scale],
        onProgress: (percent: number) => {
          if (!isDisposedRef.current) {
            console.log("[GaussianSplats] Progress:", percent + "%");
            onProgressRef.current?.(percent);
          }
        },
      })
      .then(() => {
        if (!isDisposedRef.current) {
          console.log("[GaussianSplats] Load complete");

          // Get splat mesh and info
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const viewerAny = viewer as any;
          const splatMesh = viewerAny.splatMesh;

          if (splatMesh) {
            console.log("[GaussianSplats] SplatMesh found, visible:", splatMesh.visible);
            console.log("[GaussianSplats] SplatMesh in scene:", splatMesh.parent?.type);

            // Debug material info
            const material = splatMesh.material;
            console.log("[GaussianSplats] Material type:", material?.type);
            console.log("[GaussianSplats] Material visible:", material?.visible);
            console.log("[GaussianSplats] Material transparent:", material?.transparent);

            // Ensure mesh is visible and renderable
            splatMesh.visible = true;
            splatMesh.frustumCulled = false;
            splatMesh.renderOrder = 999; // Render last

            // Fix material settings if needed
            if (material) {
              material.visible = true;
              material.transparent = true;
              material.depthTest = true;
              material.depthWrite = false; // Splats are transparent
              material.needsUpdate = true;
            }

            // CRITICAL: Manually add splatMesh to R3F scene if not already added
            if (!splatMesh.parent) {
              console.log("[GaussianSplats] Adding splatMesh to R3F scene manually");
              scene.add(splatMesh);
              console.log("[GaussianSplats] SplatMesh now in scene:", splatMesh.parent?.type);
            }

            const splatCount = splatMesh.getSplatCount?.() || 0;
            console.log("[GaussianSplats] Total splats:", splatCount);

            // Debug geometry
            const geometry = splatMesh.geometry;
            if (geometry) {
              console.log("[GaussianSplats] Geometry type:", geometry.type);
              console.log("[GaussianSplats] Geometry attributes:", Object.keys(geometry.attributes || {}));
              const posAttr = geometry.attributes?.position;
              if (posAttr) {
                console.log("[GaussianSplats] Position attribute count:", posAttr.count);
              }
            }

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
          } else {
            console.log("[GaussianSplats] No splatMesh found!");
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
      console.log("[GaussianSplats] Cleanup - disposing viewer");
      isDisposedRef.current = true;
      isLoadingRef.current = false;
      isReadyRef.current = false;
      if (viewerRef.current) {
        // Remove splatMesh from scene before disposing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const splatMesh = (viewerRef.current as any).splatMesh;
        if (splatMesh && splatMesh.parent) {
          splatMesh.parent.remove(splatMesh);
        }
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [url, gl, camera, scene]);

  // Update splat sorting each frame (viewer handles the rendering since splatMesh is in scene)
  useFrame(() => {
    if (viewerRef.current && isReadyRef.current && !isDisposedRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (viewerRef.current as any).update();
    }
  });

  return <group ref={groupRef} />;
}

export default GaussianSplats;
