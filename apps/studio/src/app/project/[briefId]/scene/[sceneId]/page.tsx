"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { ViewerControls } from "@/components/viewer/ViewerControls";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import type { StoredScene } from "@/lib/scenes";

// Dynamic import to avoid SSR issues with Three.js
const SceneViewer = dynamic(
  () => import("@/components/viewer/SceneViewer").then((mod) => mod.SceneViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gv-neutral-900">
        <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin" />
      </div>
    ),
  }
);

export default function SceneViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded } = useUser();

  const briefId = params.briefId as string;
  const sceneId = params.sceneId as string;

  const [scene, setScene] = useState<StoredScene | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch scene data
  useEffect(() => {
    async function fetchScene() {
      if (!isLoaded) return;

      try {
        const res = await fetch(`/api/scenes/${sceneId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Scene not found");
          } else {
            setError("Failed to load scene");
          }
          return;
        }

        const data = await res.json();
        setScene(data);

        // Check if scene is ready
        if (data.processingStatus !== "completed") {
          setError("Scene is still processing. Please wait for processing to complete.");
        } else if (!data.splatUrl) {
          setError("Scene has no 3D data. Please process the scene first.");
        }
      } catch (err) {
        console.error("Failed to fetch scene:", err);
        setError("Failed to load scene data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchScene();
  }, [sceneId, isLoaded]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    router.push(`/project/${briefId}`);
  }, [router, briefId]);

  const handleReset = useCallback(() => {
    // Reset camera position - would need to expose this from SceneViewer
    // For now, reload the page
    window.location.reload();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcut({
    key: "Escape",
    callback: handleBack,
  });

  useKeyboardShortcut({
    key: "f",
    callback: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },
  });

  useKeyboardShortcut({
    key: "r",
    callback: handleReset,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gv-neutral-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gv-neutral-400">Loading scene...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !scene) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gv-neutral-900">
        <div className="text-center max-w-md px-4">
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
          <h1 className="text-xl font-bold text-white mb-2">Cannot Load Scene</h1>
          <p className="text-gv-neutral-400 mb-6">{error || "Scene not found"}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv transition-colors"
          >
            Go Back to Project
          </button>
        </div>
      </div>
    );
  }

  // Use placeholder for demo if no real splat URL
  const splatUrl = scene.splatUrl || "/demo/splat.ply";
  const thumbnailUrl = scene.thumbnailUrl || undefined;

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {/* Viewer Controls Overlay */}
      <ViewerControls
        sceneName={scene.name}
        onBack={handleBack}
        onReset={handleReset}
        isLoading={viewerLoading}
      />

      {/* 3D Scene Viewer */}
      <SceneViewer
        splatUrl={splatUrl}
        thumbnailUrl={thumbnailUrl}
        initialPosition={scene.cameraPosition || { x: 0, y: 2, z: 5 }}
        initialTarget={scene.cameraTarget || { x: 0, y: 0, z: 0 }}
        onLoad={() => setViewerLoading(false)}
        onError={(err) => {
          console.error("Viewer error:", err);
          setViewerLoading(false);
        }}
        onProgress={(progress) => {
          // Could show progress in UI if needed
          console.log("Loading progress:", progress);
        }}
      />
    </div>
  );
}
