"use client";

import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Dynamic import to avoid SSR issues
let SplatMesh: any = null;

export interface SparkSplatsProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

/**
 * SparkSplats component - uses @sparkjsdev/spark for 3DGS rendering
 *
 * Spark supports: .PLY, .SPZ, .SPLAT, .KSPLAT, .SOG formats
 * This is an alternative to the mkkellogg library which has SplatTree issues
 */
export function SparkSplats({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onLoad,
  onError,
  onProgress,
}: SparkSplatsProps) {
  const { scene, camera } = useThree();
  const splatMeshRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Store callbacks in refs to avoid re-running useEffect
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onLoad, onError, onProgress]);

  // Dynamically import Spark (to avoid SSR issues)
  useEffect(() => {
    let isMounted = true;

    async function loadSpark() {
      if (SplatMesh) return; // Already loaded

      try {
        console.log("[SparkSplats] Loading Spark library...");
        const sparkModule = await import("@sparkjsdev/spark");
        SplatMesh = sparkModule.SplatMesh;
        console.log("[SparkSplats] Spark library loaded successfully");

        if (isMounted) {
          // Trigger re-render to create the splat mesh
          setIsLoaded(prev => !prev);
        }
      } catch (err) {
        console.error("[SparkSplats] Failed to load Spark library:", err);
        if (isMounted) {
          const error = new Error(`Failed to load Spark library: ${err}`);
          setLoadError(error);
          onErrorRef.current?.(error);
        }
      }
    }

    loadSpark();

    return () => {
      isMounted = false;
    };
  }, []);

  // Create and manage the splat mesh
  useEffect(() => {
    if (!SplatMesh || !url) return;

    let isMounted = true;
    let splatMesh: any = null;

    async function createSplatMesh() {
      try {
        console.log("[SparkSplats] Creating SplatMesh for URL:", url);

        // Create the splat mesh with the URL
        splatMesh = new SplatMesh({
          url: url,
          // Progress callback if supported
          onProgress: (progress: number) => {
            if (!isMounted) return;
            console.log("[SparkSplats] Loading progress:", Math.round(progress * 100) + "%");
            onProgressRef.current?.(progress);
          },
        });

        // Wait for the mesh to load
        // SplatMesh loads asynchronously when added to scene
        if (splatMesh.load) {
          await splatMesh.load();
        }

        if (!isMounted) {
          splatMesh.dispose?.();
          return;
        }

        // Set position, rotation, and scale
        splatMesh.position.set(position[0], position[1], position[2]);
        splatMesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        splatMesh.scale.set(scale, scale, scale);

        // Add to scene
        scene.add(splatMesh);
        splatMeshRef.current = splatMesh;

        console.log("[SparkSplats] SplatMesh added to scene");
        console.log("[SparkSplats] Position:", splatMesh.position);
        console.log("[SparkSplats] Rotation:", splatMesh.rotation);
        console.log("[SparkSplats] Scale:", splatMesh.scale);

        setIsLoaded(true);
        onLoadRef.current?.();
      } catch (err) {
        console.error("[SparkSplats] Failed to create SplatMesh:", err);
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setLoadError(error);
          onErrorRef.current?.(error);
        }
      }
    }

    createSplatMesh();

    return () => {
      isMounted = false;
      if (splatMesh) {
        scene.remove(splatMesh);
        splatMesh.dispose?.();
        splatMeshRef.current = null;
      }
    };
  }, [url, scene, position[0], position[1], position[2], rotation[0], rotation[1], rotation[2], scale]);

  // Update position/rotation/scale if they change
  useEffect(() => {
    if (splatMeshRef.current) {
      splatMeshRef.current.position.set(position[0], position[1], position[2]);
      splatMeshRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
      splatMeshRef.current.scale.set(scale, scale, scale);
    }
  }, [position, rotation, scale]);

  // Update the splat mesh each frame (required for proper rendering)
  useFrame(() => {
    if (splatMeshRef.current && splatMeshRef.current.update) {
      splatMeshRef.current.update(camera);
    }
  });

  return null;
}

export default SparkSplats;
