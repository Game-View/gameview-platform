"use client";

import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

// WebGL has limited GPU memory compared to desktop OpenGL
// Desktop can handle 10M+ splats, browser typically crashes above 1-2M
// PLY file size roughly correlates: ~30 bytes per splat
// 100MB PLY ≈ 3.3M splats, 50MB ≈ 1.6M splats
const MAX_PLY_SIZE_MB = 100; // Max file size in MB before showing error
// Note: Disabled alpha threshold entirely - was causing "leaves with splats: 0"
// The library may interpret alpha values differently than expected

/**
 * Parse PLY file header and sample vertices to compute scene bounds
 * This is the same approach desktop viewers use to find the scene center
 */
async function computeBoundsFromPLY(url: string): Promise<SceneBounds | null> {
  try {
    console.log("[PLY Parser] Fetching PLY to compute bounds from:", url);

    // Try Range request first, fall back to full fetch if not supported
    let response = await fetch(url, {
      headers: { Range: "bytes=0-102400" }
    });

    // Check if Range was honored (206) or if we got the full file (200)
    if (response.status !== 206 && response.status !== 200) {
      console.warn("[PLY Parser] Range request failed, status:", response.status);
      // Try without Range header
      response = await fetch(url);
    }

    console.log("[PLY Parser] Fetch status:", response.status);

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    console.log("[PLY Parser] Fetched", buffer.byteLength, "bytes");

    // Find header end (look for "end_header\n")
    let headerEnd = -1;
    const decoder = new TextDecoder();
    const text = decoder.decode(bytes.slice(0, Math.min(4096, bytes.length)));
    const endHeaderIndex = text.indexOf("end_header");

    if (endHeaderIndex === -1) {
      console.error("[PLY Parser] Could not find end_header");
      return null;
    }

    // Find the newline after end_header
    headerEnd = endHeaderIndex + "end_header".length;
    while (headerEnd < bytes.length && bytes[headerEnd] !== 10) {
      headerEnd++;
    }
    headerEnd++; // Skip the newline

    const header = text.slice(0, endHeaderIndex + "end_header".length);
    console.log("[PLY Parser] Header:", header);

    // Parse header to find format and properties
    const lines = header.split("\n");
    let vertexCount = 0;
    let format = "";
    const properties: string[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === "format") {
        format = parts[1];
      } else if (parts[0] === "element" && parts[1] === "vertex") {
        vertexCount = parseInt(parts[2], 10);
      } else if (parts[0] === "property") {
        properties.push(parts[2]); // property type name
      }
    }

    console.log("[PLY Parser] Format:", format);
    console.log("[PLY Parser] Vertex count:", vertexCount);
    console.log("[PLY Parser] Properties:", properties.slice(0, 10));

    // Find x, y, z property indices
    const xIndex = properties.indexOf("x");
    const yIndex = properties.indexOf("y");
    const zIndex = properties.indexOf("z");

    if (xIndex === -1 || yIndex === -1 || zIndex === -1) {
      console.error("[PLY Parser] Could not find x, y, z properties");
      return null;
    }

    console.log("[PLY Parser] Position indices - x:", xIndex, "y:", yIndex, "z:", zIndex);

    // For binary_little_endian, read float32 values
    if (format !== "binary_little_endian") {
      console.error("[PLY Parser] Unsupported format:", format);
      return null;
    }

    // Calculate bytes per vertex (assuming all properties are float32)
    const bytesPerVertex = properties.length * 4;
    console.log("[PLY Parser] Bytes per vertex:", bytesPerVertex);

    // Read sample vertices to compute bounds
    const dataView = new DataView(buffer, headerEnd);
    const sampleCount = Math.min(1000, Math.floor((buffer.byteLength - headerEnd) / bytesPerVertex));

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i < sampleCount; i++) {
      const offset = i * bytesPerVertex;

      if (offset + (zIndex + 1) * 4 > dataView.byteLength) break;

      const x = dataView.getFloat32(offset + xIndex * 4, true);
      const y = dataView.getFloat32(offset + yIndex * 4, true);
      const z = dataView.getFloat32(offset + zIndex * 4, true);

      // Skip invalid values
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }

    if (!isFinite(minX) || !isFinite(maxX)) {
      console.error("[PLY Parser] Could not compute valid bounds");
      return null;
    }

    const center = new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );

    const size = new THREE.Vector3(
      maxX - minX,
      maxY - minY,
      maxZ - minZ
    );

    const radius = Math.max(size.x, size.y, size.z) / 2;

    console.log("[PLY Parser] SUCCESS - Computed bounds from PLY data:");
    console.log("[PLY Parser]   Min:", minX.toFixed(2), minY.toFixed(2), minZ.toFixed(2));
    console.log("[PLY Parser]   Max:", maxX.toFixed(2), maxY.toFixed(2), maxZ.toFixed(2));
    console.log("[PLY Parser]   Center:", center);
    console.log("[PLY Parser]   Size:", size);
    console.log("[PLY Parser]   Radius:", radius.toFixed(2));

    return { center, size, radius };
  } catch (err) {
    console.error("[PLY Parser] Failed to parse PLY:", err);
    return null;
  }
}

export interface SceneBounds {
  center: THREE.Vector3;
  size: THREE.Vector3;
  radius: number;
}

export interface GaussianSplatsProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onLoad?: (bounds?: SceneBounds) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

/**
 * GaussianSplats component for rendering splat scenes in R3F (Player app)
 *
 * Uses selfDrivenMode with shared renderer for proper splat rendering.
 * Includes:
 * - Pre-check of PLY file size to avoid crashes
 * - Aggressive alpha culling to reduce splat count
 * - WebGL context loss handling for graceful error display
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
  const viewerReadyRef = useRef(false); // Track when viewer is ready for manual rendering
  const contextLostRef = useRef(false);
  const [fileSizeChecked, setFileSizeChecked] = useState(false);
  const [fileSizeOk, setFileSizeOk] = useState(false);
  const [fileSizeMB, setFileSizeMB] = useState<number | null>(null);
  // Use ref for PLY bounds so it's accessible from callbacks without closure issues
  const plyBoundsRef = useRef<SceneBounds | null>(null);

  // Store callbacks in refs to avoid re-running useEffect when they change
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  // MANUAL RENDERING: Call viewer.update() and viewer.render() each frame
  // This gives us control over the render loop instead of relying on selfDrivenMode
  useFrame(() => {
    if (viewerRef.current && viewerReadyRef.current && !contextLostRef.current) {
      try {
        // Cast to any because library types don't expose update/render methods
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viewer = viewerRef.current as any;
        // Update the viewer (sorting, culling, etc.)
        viewer.update();
        // Render the splats
        viewer.render();
      } catch (e) {
        // Ignore render errors (might happen during cleanup)
      }
    }
  });

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

      // Report error to parent with helpful message
      const sizePart = fileSizeMB ? ` (${fileSizeMB.toFixed(1)}MB)` : "";
      onErrorRef.current?.(
        new Error(
          `WebGL crashed loading this scene${sizePart}. ` +
          `The scene has too many splats for browser rendering. ` +
          `Try downloading the PLY file and viewing in a desktop app like Splatapult.`
        )
      );
    };

    const handleContextRestored = () => {
      console.log("[Player] WebGL context restored");
      contextLostRef.current = false;
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl, fileSizeMB]);

  // Pre-check file size and compute PLY bounds before loading
  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    async function checkFileSizeAndComputeBounds() {
      try {
        console.log("[Player] Checking PLY file size...");
        const response = await fetch(url, { method: "HEAD" });

        if (cancelled) return;

        const contentLength = response.headers.get("content-length");
        if (contentLength) {
          const sizeBytes = parseInt(contentLength, 10);
          const sizeMB = sizeBytes / (1024 * 1024);
          setFileSizeMB(sizeMB);

          console.log(`[Player] PLY file size: ${sizeMB.toFixed(2)} MB`);

          if (sizeMB > MAX_PLY_SIZE_MB) {
            console.warn(
              `[Player] PLY file is ${sizeMB.toFixed(1)}MB, exceeds ${MAX_PLY_SIZE_MB}MB limit. ` +
              `This may crash the browser.`
            );
          }

          setFileSizeOk(true);
        } else {
          console.log("[Player] Could not determine file size, proceeding anyway");
          setFileSizeOk(true);
        }

        // IMPORTANT: Compute bounds from PLY data BEFORE library loads it
        // This is how desktop viewers find the scene center
        if (!cancelled) {
          console.log("[Player] Computing bounds from PLY data...");
          const bounds = await computeBoundsFromPLY(url);
          if (!cancelled && bounds) {
            plyBoundsRef.current = bounds;
            console.log("[Player] PLY bounds computed and stored in ref:", bounds.center, "radius:", bounds.radius);
          }
        }
      } catch (err) {
        console.warn("[Player] Failed to check file size:", err);
        setFileSizeOk(true);
      } finally {
        if (!cancelled) {
          setFileSizeChecked(true);
        }
      }
    }

    checkFileSizeAndComputeBounds();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Main loading effect - only runs after file size check
  useEffect(() => {
    if (!gl || !camera || !url) return;
    if (!fileSizeChecked || !fileSizeOk) return;
    if (contextLostRef.current) return;

    let isMounted = true;

    // Delay to handle React Strict Mode double-mount
    const initTimeout = setTimeout(() => {
      if (!isMounted || contextLostRef.current) return;

      console.log("[Player] Creating Gaussian splat viewer...");
      console.log("[Player] Using selfDrivenMode=FALSE for manual render control");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewer = new GaussianSplats3D.Viewer({
        renderer: gl,
        camera: camera as THREE.PerspectiveCamera,
        useBuiltInControls: false,
        // CRITICAL: Use manual rendering mode so we control when render happens
        selfDrivenMode: false,
        ignoreDevicePixelRatio: false,
        gpuAcceleratedSort: true,
        enableSIMDInSort: true,
        sharedMemoryForWorkers: false,
        integerBasedSort: true,
        halfPrecisionCovariancesOnGPU: true,
        // dynamicScene=true rebuilds tree each frame
        dynamicScene: true,
        webXRMode: GaussianSplats3D.WebXRMode.None,
        renderMode: GaussianSplats3D.RenderMode.Always,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
        antialiased: false,
        focalAdjustment: 1.0,
        logLevel: GaussianSplats3D.LogLevel.Debug,
        sphericalHarmonicsDegree: 0,
        optimizeSplatData: false,
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
          // IMPORTANT: Disable progressive loading - may fix "leaves with splats: 0" issue
          // Progressive loading can cause tree building issues
          progressiveLoad: false,
          position: position,
          rotation: [rotation[0], rotation[1], rotation[2], "XYZ"] as [number, number, number, string],
          scale: [scale, scale, scale],
          onProgress: (percent: number) => {
            if (!isMounted) return;
            // Library reports 0-100, not 0-1
            const pct = percent > 1 ? percent : percent * 100;
            console.log("[Player] Loading progress:", Math.round(pct) + "%");
            onProgressRef.current?.(percent > 1 ? percent / 100 : percent);
          },
        })
        .then(() => {
          if (!isMounted || contextLostRef.current) return;

          console.log("[Player] Gaussian splats loaded successfully!");

          // Define camera positioning function
          const positionCameraToScene = (center: THREE.Vector3, radius: number) => {
            const perspCamera = camera as THREE.PerspectiveCamera;

            // Position camera AT the center of the scene
            perspCamera.position.set(center.x, center.y, center.z);

            // Look forward along -Z axis
            perspCamera.lookAt(center.x, center.y, center.z - 1);

            // Use very small near plane for small scenes
            perspCamera.near = 0.0001;
            perspCamera.far = Math.max(1000, radius * 200);
            perspCamera.updateProjectionMatrix();

            console.log("[Camera] POSITIONED AT CENTER:");
            console.log("[Camera]   Position:", perspCamera.position.x.toFixed(4), perspCamera.position.y.toFixed(4), perspCamera.position.z.toFixed(4));
            console.log("[Camera]   Scene center:", center.x.toFixed(4), center.y.toFixed(4), center.z.toFixed(4));
            console.log("[Camera]   Scene radius:", radius.toFixed(4));
          };

          // IMPORTANT: Position camera BEFORE starting viewer (like desktop)
          // Desktop viewer sets camera position before entering render loop
          if (plyBoundsRef.current) {
            const { center, radius } = plyBoundsRef.current;
            console.log("[Camera] Using PLY-parsed bounds (BEFORE viewer.start):");
            console.log("[Camera]   Center:", center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));
            console.log("[Camera]   Radius:", radius.toFixed(2));
            positionCameraToScene(center, radius);
          }

          // With selfDrivenMode=false, we don't call viewer.start()
          // Instead, our useFrame hook will call viewer.update() and viewer.render()
          console.log("[Player] Enabling manual rendering via useFrame hook...");
          viewerReadyRef.current = true;

          // Set WebGL state for proper rendering
          const glContext = gl.getContext();
          if (glContext) {
            console.log("[WebGL] Setting render state:");
            glContext.enable(glContext.DEPTH_TEST);
            glContext.depthFunc(glContext.LEQUAL);
            glContext.enable(glContext.BLEND);
            glContext.blendFunc(glContext.ONE, glContext.ONE_MINUS_SRC_ALPHA);
            console.log("[WebGL]   Canvas:", glContext.drawingBufferWidth, "x", glContext.drawingBufferHeight);
          }

          // Report load complete
          if (plyBoundsRef.current) {
            onLoadRef.current?.(plyBoundsRef.current);
            return;
          }

          console.log("[Camera] PLY bounds not available, waiting for library tree...");

          // Fallback: Wait for tree to build
          let checkAttempts = 0;
          const maxAttempts = 30; // 3 seconds max

          const waitForTreeAndPosition = () => {
            if (!isMounted) return;
            checkAttempts++;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const viewerAny = viewer as any;

            // Check PLY bounds again (might have been computed while waiting)
            if (plyBoundsRef.current) {
              const { center, radius } = plyBoundsRef.current;
              console.log("[Camera] PLY bounds now available:");
              console.log("[Camera]   Center:", center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));
              console.log("[Camera]   Radius:", radius.toFixed(2));
              positionCameraToScene(center, radius);
              onLoadRef.current?.(plyBoundsRef.current);
              return;
            }

            // Try library methods
            let treeBounds: THREE.Box3 | null = null;

            // Method 1: splatTree.root.boundingBox
            if (viewerAny.splatTree?.root?.boundingBox) {
              treeBounds = viewerAny.splatTree.root.boundingBox;
              console.log("[Tree] Got root bounding box on attempt", checkAttempts);
            }

            // Method 2: Library's getSceneCenter/getSceneRadius
            if (!treeBounds) {
              try {
                const sceneCenter = viewer.getSceneCenter?.();
                const sceneRadius = viewer.getSceneRadius?.();

                if (sceneCenter && sceneRadius && sceneRadius > 0) {
                  treeBounds = new THREE.Box3(
                    new THREE.Vector3(
                      sceneCenter.x - sceneRadius,
                      sceneCenter.y - sceneRadius,
                      sceneCenter.z - sceneRadius
                    ),
                    new THREE.Vector3(
                      sceneCenter.x + sceneRadius,
                      sceneCenter.y + sceneRadius,
                      sceneCenter.z + sceneRadius
                    )
                  );
                  console.log("[Library] Got center/radius on attempt", checkAttempts);
                }
              } catch (e) {
                // Ignore
              }
            }

            if (treeBounds) {
              const center = new THREE.Vector3();
              const size = new THREE.Vector3();
              treeBounds.getCenter(center);
              treeBounds.getSize(size);
              const radius = Math.max(size.x, size.y, size.z) / 2;

              console.log("[Camera] TREE BOUNDS FOUND:");
              console.log("[Camera]   Center:", center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));
              console.log("[Camera]   Radius:", radius.toFixed(2));

              positionCameraToScene(center, radius);
              onLoadRef.current?.({ center: center.clone(), size: size.clone(), radius });
            } else if (checkAttempts >= maxAttempts) {
              console.error("[Tree Check] Timed out after", checkAttempts, "attempts");
              console.warn("[Camera] Using fallback - try WASD/arrows to navigate");
              onLoadRef.current?.();
            } else {
              setTimeout(waitForTreeAndPosition, 100);
            }
          };

          // Start checking for tree after a short delay
          setTimeout(waitForTreeAndPosition, 200);
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

      // Stop manual rendering
      viewerReadyRef.current = false;

      if (viewerRef.current) {
        try {
          // With selfDrivenMode=false, just dispose (no stop needed)
          viewerRef.current.dispose();
        } catch (e) {
          // Ignore errors during cleanup if context was lost
        }
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, gl, camera, fileSizeChecked, fileSizeOk, fileSizeMB, JSON.stringify(position), JSON.stringify(rotation), scale]);

  return null;
}

export default GaussianSplats;
