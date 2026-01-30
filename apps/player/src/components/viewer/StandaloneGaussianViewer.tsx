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

    // Create the viewer with rootElement so it knows where to render
    // Cast to any to bypass TypeScript issues with library's type definitions
    const viewer = new GaussianSplats3D.Viewer({
      // IMPORTANT: Tell the library where to render
      rootElement: container,
      cameraUp: [0, 1, 0],
      initialCameraPosition: [0, 0, 10],
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
      halfPrecisionCovariancesOnGPU: false, // Disabled - was causing "value out of range" errors
      dynamicScene: true,
      renderMode: GaussianSplats3D.RenderMode.Always,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
      logLevel: GaussianSplats3D.LogLevel.Debug,
      sphericalHarmonicsDegree: 0,
      // Anti-aliasing for better quality
      antialiased: true,
    } as any);

    viewerRef.current = viewer;
    console.log("[Standalone] Viewer created with rootElement");

    // Load the splat scene - explicitly specify PLY format for blob URLs
    // The library can't detect format from blob: URLs since they have no extension
    // Cast options to any since TypeScript definitions don't include 'format'
    viewer
      .addSplatScene(url, {
        showLoadingUI: true,
        progressiveLoad: false,
        format: 0, // 0 = PLY format (SceneFormat.Ply)
        onProgress: (percent: number) => {
          if (!isMounted) return;
          const pct = percent > 1 ? percent : percent * 100;
          console.log("[Standalone] Loading:", Math.round(pct) + "%");
          setProgress(Math.round(pct));
          onProgress?.(percent > 1 ? percent / 100 : percent);
        },
      } as any)
      .then(() => {
        if (!isMounted) return;
        console.log("[Standalone] Scene loaded successfully!");

        // Start the viewer first - bounds are calculated after start
        viewer.start();
        console.log("[Standalone] Viewer started");

        // Position camera after a delay to let bounds be calculated
        const positionCamera = () => {
          try {
            const splatMesh = (viewer as any).splatMesh;

            if (splatMesh) {
              const splatCount = splatMesh.getSplatCount?.() || 0;
              console.log("[Standalone] Total splat count:", splatCount);

              // Check the splatTree for bounds (it's built after start)
              const splatTree = splatMesh.baseSplatTree || splatMesh.splatTree;
              console.log("[Standalone] SplatTree:", splatTree);
              console.log("[Standalone] SplatTree keys:", splatTree ? Object.keys(splatTree) : "null");

              // Try different ways to find bounds
              let bb = null;

              // Method 1: rootNode
              if (splatTree?.rootNode?.boundingBox) {
                bb = splatTree.rootNode.boundingBox;
                console.log("[Standalone] Found bounds via rootNode");
              }
              // Method 2: direct boundingBox
              else if (splatTree?.boundingBox) {
                bb = splatTree.boundingBox;
                console.log("[Standalone] Found bounds via splatTree.boundingBox");
              }
              // Method 3: subTrees[0]
              else if (splatTree?.subTrees?.[0]?.rootNode?.boundingBox) {
                bb = splatTree.subTrees[0].rootNode.boundingBox;
                console.log("[Standalone] Found bounds via subTrees[0]");
              }
              // Method 4: Try splatBuffer centerArray to compute bounds
              if (!bb && splatMesh.scenes?.[0]) {
                const scene = splatMesh.scenes[0];
                const splatBuffer = scene.splatBuffer;

                if (splatBuffer) {
                  console.log("[Standalone] SplatBuffer keys:", Object.keys(splatBuffer));

                  // Look for center data
                  const centerArray = splatBuffer.centerArray;
                  if (centerArray && centerArray.length > 0) {
                    console.log("[Standalone] CenterArray length:", centerArray.length, "first 12:", Array.from(centerArray.slice(0, 12)));

                    // Compute bounds from center array
                    let minX = Infinity, minY = Infinity, minZ = Infinity;
                    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

                    const stride = 3;
                    const count = Math.floor(centerArray.length / stride);
                    const sampleStep = Math.max(1, Math.floor(count / 5000)); // Sample ~5000 points

                    for (let i = 0; i < count; i += sampleStep) {
                      const x = centerArray[i * stride];
                      const y = centerArray[i * stride + 1];
                      const z = centerArray[i * stride + 2];

                      if (isFinite(x) && isFinite(y) && isFinite(z)) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        minZ = Math.min(minZ, z);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                        maxZ = Math.max(maxZ, z);
                      }
                    }

                    if (isFinite(minX) && isFinite(maxX)) {
                      bb = {
                        min: { x: minX, y: minY, z: minZ },
                        max: { x: maxX, y: maxY, z: maxZ }
                      };
                      console.log("[Standalone] Computed bounds from centerArray:", bb);
                    }
                  }
                }
              }

              console.log("[Standalone] Found boundingBox:", bb);

              // Use the bounding box if we found one
              if (bb && bb.min && bb.max) {
                const centerX = (bb.min.x + bb.max.x) / 2;
                const centerY = (bb.min.y + bb.max.y) / 2;
                const centerZ = (bb.min.z + bb.max.z) / 2;

                const sizeX = bb.max.x - bb.min.x;
                const sizeY = bb.max.y - bb.min.y;
                const sizeZ = bb.max.z - bb.min.z;
                const maxSize = Math.max(sizeX, sizeY, sizeZ);

                console.log("[Standalone] Bounds center:", { x: centerX, y: centerY, z: centerZ });
                console.log("[Standalone] Bounds size:", { x: sizeX, y: sizeY, z: sizeZ });

                if (isFinite(maxSize) && maxSize > 0) {
                  const cam = (viewer as any).camera;
                  const controls = (viewer as any).controls;

                  if (cam) {
                    const distance = maxSize * 1.5;
                    cam.position.set(centerX, centerY + sizeY * 0.2, centerZ + distance);
                    cam.lookAt(centerX, centerY, centerZ);
                    console.log("[Standalone] Camera repositioned to:", cam.position);

                    if (controls && controls.target) {
                      controls.target.set(centerX, centerY, centerZ);
                      controls.update?.();
                      console.log("[Standalone] Controls target set");
                    }
                  }
                  return true; // Success
                }
              }
            }
          } catch (e) {
            console.log("[Standalone] Could not auto-center camera:", e);
          }
          return false;
        };

        // Try immediately, then retry after delays if needed
        if (!positionCamera()) {
          setTimeout(() => {
            if (isMounted && !positionCamera()) {
              setTimeout(() => {
                if (isMounted) positionCamera();
              }, 1000);
            }
          }, 500);
        }

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
