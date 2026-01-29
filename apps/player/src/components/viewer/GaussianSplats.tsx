"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
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
    console.log("[PLY Parser] Fetching PLY to compute bounds...");

    // Fetch enough data to get header + sample vertices
    // PLY header is typically < 2KB, each vertex is ~60 bytes
    // Fetch 100KB to get header + ~1500 sample vertices
    const response = await fetch(url, {
      headers: { Range: "bytes=0-102400" }
    });

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

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
  const contextLostRef = useRef(false);
  const [fileSizeChecked, setFileSizeChecked] = useState(false);
  const [fileSizeOk, setFileSizeOk] = useState(false);
  const [fileSizeMB, setFileSizeMB] = useState<number | null>(null);
  const [plyBounds, setPlyBounds] = useState<SceneBounds | null>(null);

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
            setPlyBounds(bounds);
            console.log("[Player] PLY bounds computed successfully:", bounds);
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
      console.log("[Player] Testing: dynamicScene=true to bypass tree issues");

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
        // IMPORTANT: dynamicScene=true rebuilds tree each frame, may bypass tree issue
        dynamicScene: true,
        webXRMode: GaussianSplats3D.WebXRMode.None,
        renderMode: GaussianSplats3D.RenderMode.Always,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
        antialiased: false,
        focalAdjustment: 1.0,
        logLevel: GaussianSplats3D.LogLevel.Debug,
        sphericalHarmonicsDegree: 0,
        // Disable optimizations that might cause issues
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
            console.log("[Player] Loading progress:", Math.round(percent * 100) + "%");
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted || contextLostRef.current) return;

          console.log("[Player] Gaussian splats loaded successfully!");

          // Diagnostics: get scene info
          let splatCount = 0;
          try {
            splatCount = viewer.getSplatCount?.() ?? 0;
            console.log(`[Player] Splat count: ${splatCount}`);
          } catch (e) {
            console.log("[Player] Could not get splat count");
          }

          // ===== DEBUG: Explore viewer object to find splat positions =====
          console.log("[Debug] Viewer object keys:", Object.keys(viewer));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const viewerAny = viewer as any;

          // Log ALL properties to find where bounds are stored
          console.log("[Debug] Full viewer dump:");
          for (const key of Object.keys(viewerAny)) {
            const val = viewerAny[key];
            const valType = typeof val;
            if (valType === 'object' && val !== null) {
              console.log(`[Debug] viewer.${key}:`, val.constructor?.name || 'Object', Object.keys(val).slice(0, 10));
            } else {
              console.log(`[Debug] viewer.${key}:`, valType, val);
            }
          }

          // ===== Try multiple approaches to get bounding box =====
          let sceneBounds: SceneBounds | undefined;

          // Approach 0: Use PLY bounds computed earlier (MOST RELIABLE - same as desktop viewer)
          if (plyBounds) {
            console.log("[Camera] Using PLY-parsed bounds (computed before library load):");
            console.log("[Camera]   Center:", plyBounds.center);
            console.log("[Camera]   Radius:", plyBounds.radius);
            sceneBounds = plyBounds;
          }

          // Approach 1: Use library's getSceneCenter/getSceneRadius (fallback)
          if (!sceneBounds) {
            try {
              const sceneCenter = viewer.getSceneCenter?.();
              const sceneRadius = viewer.getSceneRadius?.();

              console.log("[Camera] Approach 1 - Library methods:");
              console.log("[Camera]   getSceneCenter():", sceneCenter);
              console.log("[Camera]   getSceneRadius():", sceneRadius);

              if (sceneCenter && sceneRadius && sceneRadius > 0) {
                console.log("[Camera] SUCCESS: Using library's scene center/radius");

                sceneBounds = {
                  center: sceneCenter.clone(),
                  size: new THREE.Vector3(sceneRadius * 2, sceneRadius * 2, sceneRadius * 2),
                  radius: sceneRadius
                };
              }
            } catch (e) {
              console.log("[Camera] Approach 1 failed:", e);
            }
          }

          // Approach 2: Try splatTree.root bounding box (spatial tree should have bounds)
          if (!sceneBounds && viewerAny.splatTree) {
            try {
              const tree = viewerAny.splatTree;
              console.log("[Camera] Approach 2 - SplatTree:");
              console.log("[Camera]   splatTree keys:", Object.keys(tree));

              // Check root node
              if (tree.root) {
                console.log("[Camera]   splatTree.root keys:", Object.keys(tree.root));
                const root = tree.root;

                // Try various property names for bounding box
                const boxProps = ['boundingBox', 'box', 'bounds', 'aabb', 'min', 'max'];
                for (const prop of boxProps) {
                  if (root[prop]) {
                    console.log(`[Camera]   splatTree.root.${prop}:`, root[prop]);
                  }
                }

                if (root.boundingBox) {
                  const box = root.boundingBox;
                  const center = new THREE.Vector3();
                  const size = new THREE.Vector3();
                  box.getCenter(center);
                  box.getSize(size);
                  const radius = Math.max(size.x, size.y, size.z) / 2;

                  console.log("[Camera] SUCCESS: Using splatTree.root.boundingBox");
                  console.log("[Camera]   Box:", box.min, box.max);
                  console.log("[Camera]   Center:", center);
                  console.log("[Camera]   Radius:", radius);

                  sceneBounds = { center, size, radius };
                }
              }

              // Also check tree-level bounds
              if (!sceneBounds && (tree.boundingBox || tree.sceneBoundingBox)) {
                const box = tree.boundingBox || tree.sceneBoundingBox;
                const center = new THREE.Vector3();
                const size = new THREE.Vector3();
                box.getCenter(center);
                box.getSize(size);
                const radius = Math.max(size.x, size.y, size.z) / 2;

                console.log("[Camera] SUCCESS: Using splatTree.boundingBox");
                sceneBounds = { center, size, radius };
              }
            } catch (e) {
              console.log("[Camera] Approach 2 failed:", e);
            }
          }

          // Approach 3: Check for splatBuffer/splatDataTextures which contain position data
          if (!sceneBounds) {
            try {
              console.log("[Camera] Approach 3 - Looking for splat data buffers:");

              // Check various potential locations for splat data
              const dataLocations = [
                'splatBuffer', 'splatDataTextures', 'centersTexture',
                'splatMesh.material.uniforms', 'scenes', 'sceneInfo'
              ];

              for (const loc of dataLocations) {
                const parts = loc.split('.');
                let obj = viewerAny;
                for (const part of parts) {
                  obj = obj?.[part];
                }
                if (obj) {
                  console.log(`[Camera]   ${loc}:`, obj.constructor?.name || typeof obj,
                    typeof obj === 'object' ? Object.keys(obj).slice(0, 10) : obj);
                }
              }

              // Check scenes array for bounds
              if (viewerAny.scenes && Array.isArray(viewerAny.scenes) && viewerAny.scenes.length > 0) {
                const scene = viewerAny.scenes[0];
                console.log("[Camera]   scenes[0] keys:", Object.keys(scene));

                if (scene.splatBuffer) {
                  console.log("[Camera]   scenes[0].splatBuffer keys:", Object.keys(scene.splatBuffer));

                  // SplatBuffer might have getBoundingBox or similar
                  if (scene.splatBuffer.getBoundingBox) {
                    const box = scene.splatBuffer.getBoundingBox();
                    const center = new THREE.Vector3();
                    const size = new THREE.Vector3();
                    box.getCenter(center);
                    box.getSize(size);
                    const radius = Math.max(size.x, size.y, size.z) / 2;

                    console.log("[Camera] SUCCESS: Using splatBuffer.getBoundingBox()");
                    sceneBounds = { center, size, radius };
                  }
                }
              }
            } catch (e) {
              console.log("[Camera] Approach 3 failed:", e);
            }
          }

          // Approach 4: Last resort - try scene bounding box (may not work for GPU data)
          if (!sceneBounds && viewerAny.scene) {
            try {
              console.log("[Camera] Approach 4 - Scene bounding box (may not work for GPU textures):");
              const box = new THREE.Box3().setFromObject(viewerAny.scene);
              console.log("[Camera]   Box:", box.min, box.max);
              console.log("[Camera]   isEmpty:", box.isEmpty());

              if (!box.isEmpty()) {
                const center = new THREE.Vector3();
                const size = new THREE.Vector3();
                box.getCenter(center);
                box.getSize(size);
                const radius = Math.max(size.x, size.y, size.z) / 2;

                // Only use if radius is reasonable (not from debug geometry)
                if (radius > 1) {
                  console.log("[Camera] Using viewer.scene bounding box (radius:", radius, ")");
                  sceneBounds = { center, size, radius };
                } else {
                  console.log("[Camera] Scene box too small, likely not real splat bounds");
                }
              }
            } catch (e) {
              console.log("[Camera] Approach 4 failed:", e);
            }
          }

          // If still no bounds, log failure clearly
          if (!sceneBounds) {
            console.error("[Camera] FAILED: Could not detect scene bounds from any source!");
            console.error("[Camera] The splats may be stored purely in GPU textures.");
            console.error("[Camera] Try pressing arrow keys to navigate, or check console for position hints.");
          }

          // ===== Position camera based on bounds =====
          if (sceneBounds) {
            const { center, radius } = sceneBounds;
            const perspCamera = camera as THREE.PerspectiveCamera;

            // Calculate distance to fit scene in view
            const fov = perspCamera.fov * (Math.PI / 180);
            const distance = (radius / Math.tan(fov / 2)) * 1.5;

            // Position camera to look at center from a good angle
            perspCamera.position.set(
              center.x,
              center.y + radius * 0.5, // Slightly above
              center.z + distance
            );
            perspCamera.lookAt(center.x, center.y, center.z);
            perspCamera.updateProjectionMatrix();

            // Update near/far planes based on scene size
            perspCamera.near = Math.max(0.01, radius * 0.001);
            perspCamera.far = Math.max(10000, radius * 100);
            perspCamera.updateProjectionMatrix();

            console.log("[Camera] Auto-positioned camera:");
            console.log("[Camera]   Position:", perspCamera.position);
            console.log("[Camera]   Looking at:", center);
            console.log("[Camera]   Distance:", distance);
            console.log("[Camera]   Near/Far:", perspCamera.near, perspCamera.far);
          } else {
            console.warn("[Camera] Could not determine scene bounds - camera may be in wrong position");
            console.warn("[Camera] Try pressing 'F' to manually fit camera if scene is not visible");
          }

          console.log("[Player] Starting viewer...");
          viewer.start();
          console.log("[Player] Viewer started");

          // Log final camera state
          console.log("[Player] Final camera position:", camera.position);
          console.log("[Player] Camera near/far:", (camera as THREE.PerspectiveCamera).near, (camera as THREE.PerspectiveCamera).far);

          onLoadRef.current?.(sceneBounds);
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
  }, [url, gl, camera, fileSizeChecked, fileSizeOk, fileSizeMB, JSON.stringify(position), JSON.stringify(rotation), scale]);

  return null;
}

export default GaussianSplats;
