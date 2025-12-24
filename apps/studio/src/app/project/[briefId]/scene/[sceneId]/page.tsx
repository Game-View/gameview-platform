"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Loader2, PanelLeftClose, PanelLeft, Box } from "lucide-react";
import { ViewerControls } from "@/components/viewer/ViewerControls";
import { ObjectLibrary } from "@/components/objects/ObjectLibrary";
import { ObjectUploadModal } from "@/components/objects/ObjectUploadModal";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { toast } from "@/stores/toast-store";
import type { StoredScene } from "@/lib/scenes";
import type { StoredObject, PlacedObject } from "@/lib/objects";

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

// Dynamic import for ObjectPreview (uses Three.js)
const ObjectPreview = dynamic(
  () => import("@/components/objects/ObjectPreview").then((mod) => mod.ObjectPreview),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gv-neutral-900">
        <Loader2 className="h-6 w-6 text-gv-primary-500 animate-spin" />
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

  // Object library state
  const [showLibrary, setShowLibrary] = useState(true);
  const [selectedObject, setSelectedObject] = useState<StoredObject | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);

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

        // Load placed objects from scene data
        if (data.placedObjects) {
          setPlacedObjects(data.placedObjects);
        }

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

  // Object library handlers
  const handleSelectObject = useCallback((object: StoredObject) => {
    setSelectedObject(object);
  }, []);

  const handlePlaceObject = useCallback(
    async (object: StoredObject) => {
      if (!scene) return;

      // Create placed object instance
      const instanceId = crypto.randomUUID();
      const placedObject: PlacedObject = {
        instanceId,
        objectId: object.id,
        name: object.name,
        modelUrl: object.modelUrl,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        interactionType: object.interactionType,
        metadata: { ...object.metadata },
      };

      const newPlacedObjects = [...placedObjects, placedObject];
      setPlacedObjects(newPlacedObjects);

      // Save to database
      try {
        await fetch(`/api/scenes/${sceneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placedObjects: newPlacedObjects }),
        });

        // Increment usage count
        await fetch(`/api/objects/${object.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "increment_usage" }),
        });

        toast.success("Object placed", `${object.name} added to scene`);
      } catch (err) {
        console.error("Failed to save placed object:", err);
        toast.error("Error", "Failed to save object placement");
      }
    },
    [scene, sceneId, placedObjects]
  );

  const handleUploadSuccess = useCallback(() => {
    setShowUploadModal(false);
    toast.success("Upload complete", "Your object is now available in the library");
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

  useKeyboardShortcut({
    key: "o",
    callback: () => setShowLibrary((prev) => !prev),
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
    <div className="h-screen w-screen overflow-hidden bg-black flex">
      {/* Object Library Sidebar */}
      <aside
        className={`flex-shrink-0 transition-all duration-300 ${
          showLibrary ? "w-80" : "w-0"
        } overflow-hidden`}
      >
        <div className="h-full w-80 flex flex-col border-r border-gv-neutral-800">
          {/* Library Panel */}
          <div className="flex-1 overflow-hidden">
            <ObjectLibrary
              onSelectObject={handleSelectObject}
              onUploadClick={() => setShowUploadModal(true)}
              selectedObjectId={selectedObject?.id}
            />
          </div>

          {/* Object Preview */}
          {selectedObject && (
            <div className="h-64 border-t border-gv-neutral-700">
              <ObjectPreview
                object={selectedObject}
                className="h-full"
              />
              {/* Place button */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-center z-10">
                <button
                  onClick={() => handlePlaceObject(selectedObject)}
                  className="px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white text-sm font-medium rounded-gv transition-colors shadow-lg"
                >
                  Place in Scene
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Viewer Area */}
      <main className="flex-1 relative">
        {/* Toggle Library Button */}
        <button
          onClick={() => setShowLibrary((prev) => !prev)}
          className="absolute top-4 left-4 z-30 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-gv text-white transition-colors"
          title={showLibrary ? "Hide library (O)" : "Show library (O)"}
        >
          {showLibrary ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </button>

        {/* Placed Objects Count */}
        {placedObjects.length > 0 && (
          <div className="absolute top-4 left-16 z-30 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-gv flex items-center gap-2">
            <Box className="h-4 w-4 text-gv-primary-400" />
            <span className="text-white text-sm">
              {placedObjects.length} object{placedObjects.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

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
      </main>

      {/* Upload Modal */}
      <ObjectUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
