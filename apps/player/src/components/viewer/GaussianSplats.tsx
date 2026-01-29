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

/**
 * GaussianSplats component for rendering splat scenes in R3F (Player app)
 *
 * Uses selfDrivenMode with shared renderer for proper splat rendering.
 * Includes WebGL context loss handling for large scenes.
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
  const contextLostRef = useRef(false);

  // Store callbacks in refs to avoid re-running useEffect when they change
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onLoad, onError, onProgress]);

  // Disable R3F's autoClear so viewer can render on same canvas
  useEffect(() => {
    if (gl) {
      gl.autoClear = false;
    }
  }, [gl]);

  // Handle WebGL context loss
  useEffect(() => {
    if (!gl) return;

    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLostRef.current = true;
      console.error("[Player] WebGL context lost - scene may be too large for this device");

      // Stop the viewer if it exists
      if (viewerRef.current) {
        try {
          viewerRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }

      // Report error to parent
      onErrorRef.current?.(new Error("WebGL context lost - the 3D scene is too large for your browser. Try using a device with more GPU memory, or a different browser."));
    };

    const handleContextRestored = () => {
      console.log("[Player] WebGL context restored");
      contextLostRef.current = false;
      // Could attempt to reload here, but safer to let user refresh
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl]);

  useEffect(() => {
    if (!gl || !camera || !url) return;
    if (contextLostRef.current) return;

    let isMounted = true;

    // Delay to handle React Strict Mode double-mount
    const initTimeout = setTimeout(() => {
      if (!isMounted || contextLostRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewer = new GaussianSplats3D.Viewer({
        renderer: gl,
        camera: camera as THREE.PerspectiveCamera,
        useBuiltInControls: false,
        selfDrivenMode: true,
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
        antialiased: false, // Disable antialiasing to reduce memory
        focalAdjustment: 1.0,
        logLevel: GaussianSplats3D.LogLevel.None,
        sphericalHarmonicsDegree: 0,
        // Memory optimization: remove nearly-transparent splats
        splatAlphaRemovalThreshold: 5, // Remove splats with alpha < 5 (out of 255)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      viewerRef.current = viewer;

      console.log("[Player] Loading Gaussian splats from:", url);
      console.log("[Player] Renderer:", gl);
      console.log("[Player] Camera:", camera);
      console.log("[Player] Canvas size:", gl.domElement.width, "x", gl.domElement.height);

      viewer
        .addSplatScene(url, {
          showLoadingUI: false,
          progressiveLoad: true,
          position: position,
          rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
          scale: [scale, scale, scale],
          // Memory optimization: remove low-alpha splats during load
          splatAlphaRemovalThreshold: 5,
          onProgress: (percent: number) => {
            if (!isMounted) return;
            console.log("[Player] Loading progress:", Math.round(percent * 100) + "%");
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted || contextLostRef.current) return;
          console.log("[Player] Gaussian splats loaded successfully!");
          console.log("[Player] Starting viewer...");
          viewer.start();
          console.log("[Player] Viewer started");
          onLoadRef.current?.();
        })
        .catch((err: Error) => {
          if (!isMounted) return;
          console.error("[Player] Failed to load Gaussian splats:", err);
          console.error("[Player] Error details:", err.message, err.stack);
          onErrorRef.current?.(err);
        });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);

      if (viewerRef.current) {
        try {
          viewerRef.current.stop();
          viewerRef.current.dispose();
        } catch (e) {
          // Ignore errors during cleanup if context was lost
        }
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera, JSON.stringify(position), JSON.stringify(rotation), scale]);

  return null;
}

export default GaussianSplats;
