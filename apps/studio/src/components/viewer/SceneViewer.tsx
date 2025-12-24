"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

export interface SceneViewerProps {
  splatUrl: string;
  thumbnailUrl?: string;
  initialPosition?: { x: number; y: number; z: number };
  initialTarget?: { x: number; y: number; z: number };
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function SceneViewer({
  splatUrl,
  thumbnailUrl,
  initialPosition = { x: 0, y: 2, z: 5 },
  initialTarget = { x: 0, y: 0, z: 0 },
  onLoad,
  onError,
  onProgress,
}: SceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Create Three.js renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
    camera.lookAt(initialTarget.x, initialTarget.y, initialTarget.z);

    // Create viewer with orbit controls
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

    // Load the splat file
    viewer
      .addSplatScene(splatUrl, {
        showLoadingUI: false,
        progressiveLoad: true,
        onProgress: (percent: number) => {
          setLoadProgress(Math.round(percent));
          onProgress?.(percent);
        },
      })
      .then(() => {
        setIsLoading(false);
        onLoad?.();
        viewer.start();
      })
      .catch((err: Error) => {
        console.error("Failed to load splat:", err);
        setError(err.message || "Failed to load 3D scene");
        setIsLoading(false);
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

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      viewer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [splatUrl, initialPosition, initialTarget, onLoad, onError, onProgress]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gv-neutral-900/90 z-10">
          {thumbnailUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
          )}
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 border-4 border-gv-primary-500/30 border-t-gv-primary-500 rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-white font-medium mb-2">Loading 3D Scene</p>
            <p className="text-gv-neutral-400 text-sm">{loadProgress}%</p>
            <div className="w-48 h-1.5 bg-gv-neutral-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gv-primary-500 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gv-neutral-900/90 z-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-white font-medium mb-2">Failed to Load Scene</p>
            <p className="text-gv-neutral-400 text-sm max-w-xs">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
