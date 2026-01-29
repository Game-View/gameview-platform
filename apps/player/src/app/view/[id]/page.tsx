"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Loader2, ExternalLink, Info, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// Dynamic import for GaussianSplats (no SSR)
const GaussianSplats = dynamic(
  () => import("@/components/viewer/GaussianSplats").then((mod) => mod.GaussianSplats),
  { ssr: false }
);

export default function ViewExperiencePage() {
  const params = useParams();
  const experienceId = params.id as string;

  const [splatLoading, setSplatLoading] = useState(true);
  const [splatProgress, setSplatProgress] = useState(0);
  const [splatError, setSplatError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

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
        gl={{ antialias: false, alpha: false }}
      >
        <color attach="background" args={["#111111"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Debug: small red sphere at origin to verify R3F is rendering */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="red" />
        </mesh>

        {/* Using mkkellogg library with dynamicScene to bypass tree issues */}
        <GaussianSplats
          url={experience.plyUrl}
          onLoad={() => {
            console.log("[ViewPage] GaussianSplats onLoad callback fired!");
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

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={100}
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
                <span className="text-gv-neutral-500">Pan:</span> Right Click + Drag
              </div>
              <div>
                <span className="text-gv-neutral-500">Reset:</span> Double Click
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
