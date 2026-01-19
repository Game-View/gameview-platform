"use client";

import { useEffect, useRef, useState } from "react";
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

  // Use refs for callbacks to avoid re-triggering effect
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onLoad, onError, onProgress]);

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current || !splatUrl) return;

    const container = containerRef.current;
    let isMounted = true;
    const instanceId = Math.random().toString(36).substr(2, 9);

    console.log(`[SceneViewer:${instanceId}] Effect started, waiting for stability...`);

    // Delay to handle React Strict Mode's double-mount cycle
    const initTimeout = setTimeout(() => {
      if (!isMounted) {
        console.log(`[SceneViewer:${instanceId}] Unmounted during delay, skipping`);
        return;
      }

      console.log(`[SceneViewer:${instanceId}] Initializing...`);
      console.log(`[SceneViewer:${instanceId}] Container dimensions: ${container.clientWidth}x${container.clientHeight}`);

      // Let the viewer create its own renderer, camera, and controls
      // This is the simplest initialization pattern from the library docs
      const viewer = new GaussianSplats3D.Viewer({
        cameraUp: [0, 1, 0], // Standard Y-up
        initialCameraPosition: [initialPosition.x, initialPosition.y, initialPosition.z],
        initialCameraLookAt: [initialTarget.x, initialTarget.y, initialTarget.z],
        sharedMemoryForWorkers: false,
        renderMode: GaussianSplats3D.RenderMode.Always,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
        logLevel: GaussianSplats3D.LogLevel.Debug, // Enable debug logging
        sphericalHarmonicsDegree: 0,
      });

      viewerRef.current = viewer;

      // Move the viewer's canvas into our container
      // The viewer creates and appends its canvas to document.body by default
      setTimeout(() => {
        // Find the canvas created by the viewer (should be in body)
        const viewerCanvas = viewer.renderer?.domElement;
        if (viewerCanvas && viewerCanvas.parentElement !== container) {
          console.log(`[SceneViewer:${instanceId}] Moving canvas to container`);
          // Style the canvas to fill our container
          viewerCanvas.style.width = '100%';
          viewerCanvas.style.height = '100%';
          viewerCanvas.style.position = 'absolute';
          viewerCanvas.style.top = '0';
          viewerCanvas.style.left = '0';
          container.appendChild(viewerCanvas);

          // Resize to match container
          const width = container.clientWidth;
          const height = container.clientHeight;
          viewer.renderer?.setSize(width, height);
          if (viewer.camera) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cam = viewer.camera as any;
            if (cam.aspect !== undefined) {
              cam.aspect = width / height;
              cam.updateProjectionMatrix();
            }
          }
        }
      }, 50);

      console.log(`[SceneViewer:${instanceId}] Loading splats from:`, splatUrl);

      // Load the splat file
      viewer
        .addSplatScene(splatUrl, {
          showLoadingUI: false,
          progressiveLoad: true,
          onProgress: (percent: number) => {
            if (!isMounted) return;
            setLoadProgress(Math.round(percent));
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted) {
            console.log(`[SceneViewer:${instanceId}] Loaded but unmounted, ignoring`);
            return;
          }
          console.log(`[SceneViewer:${instanceId}] Splats loaded, starting viewer`);

          // DEBUG: Log viewer internal state
          console.log(`[SceneViewer:${instanceId}] Viewer splatMesh:`, viewer.splatMesh);
          console.log(`[SceneViewer:${instanceId}] Scene children:`, viewer.scene?.children?.length);
          if (viewer.splatMesh) {
            console.log(`[SceneViewer:${instanceId}] SplatMesh visible:`, viewer.splatMesh.visible);
            console.log(`[SceneViewer:${instanceId}] SplatMesh position:`, viewer.splatMesh.position);
            console.log(`[SceneViewer:${instanceId}] SplatMesh geometry:`, viewer.splatMesh.geometry);
          }

          setIsLoading(false);
          onLoadRef.current?.();
          viewer.start();

          // DEBUG: Check state after start
          setTimeout(() => {
            console.log(`[SceneViewer:${instanceId}] After start - splatMesh:`, viewer.splatMesh);
            console.log(`[SceneViewer:${instanceId}] After start - camera position:`, viewer.camera?.position);
            console.log(`[SceneViewer:${instanceId}] After start - renderer info:`, viewer.renderer?.info?.render);
          }, 500);
        })
        .catch((err: Error) => {
          if (!isMounted) return;
          console.error(`[SceneViewer:${instanceId}] Failed to load:`, err);
          setError(err.message || "Failed to load 3D scene");
          setIsLoading(false);
          onErrorRef.current?.(err);
        });

      // Handle resize
      const handleResize = () => {
        if (!container || !isMounted || !viewer.renderer || !viewer.camera) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cam = viewer.camera as any;
        if (cam.aspect !== undefined) {
          cam.aspect = width / height;
          cam.updateProjectionMatrix();
        }
        viewer.renderer.setSize(width, height);
      };

      window.addEventListener("resize", handleResize);

      // Store cleanup for resize listener
      (window as unknown as Record<string, () => void>)[`sceneViewerResize_${instanceId}`] = () => {
        window.removeEventListener("resize", handleResize);
      };
    }, 100); // 100ms delay for Strict Mode

    // Cleanup
    return () => {
      console.log(`[SceneViewer:${instanceId}] Cleanup starting...`);
      isMounted = false;
      clearTimeout(initTimeout);

      // Remove resize listener if it was set
      const cleanupResize = (window as unknown as Record<string, () => void>)[`sceneViewerResize_${instanceId}`];
      if (cleanupResize) {
        cleanupResize();
        delete (window as unknown as Record<string, () => void>)[`sceneViewerResize_${instanceId}`];
      }

      if (viewerRef.current) {
        // Remove canvas from container if present
        const canvas = viewerRef.current.renderer?.domElement;
        if (canvas && container.contains(canvas)) {
          container.removeChild(canvas);
        }
        viewerRef.current.stop();
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [splatUrl]); // Only re-run when URL changes

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
