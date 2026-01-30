"use client";

import { useEffect, useRef, useState } from "react";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

export interface StandaloneGaussianViewerProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

/**
 * Standalone Gaussian Splat Viewer - NO R3F
 *
 * This component creates its own canvas and Three.js setup,
 * letting the library fully control the rendering pipeline.
 * This avoids any potential conflicts with R3F.
 */
export function StandaloneGaussianViewer({
  url,
  onLoad,
  onError,
  onProgress,
}: StandaloneGaussianViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    let isMounted = true;
    const container = containerRef.current;

    console.log("[Standalone] Creating viewer with URL:", url);
    console.log("[Standalone] Container size:", container.clientWidth, "x", container.clientHeight);

    // Create the viewer with library defaults - let it handle everything
    // Cast to any to bypass TypeScript issues with library's type definitions
    const viewer = new GaussianSplats3D.Viewer({
      // Let library create its own renderer
      cameraUp: [0, 1, 0],
      initialCameraPosition: [0, 0, 5],
      initialCameraLookAt: [0, 0, 0],
      // Use built-in controls for navigation
      useBuiltInControls: true,
      // Let library handle its own render loop
      selfDrivenMode: true,
      // Standard settings
      gpuAcceleratedSort: true,
      enableSIMDInSort: true,
      sharedMemoryForWorkers: false,
      integerBasedSort: true,
      halfPrecisionCovariancesOnGPU: true,
      dynamicScene: true,
      renderMode: GaussianSplats3D.RenderMode.Always,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      logLevel: GaussianSplats3D.LogLevel.Debug,
      sphericalHarmonicsDegree: 0,
    } as any);

    viewerRef.current = viewer;

    // Add the viewer's canvas to our container
    // Cast to any since TypeScript definitions don't include renderer property
    const rendererElement = (viewer as any).renderer?.domElement;
    if (rendererElement) {
      rendererElement.style.width = "100%";
      rendererElement.style.height = "100%";
      container.appendChild(rendererElement);
      console.log("[Standalone] Canvas added to container");
    }

    // Load the splat scene - explicitly specify PLY format for blob URLs
    // The library can't detect format from blob: URLs since they have no extension
    viewer
      .addSplatScene(url, {
        showLoadingUI: true,
        progressiveLoad: false,
        format: GaussianSplats3D.SceneFormat.Ply,
        onProgress: (percent: number) => {
          if (!isMounted) return;
          const pct = percent > 1 ? percent : percent * 100;
          console.log("[Standalone] Loading:", Math.round(pct) + "%");
          setProgress(Math.round(pct));
          onProgress?.(percent > 1 ? percent / 100 : percent);
        },
      })
      .then(() => {
        if (!isMounted) return;
        console.log("[Standalone] Scene loaded successfully!");

        // Start the viewer
        viewer.start();
        console.log("[Standalone] Viewer started");

        setLoading(false);
        onLoad?.();
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        console.error("[Standalone] Failed to load:", err);
        setError(err.message);
        setLoading(false);
        onError?.(err);
      });

    // Handle resize
    const handleResize = () => {
      if (viewerRef.current && container) {
        // Library should handle resize internally
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);

      if (viewerRef.current) {
        try {
          viewerRef.current.stop();
          viewerRef.current.dispose();
        } catch (e) {
          // Ignore cleanup errors
        }
        viewerRef.current = null;
      }

      // Remove canvas from container
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [url, onLoad, onError, onProgress]);

  return (
    <div className="relative w-full h-full">
      {/* Container for the viewer's canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ background: "#000" }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Loading 3D Scene</p>
            <p className="text-gray-400">{progress}%</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center text-red-500">
            <p className="text-lg font-bold mb-2">Error Loading Scene</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Controls hint */}
      {!loading && !error && (
        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-2 rounded text-sm z-10">
          <p>Mouse: Rotate | Scroll: Zoom | Arrows: Pan</p>
        </div>
      )}
    </div>
  );
}

export default StandaloneGaussianViewer;
