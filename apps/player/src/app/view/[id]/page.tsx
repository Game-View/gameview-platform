"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Loader2, ExternalLink, Info, X } from "lucide-react";
import * as THREE from "three";
import { trpc } from "@/lib/trpc/client";
import type { SceneBounds } from "@/components/viewer/GaussianSplats";

// Dynamic import for GaussianSplats (no SSR)
const GaussianSplats = dynamic(
  () => import("@/components/viewer/GaussianSplats").then((mod) => mod.GaussianSplats),
  { ssr: false }
);

// Component to handle camera positioning and keyboard controls
function CameraController({
  sceneBounds,
  controlsRef,
}: {
  sceneBounds: SceneBounds | null;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  // Fit camera to scene bounds
  const fitCameraToScene = useCallback(() => {
    if (!controlsRef.current) return;

    if (sceneBounds) {
      const { center, radius } = sceneBounds;
      const perspCamera = camera as THREE.PerspectiveCamera;

      const fov = perspCamera.fov * (Math.PI / 180);
      const distance = (radius / Math.tan(fov / 2)) * 1.5;

      perspCamera.position.set(
        center.x,
        center.y + radius * 0.5,
        center.z + distance
      );
      perspCamera.lookAt(center.x, center.y, center.z);
      perspCamera.updateProjectionMatrix();

      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      console.log("[CameraController] Fit camera to scene:", {
        position: perspCamera.position.clone(),
        target: center.clone(),
        distance,
      });
    } else {
      // No bounds - try moving camera to different positions to find splats
      console.log("[CameraController] No bounds - cycling through search positions");
    }
  }, [camera, sceneBounds, controlsRef]);

  // Update controls target when bounds change
  useEffect(() => {
    if (sceneBounds && controlsRef.current) {
      controlsRef.current.target.copy(sceneBounds.center);
      controlsRef.current.maxDistance = sceneBounds.radius * 10;
      controlsRef.current.minDistance = sceneBounds.radius * 0.1;
      controlsRef.current.update();
      console.log("[CameraController] Updated controls target to:", sceneBounds.center);
    }
  }, [sceneBounds, controlsRef]);

  // Keyboard navigation - works even without bounds!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const perspCamera = camera as THREE.PerspectiveCamera;
      const moveSpeed = 5; // Units to move per keypress
      const rotateSpeed = 0.1;

      // Get camera direction vectors
      const forward = new THREE.Vector3();
      perspCamera.getWorldDirection(forward);
      const right = new THREE.Vector3();
      right.crossVectors(forward, perspCamera.up).normalize();
      const up = perspCamera.up.clone();

      switch (e.key.toLowerCase()) {
        // WASD for movement
        case "w":
          perspCamera.position.addScaledVector(forward, moveSpeed);
          if (controlsRef.current) {
            controlsRef.current.target.addScaledVector(forward, moveSpeed);
          }
          break;
        case "s":
          perspCamera.position.addScaledVector(forward, -moveSpeed);
          if (controlsRef.current) {
            controlsRef.current.target.addScaledVector(forward, -moveSpeed);
          }
          break;
        case "a":
          perspCamera.position.addScaledVector(right, -moveSpeed);
          if (controlsRef.current) {
            controlsRef.current.target.addScaledVector(right, -moveSpeed);
          }
          break;
        case "d":
          perspCamera.position.addScaledVector(right, moveSpeed);
          if (controlsRef.current) {
            controlsRef.current.target.addScaledVector(right, moveSpeed);
          }
          break;
        case "q":
          perspCamera.position.addScaledVector(up, moveSpeed);
          if (controlsRef.current) {
            controlsRef.current.target.addScaledVector(up, moveSpeed);
          }
          break;
        case "e":
          perspCamera.position.addScaledVector(up, -moveSpeed);
          if (controlsRef.current) {
            controlsRef.current.target.addScaledVector(up, -moveSpeed);
          }
          break;

        // Arrow keys for rotation (via OrbitControls)
        case "arrowleft":
          if (controlsRef.current) {
            const angle = rotateSpeed;
            const target = controlsRef.current.target;
            const offset = perspCamera.position.clone().sub(target);
            offset.applyAxisAngle(up, angle);
            perspCamera.position.copy(target).add(offset);
            perspCamera.lookAt(target);
          }
          break;
        case "arrowright":
          if (controlsRef.current) {
            const angle = -rotateSpeed;
            const target = controlsRef.current.target;
            const offset = perspCamera.position.clone().sub(target);
            offset.applyAxisAngle(up, angle);
            perspCamera.position.copy(target).add(offset);
            perspCamera.lookAt(target);
          }
          break;
        case "arrowup":
          if (controlsRef.current) {
            const target = controlsRef.current.target;
            const offset = perspCamera.position.clone().sub(target);
            offset.applyAxisAngle(right, rotateSpeed);
            perspCamera.position.copy(target).add(offset);
            perspCamera.lookAt(target);
          }
          break;
        case "arrowdown":
          if (controlsRef.current) {
            const target = controlsRef.current.target;
            const offset = perspCamera.position.clone().sub(target);
            offset.applyAxisAngle(right, -rotateSpeed);
            perspCamera.position.copy(target).add(offset);
            perspCamera.lookAt(target);
          }
          break;

        case "f":
          fitCameraToScene();
          break;
        case "r":
          // Reset camera to origin
          perspCamera.position.set(0, 2, 10);
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
          }
          perspCamera.lookAt(0, 0, 0);
          console.log("[CameraController] Reset to origin");
          break;

        // Number keys for quick jumps to search for scene
        case "1":
          perspCamera.position.set(0, 0, 50);
          if (controlsRef.current) controlsRef.current.target.set(0, 0, 0);
          perspCamera.lookAt(0, 0, 0);
          console.log("[CameraController] Jump: +Z far");
          break;
        case "2":
          perspCamera.position.set(0, 0, -50);
          if (controlsRef.current) controlsRef.current.target.set(0, 0, 0);
          perspCamera.lookAt(0, 0, 0);
          console.log("[CameraController] Jump: -Z far");
          break;
        case "3":
          perspCamera.position.set(50, 0, 0);
          if (controlsRef.current) controlsRef.current.target.set(0, 0, 0);
          perspCamera.lookAt(0, 0, 0);
          console.log("[CameraController] Jump: +X far");
          break;
        case "4":
          perspCamera.position.set(-50, 0, 0);
          if (controlsRef.current) controlsRef.current.target.set(0, 0, 0);
          perspCamera.lookAt(0, 0, 0);
          console.log("[CameraController] Jump: -X far");
          break;
        case "5":
          perspCamera.position.set(0, 50, 0);
          if (controlsRef.current) controlsRef.current.target.set(0, 0, 0);
          perspCamera.lookAt(0, 0, 0);
          console.log("[CameraController] Jump: +Y (above)");
          break;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Log current position for debugging
      console.log("[Camera] Position:", perspCamera.position.clone());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [camera, controlsRef, fitCameraToScene]);

  return null;
}

export default function ViewExperiencePage() {
  const params = useParams();
  const experienceId = params.id as string;

  const [splatLoading, setSplatLoading] = useState(true);
  const [splatProgress, setSplatProgress] = useState(0);
  const [splatError, setSplatError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [sceneBounds, setSceneBounds] = useState<SceneBounds | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // Fetch experience data (using getForViewer for public access without auth)
  const { data: experience, isLoading, error } = trpc.experience.getForViewer.useQuery(
    { id: experienceId },
    { enabled: !!experienceId }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-gv-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading experience...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !experience) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-white mb-2">Experience Not Found</h1>
          <p className="text-gv-neutral-400 mb-6">
            The experience you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
          >
            Go to Game View
          </Link>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log("[ViewPage] Experience data:", experience);
  console.log("[ViewPage] PLY URL:", experience.plyUrl);

  // No PLY file
  if (!experience.plyUrl) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-white mb-2">Scene Not Ready</h1>
          <p className="text-gv-neutral-400 mb-6">
            This experience doesn&apos;t have a 3D scene available yet.
          </p>
          <Link
            href={`/experience/${experienceId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
          >
            View Experience Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* 3D Viewer */}
      <Canvas
        camera={{ fov: 75, near: 0.01, far: 10000, position: [0, 2, 10] }}
        style={{ position: "absolute", inset: 0 }}
        gl={{
          antialias: false,
          alpha: false,
          // CRITICAL: Let the Gaussian splats library control clearing
          // Without this, R3F will clear the canvas after library renders
          autoClear: false,
          autoClearColor: false,
          autoClearDepth: false,
          autoClearStencil: false,
        }}
        // Don't render R3F scene automatically - let splat library control
        frameloop="always"
      >
        {/* No background color - splat library will handle this */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* GaussianSplats handles its own rendering - no debug geometry needed */}

        {/* Using mkkellogg library with dynamicScene to bypass tree issues */}
        <GaussianSplats
          url={experience.plyUrl}
          onLoad={(bounds) => {
            console.log("[ViewPage] GaussianSplats onLoad callback fired!");
            console.log("[ViewPage] Scene bounds:", bounds);
            if (bounds) {
              setSceneBounds(bounds);
            }
            setSplatLoading(false);
          }}
          onError={(err) => {
            console.error("[ViewPage] GaussianSplats onError callback:", err);
            setSplatLoading(false);
            setSplatError(err.message);
          }}
          onProgress={(progress) => {
            console.log("[ViewPage] GaussianSplats progress:", progress);
            setSplatProgress(Math.round(progress * 100));
          }}
        />

        {/* Camera controller for auto-positioning and keyboard nav */}
        <CameraController sceneBounds={sceneBounds} controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={1000}
        />
      </Canvas>

      {/* Loading Overlay */}
      {splatLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-gv-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Loading 3D Scene</p>
            <p className="text-gv-neutral-400">{splatProgress}%</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {splatError && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center max-w-md px-4">
            <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Scene</h2>
            <p className="text-gv-neutral-400 mb-4">{splatError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Title Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-white font-bold text-lg">{experience.title}</h1>
            {experience.creator && (
              <p className="text-gv-neutral-400 text-sm">
                by {experience.creator.displayName}
              </p>
            )}
          </div>
          <Link
            href={`/experience/${experienceId}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-gv-primary-500 hover:bg-gv-primary-600 text-white text-sm rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View on Game View
          </Link>
        </div>
      </div>

      {/* Controls Hint */}
      {showControls && !splatLoading && !splatError && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="max-w-md mx-auto bg-black/80 backdrop-blur rounded-lg p-4 border border-gv-neutral-700">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <Info className="h-4 w-4" />
                Controls
              </div>
              <button
                onClick={() => setShowControls(false)}
                className="text-gv-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gv-neutral-300">
              <div>
                <span className="text-gv-neutral-500">Rotate:</span> Click + Drag
              </div>
              <div>
                <span className="text-gv-neutral-500">Zoom:</span> Scroll
              </div>
              <div>
                <span className="text-gv-neutral-500">WASD:</span> Move camera
              </div>
              <div>
                <span className="text-gv-neutral-500">Q/E:</span> Up/Down
              </div>
              <div>
                <span className="text-gv-neutral-500">Arrows:</span> Look around
              </div>
              <div>
                <span className="text-gv-neutral-500">1-5:</span> Jump to position
              </div>
              <div>
                <span className="text-gv-neutral-500">R key:</span> Reset to origin
              </div>
              <div>
                <span className="text-gv-neutral-500">F key:</span> Fit to scene
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Controls Button (when hidden) */}
      {!showControls && !splatLoading && !splatError && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute bottom-4 left-4 z-20 p-2 bg-black/80 backdrop-blur rounded-lg border border-gv-neutral-700 text-gv-neutral-400 hover:text-white transition-colors"
        >
          <Info className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
