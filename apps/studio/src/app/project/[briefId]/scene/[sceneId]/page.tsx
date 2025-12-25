"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Loader2, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Box, Volume2, X } from "lucide-react";
import { ViewerControls } from "@/components/viewer/ViewerControls";
import { ObjectLibrary } from "@/components/objects/ObjectLibrary";
import { SceneAudioPanel, defaultSceneAudioConfig } from "@/components/audio";
import type { SceneAudioConfig } from "@/lib/audio";
import { ObjectUploadModal } from "@/components/objects/ObjectUploadModal";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { useEditorKeyboard } from "@/components/editor/useEditorKeyboard";
import { useEditorStore } from "@/stores/editor-store";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { toast } from "@/stores/toast-store";
import type { StoredScene } from "@/lib/scenes";
import type { StoredObject, PlacedObject } from "@/lib/objects";

// Dynamic import for SceneEditor (uses Three.js)
const SceneEditor = dynamic(
  () => import("@/components/editor/SceneEditor").then((mod) => mod.SceneEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gv-neutral-900">
        <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin" />
      </div>
    ),
  }
);

export default function SceneEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded } = useUser();

  const briefId = params.briefId as string;
  const sceneId = params.sceneId as string;

  const [scene, setScene] = useState<StoredScene | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showLibrary, setShowLibrary] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [selectedLibraryObject, setSelectedLibraryObject] = useState<StoredObject | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [audioConfig, setAudioConfig] = useState<SceneAudioConfig>(defaultSceneAudioConfig);

  // Editor store
  const {
    placedObjects,
    isDirty,
    lastSavedAt,
    setPlacedObjects,
    addObject,
    markClean,
  } = useEditorStore();

  // Enable editor keyboard shortcuts
  useEditorKeyboard();

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

        // Load placed objects into editor store
        if (data.placedObjects && Array.isArray(data.placedObjects)) {
          setPlacedObjects(data.placedObjects);
        }

        // Load audio config
        if (data.audioConfig) {
          setAudioConfig(data.audioConfig);
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
  }, [sceneId, isLoaded, setPlacedObjects]);

  // Save placed objects
  const saveObjects = useCallback(async () => {
    if (!scene) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/scenes/${sceneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placedObjects }),
      });

      if (!res.ok) throw new Error("Failed to save");

      markClean();
      toast.success("Saved", "Changes saved successfully");
    } catch (err) {
      console.error("Failed to save:", err);
      toast.error("Error", "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [scene, sceneId, placedObjects, markClean]);

  // Auto-save when dirty (debounced)
  useEffect(() => {
    if (!isDirty || !scene) return;

    const timeout = setTimeout(() => {
      saveObjects();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isDirty, scene, saveObjects]);

  // Save audio config
  const saveAudioConfig = useCallback(async (config: SceneAudioConfig) => {
    if (!scene) return;

    try {
      const res = await fetch(`/api/scenes/${sceneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioConfig: config }),
      });

      if (!res.ok) throw new Error("Failed to save audio");

      setAudioConfig(config);
      toast.success("Saved", "Audio settings saved");
    } catch (err) {
      console.error("Failed to save audio config:", err);
      toast.error("Error", "Failed to save audio settings");
    }
  }, [scene, sceneId]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (isDirty) {
      if (confirm("You have unsaved changes. Save before leaving?")) {
        saveObjects().then(() => router.push(`/project/${briefId}`));
        return;
      }
    }
    router.push(`/project/${briefId}`);
  }, [router, briefId, isDirty, saveObjects]);

  // Handle placing object from library
  const handlePlaceObject = useCallback(
    (object: StoredObject) => {
      const placedObject: PlacedObject = {
        instanceId: crypto.randomUUID(),
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

      addObject(placedObject);

      // Increment usage count
      fetch(`/api/objects/${object.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "increment_usage" }),
      }).catch(console.error);

      toast.success("Object placed", `${object.name} added to scene`);
    },
    [addObject]
  );

  // Keyboard shortcuts
  useKeyboardShortcut({
    key: "o",
    callback: () => setShowLibrary((prev) => !prev),
  });

  useKeyboardShortcut({
    key: "p",
    callback: () => setShowProperties((prev) => !prev),
  });

  useKeyboardShortcut({
    key: "s",
    ctrl: true,
    callback: (e) => {
      e.preventDefault();
      saveObjects();
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gv-neutral-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gv-neutral-400">Loading scene editor...</p>
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
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-black flex">
      {/* Object Library Sidebar */}
      <aside
        className={`flex-shrink-0 transition-all duration-300 ${
          showLibrary ? "w-80" : "w-0"
        } overflow-hidden`}
      >
        <div className="h-full w-80 flex flex-col border-r border-gv-neutral-800">
          <ObjectLibrary
            onSelectObject={setSelectedLibraryObject}
            onUploadClick={() => setShowUploadModal(true)}
            selectedObjectId={selectedLibraryObject?.id}
          />

          {/* Place button when object selected */}
          {selectedLibraryObject && (
            <div className="p-4 border-t border-gv-neutral-700 bg-gv-neutral-900">
              <button
                onClick={() => handlePlaceObject(selectedLibraryObject)}
                className="w-full py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv transition-colors"
              >
                Place &ldquo;{selectedLibraryObject.name}&rdquo;
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 relative">
        {/* Toggle Buttons */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          <button
            onClick={() => setShowLibrary((prev) => !prev)}
            className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-gv text-white transition-colors"
            title={showLibrary ? "Hide library (O)" : "Show library (O)"}
          >
            {showLibrary ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </button>

          {/* Object count */}
          {placedObjects.length > 0 && (
            <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-gv flex items-center gap-2">
              <Box className="h-4 w-4 text-gv-primary-400" />
              <span className="text-white text-sm">
                {placedObjects.length} object{placedObjects.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Right panel toggles */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            onClick={() => setShowAudioPanel((prev) => !prev)}
            className={`p-2 backdrop-blur-sm rounded-gv text-white transition-colors ${
              showAudioPanel ? "bg-gv-primary-500 hover:bg-gv-primary-600" : "bg-black/50 hover:bg-black/70"
            }`}
            title={showAudioPanel ? "Hide audio settings" : "Show audio settings"}
          >
            <Volume2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowProperties((prev) => !prev)}
            className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-gv text-white transition-colors"
            title={showProperties ? "Hide properties (P)" : "Show properties (P)"}
          >
            {showProperties ? <PanelRightClose className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Editor Toolbar */}
        <EditorToolbar isSaving={isSaving} lastSaved={lastSavedAt} onSave={saveObjects} />

        {/* Viewer Controls (scene name, back button) */}
        <ViewerControls sceneName={scene.name} onBack={handleBack} isLoading={false} />

        {/* 3D Scene Editor */}
        <SceneEditor splatUrl={scene.splatUrl || undefined} onSave={saveObjects} />
      </main>

      {/* Properties Panel */}
      <aside
        className={`flex-shrink-0 transition-all duration-300 ${
          showProperties ? "w-72" : "w-0"
        } overflow-hidden`}
      >
        <PropertiesPanel className="h-full w-72" />
      </aside>

      {/* Audio Panel Slide-out */}
      {showAudioPanel && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAudioPanel(false)}
          />

          {/* Panel */}
          <div className="relative h-full w-[480px] bg-gv-neutral-900 border-l border-gv-neutral-700 shadow-xl overflow-auto animate-slide-in-right">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gv-neutral-900 border-b border-gv-neutral-700">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-gv-primary-400" />
                <h2 className="text-lg font-semibold text-white">Scene Audio</h2>
              </div>
              <button
                onClick={() => setShowAudioPanel(false)}
                className="p-2 hover:bg-gv-neutral-700 rounded-gv transition-colors"
              >
                <X className="h-5 w-5 text-gv-neutral-400" />
              </button>
            </div>

            <SceneAudioPanel
              config={audioConfig}
              onChange={saveAudioConfig}
            />
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <ObjectUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          toast.success("Upload complete", "Your object is now available in the library");
        }}
      />
    </div>
  );
}
