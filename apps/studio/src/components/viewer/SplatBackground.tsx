"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

export interface SplatBackgroundRef {
  updateCamera: (position: THREE.Vector3, target: THREE.Vector3) => void;
}

export interface SplatBackgroundProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

/**
 * SplatBackground - Renders Gaussian splats to a separate canvas
 *
 * This component creates its own WebGL renderer and canvas, completely
 * independent of R3F. The camera can be synced externally via ref.
 */
export const SplatBackground = forwardRef<SplatBackgroundRef, SplatBackgroundProps>(
  ({ url, onLoad, onError, onProgress }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

    // Expose camera update method via ref
    useImperativeHandle(ref, () => ({
      updateCamera: (position: THREE.Vector3, target: THREE.Vector3) => {
        if (cameraRef.current) {
          cameraRef.current.position.copy(position);
          cameraRef.current.lookAt(target);
          cameraRef.current.updateProjectionMatrix();
        }
      },
    }));

    useEffect(() => {
      if (!containerRef.current || !url) return;

      const container = containerRef.current;
      let isMounted = true;

      // Create dedicated renderer for splats
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false, // Splat layer doesn't need transparency
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x1a1a1a); // Dark background
      container.appendChild(renderer.domElement);

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        50, // Match R3F camera FOV
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Create viewer with its own renderer
      const viewer = new GaussianSplats3D.Viewer({
        renderer,
        camera,
        useBuiltInControls: false, // We sync camera from R3F
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
      });

      viewerRef.current = viewer;

      console.log("[SplatBackground] Loading splats from:", url);

      // Load the splat scene
      viewer
        .addSplatScene(url, {
          showLoadingUI: false,
          progressiveLoad: true,
          onProgress: (percent: number) => {
            if (!isMounted) return;
            console.log(`[SplatBackground] Loading: ${percent.toFixed(1)}%`);
            onProgress?.(percent);
          },
        })
        .then(() => {
          if (!isMounted) return;
          console.log("[SplatBackground] Splats loaded, starting viewer");
          viewer.start();
          onLoad?.();
        })
        .catch((err: Error) => {
          if (!isMounted) return;
          console.error("[SplatBackground] Failed to load:", err);
          onError?.(err);
        });

      // Handle resize
      const handleResize = () => {
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        isMounted = false;
        window.removeEventListener("resize", handleResize);

        if (viewerRef.current) {
          viewerRef.current.stop();
          viewerRef.current.dispose();
          viewerRef.current = null;
        }

        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }

        cameraRef.current = null;
      };
    }, [url, onLoad, onError, onProgress]);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ zIndex: 0 }}
      />
    );
  }
);

SplatBackground.displayName = "SplatBackground";
