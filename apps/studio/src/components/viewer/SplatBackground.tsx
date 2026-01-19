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
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

    // Use refs for callbacks to avoid re-running effect
    const onLoadRef = useRef(onLoad);
    const onErrorRef = useRef(onError);
    const onProgressRef = useRef(onProgress);

    useEffect(() => {
      onLoadRef.current = onLoad;
      onErrorRef.current = onError;
      onProgressRef.current = onProgress;
    }, [onLoad, onError, onProgress]);

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
      const instanceId = Math.random().toString(36).substr(2, 9);

      console.log(`[SplatBackground:${instanceId}] Effect started, waiting for stability...`);

      // Delay to handle React Strict Mode's double-mount cycle
      const initTimeout = setTimeout(() => {
        if (!isMounted) {
          console.log(`[SplatBackground:${instanceId}] Unmounted during delay, skipping`);
          return;
        }

        console.log(`[SplatBackground:${instanceId}] Initializing...`);
        console.log(`[SplatBackground:${instanceId}] Container dimensions: ${container.clientWidth}x${container.clientHeight}`);

        // Create Three.js renderer - EXACTLY like SceneViewer
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Create camera - EXACTLY like SceneViewer
        const camera = new THREE.PerspectiveCamera(
          75,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 2, 5);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Create viewer with orbit controls - EXACTLY like SceneViewer
        const viewer = new GaussianSplats3D.Viewer({
          renderer,
          camera,
          useBuiltInControls: true,
          ignoreDevicePixelRatio: false,
          gpuAcceleratedSort: true,
          enableSIMDInSort: true,
          sharedMemoryForWorkers: false,
          integerBasedSort: true,
          halfPrecisionCovariancesOnGPU: true,
          dynamicScene: false,
          webXRMode: GaussianSplats3D.WebXRMode.None,
          renderMode: GaussianSplats3D.RenderMode.OnChange,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
          antialiased: true,
          focalAdjustment: 1.0,
          logLevel: GaussianSplats3D.LogLevel.None,
          sphericalHarmonicsDegree: 0,
        });

        viewerRef.current = viewer;

        console.log(`[SplatBackground:${instanceId}] Loading splats from:`, url);

        // Load the splat file
        viewer
          .addSplatScene(url, {
            showLoadingUI: false,
            progressiveLoad: true,
            onProgress: (percent: number) => {
              if (!isMounted) return;
              console.log(`[SplatBackground:${instanceId}] Loading: ${percent.toFixed(1)}%`);
              onProgressRef.current?.(percent);
            },
          })
          .then(() => {
            if (!isMounted) {
              console.log(`[SplatBackground:${instanceId}] Loaded but unmounted, ignoring`);
              return;
            }
            console.log(`[SplatBackground:${instanceId}] Splats loaded, starting viewer`);
            viewer.start();
            onLoadRef.current?.();
          })
          .catch((err: Error) => {
            if (!isMounted) return;
            console.error(`[SplatBackground:${instanceId}] Failed to load:`, err);
            onErrorRef.current?.(err);
          });

        // Handle resize
        const handleResize = () => {
          if (!container || !isMounted) return;
          const width = container.clientWidth;
          const height = container.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };

        window.addEventListener("resize", handleResize);

        // Store cleanup for resize listener
        (window as unknown as Record<string, () => void>)[`splatResize_${instanceId}`] = () => {
          window.removeEventListener("resize", handleResize);
        };
      }, 100);

      return () => {
        console.log(`[SplatBackground:${instanceId}] Cleanup starting...`);
        isMounted = false;
        clearTimeout(initTimeout);

        // Remove resize listener if it was set
        const cleanupResize = (window as unknown as Record<string, () => void>)[`splatResize_${instanceId}`];
        if (cleanupResize) {
          cleanupResize();
          delete (window as unknown as Record<string, () => void>)[`splatResize_${instanceId}`];
        }

        if (viewerRef.current) {
          viewerRef.current.stop();
          viewerRef.current.dispose();
          viewerRef.current = null;
        }

        if (rendererRef.current) {
          rendererRef.current.dispose();
          if (container.contains(rendererRef.current.domElement)) {
            container.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current = null;
        }

        cameraRef.current = null;
      };
    }, [url]); // Only re-run when URL changes

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
