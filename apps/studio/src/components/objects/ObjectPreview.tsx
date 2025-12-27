"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Environment, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, AlertCircle, RotateCcw, ZoomIn } from "lucide-react";
import type { StoredObject } from "@/lib/objects";

interface ObjectPreviewProps {
  object: StoredObject | null;
  onClose?: () => void;
  className?: string;
}

export function ObjectPreview({ object, onClose, className = "" }: ObjectPreviewProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  if (!object) {
    return (
      <div className={`flex items-center justify-center bg-gv-neutral-900 text-gv-neutral-500 ${className}`}>
        <p className="text-sm">Select an object to preview</p>
      </div>
    );
  }

  const handleReset = () => {
    if (controlsRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (controlsRef.current as any).reset?.();
    }
  };

  return (
    <div className={`relative bg-gv-neutral-900 ${className}`}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [2, 1.5, 2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ModelViewer
            url={object.modelUrl}
            autoRotate={autoRotate}
            controlsRef={controlsRef}
          />
        </Suspense>
      </Canvas>

      {/* Object info overlay */}
      <div className="absolute top-3 left-3 right-3">
        <div className="bg-black/60 backdrop-blur-sm rounded-gv px-3 py-2">
          <h3 className="text-white font-medium text-sm">{object.name}</h3>
          {object.description && (
            <p className="text-gv-neutral-400 text-xs mt-0.5 line-clamp-2">{object.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-gv-neutral-500">
            <span className="px-1.5 py-0.5 bg-gv-neutral-700 rounded capitalize">{object.category}</span>
            {object.interactionType && (
              <span className="px-1.5 py-0.5 bg-gv-primary-500/20 text-gv-primary-400 rounded capitalize">
                {object.interactionType}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-gv transition-colors ${
              autoRotate ? "bg-gv-primary-500 text-white" : "bg-black/60 text-gv-neutral-300 hover:bg-black/80"
            }`}
            title={autoRotate ? "Stop rotation" : "Auto rotate"}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-black/60 hover:bg-black/80 text-gv-neutral-300 rounded-gv transition-colors"
            title="Reset view"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-black/60 backdrop-blur-sm rounded-gv px-3 py-1.5 text-xs text-gv-neutral-400">
          Drag to rotate • Scroll to zoom
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white text-sm rounded-gv transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-gv-primary-500 mb-2" />
        <p className="text-sm text-gv-neutral-400">{Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

// Model viewer component
interface ModelViewerProps {
  url: string;
  autoRotate?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef?: React.RefObject<any>;
}

function ModelViewer({ url, autoRotate = true, controlsRef }: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [error, setError] = useState<string | null>(null);

  // Rotate the model
  useFrame(() => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  // Handle different model formats
  const isGLTF = url.endsWith(".gltf") || url.endsWith(".glb");
  const isOBJ = url.endsWith(".obj");
  const isPLY = url.endsWith(".ply");

  if (!isGLTF && !isOBJ && !isPLY) {
    // For placeholder/demo URLs, show a placeholder geometry
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={0.5}
          maxDistance={10}
        />
        <Center>
          <group ref={groupRef}>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#4f46e5" metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        </Center>
        <Environment preset="studio" />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={10}
      />
      {isGLTF && (
        <Center>
          <group ref={groupRef}>
            <GLTFModel url={url} onError={setError} />
          </group>
        </Center>
      )}
      {error && (
        <Html center>
          <div className="flex flex-col items-center text-center p-4">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-white">Failed to load model</p>
            <p className="text-xs text-gv-neutral-400 mt-1">{error}</p>
          </div>
        </Html>
      )}
      <Environment preset="studio" />
    </>
  );
}

// GLTF Model loader - must always call hook unconditionally
interface GLTFModelProps {
  url: string;
  onError?: (error: string) => void;
}

function GLTFModel({ url, onError }: GLTFModelProps) {
  // Always call the hook unconditionally
  const gltf = useGLTF(url, true, true, (error) => {
    onError?.(error instanceof Error ? error.message : "Failed to load model");
  });

  if (!gltf?.scene) {
    return null;
  }

  return <primitive object={gltf.scene} />;
}
