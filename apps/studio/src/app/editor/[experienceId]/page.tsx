"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import dynamic from "next/dynamic";
import { Loader2, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Box, Volume2, X, Play, Upload } from "lucide-react";
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
import type { StoredObject, PlacedObject } from "@/lib/objects";
import { PlaytestMode } from "@/components/playtest";
import { defaultGameConfig, type GameConfig } from "@/lib/game-logic";
import { Timeline } from "@/components/editor/Timeline";
import { SceneTabs, type Scene } from "@/components/editor/SceneTabs";
import { CameraPreview } from "@/components/editor/CameraPreview";

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

interface ExperienceData {
  id: string;
  title: string;
  description: string;
  status: string;
  plyUrl: string | null;
  scenesData: PlacedObject[] | null;
  gameConfig: GameConfig | null;
  creator: {
    id: string;
    displayName: string;
  };
}

export default function ExperienceEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded } = useUser();

  const experienceId = params.experienceId as string;

  const [experience, setExperience] = useState<ExperienceData | null>(null);
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
  const [isPlaytestMode, setIsPlaytestMode] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // New component states
  const [showTimeline, setShowTimeline] = useState(true);
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [timelineTime, setTimelineTime] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([
    { id: "scene-1", name: "Main Scene", order: 0 },
  ]);
  const [activeSceneId, setActiveSceneId] = useState("scene-1");

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

  // Fetch experience data
  useEffect(() => {
    async function fetchExperience() {
      if (!isLoaded) return;

      try {
        const response = await fetch(
          `/api/trpc/experience.get?batch=1&input=${encodeURIComponent(
            JSON.stringify({ "0": { json: { id: experienceId } } })
          )}`
        );

        const data = await response.json();
        const result = Array.isArray(data) ? data[0] : data;

        if (result?.error) {
          console.error("[Editor] tRPC error:", result.error);
          setError(result.error.message || "Experience not found");
          return;
        }

        if (!response.ok) {
          setError(`Server error (${response.status})`);
          return;
        }

        if (result?.result?.data?.json) {
          const exp = result.result.data.json;
          setExperience(exp);

          // Load placed objects from scenesData
          if (exp.scenesData && Array.isArray(exp.scenesData)) {
            setPlacedObjects(exp.scenesData);
          }

          // Load game config
          if (exp.gameConfig) {
            setGameConfig(exp.gameConfig as GameConfig);
          }

          // Check if experience is ready for editing
          if (!exp.plyUrl) {
            setError("This experience is still processing. Please wait for the 3D scene to be ready.");
          }
        } else {
          setError("Experience not found");
        }
      } catch (err) {
        console.error("[Editor] Failed to fetch experience:", err);
        setError("Failed to load experience");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExperience();
  }, [experienceId, isLoaded, setPlacedObjects]);

  // Save placed objects
  const saveObjects = useCallback(async () => {
    if (!experience) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/trpc/experience.updateSceneData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            id: experienceId,
            scenesData: placedObjects,
            gameConfig: gameConfig,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Failed to save");
      }

      markClean();
      toast.success("Saved", "Changes saved successfully");
    } catch (err) {
      console.error("[Editor] Failed to save:", err);
      toast.error("Error", "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [experience, experienceId, placedObjects, gameConfig, markClean]);

  // Auto-save when dirty (debounced)
  useEffect(() => {
    if (!isDirty || !experience) return;

    const timeout = setTimeout(() => {
      saveObjects();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isDirty, experience, saveObjects]);

  // Save audio config
  const saveAudioConfig = useCallback(async (config: SceneAudioConfig) => {
    if (!experience) return;
    setAudioConfig(config);
    toast.success("Saved", "Audio settings saved");
  }, [experience]);

  // Publish experience
  const handlePublish = useCallback(async () => {
    if (!experience) return;

    if (!confirm("Are you ready to publish this experience? It will be visible to players.")) {
      return;
    }

    setIsPublishing(true);
    try {
      // Save any pending changes first
      await saveObjects();

      // Publish the experience
      const response = await fetch("/api/trpc/experience.publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: { id: experienceId },
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Failed to publish");
      }

      toast.success("Published!", "Your experience is now live");

      // Update local state
      setExperience((prev) => prev ? { ...prev, status: "PUBLISHED" } : null);
    } catch (err) {
      console.error("[Editor] Failed to publish:", err);
      toast.error("Error", err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }, [experience, experienceId, saveObjects]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (isDirty) {
      if (confirm("You have unsaved changes. Save before leaving?")) {
        saveObjects().then(() => router.push("/dashboard"));
        return;
      }
    }
    router.push("/dashboard");
  }, [router, isDirty, saveObjects]);

  // Handle placing object from library
  const handlePlaceObject = useCallback(
    (object: StoredObject, position?: { x: number; y: number; z: number }) => {
      const placedObject: PlacedObject = {
        instanceId: crypto.randomUUID(),
        objectId: object.id,
        name: object.name,
        modelUrl: object.modelUrl,
        transform: {
          position: position || { x: 0, y: 0, z: 0 },
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

  // Handle drag over the editor area
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDraggingOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  }, []);

  // Handle drop on the editor area
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);

      try {
        const data = e.dataTransfer.getData("application/json");
        if (!data) return;

        const object: StoredObject = JSON.parse(data);

        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (e.clientX - rect.left - centerX) / 100;
        const offsetZ = (e.clientY - rect.top - centerY) / 100;

        const position = {
          x: offsetX,
          y: 0,
          z: offsetZ,
        };

        handlePlaceObject(object, position);
      } catch (err) {
        console.error("Failed to parse dropped object:", err);
      }
    },
    [handlePlaceObject]
  );

  // Scene management handlers
  const handleAddScene = useCallback(() => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: `Scene ${scenes.length + 1}`,
      order: scenes.length,
    };
    setScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newScene.id);
    toast.success("Scene added", `${newScene.name} created`);
  }, [scenes.length]);

  const handleDeleteScene = useCallback((sceneId: string) => {
    if (scenes.length <= 1) {
      toast.error("Cannot delete", "You must have at least one scene");
      return;
    }
    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
    if (activeSceneId === sceneId) {
      setActiveSceneId(scenes[0]?.id || "");
    }
    toast.success("Scene deleted", "Scene removed successfully");
  }, [scenes, activeSceneId]);

  const handleRenameScene = useCallback((sceneId: string, newName: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, name: newName } : s))
    );
  }, []);

  const handleDuplicateScene = useCallback((sceneId: string) => {
    const sourceScene = scenes.find((s) => s.id === sceneId);
    if (!sourceScene) return;

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: `${sourceScene.name} (Copy)`,
      order: scenes.length,
    };
    setScenes((prev) => [...prev, newScene]);
    toast.success("Scene duplicated", `${newScene.name} created`);
  }, [scenes]);

  // Timeline handlers
  const handleTimelinePlayPause = useCallback(() => {
    setIsTimelinePlaying((prev) => !prev);
  }, []);

  const handleTimelineStop = useCallback(() => {
    setIsTimelinePlaying(false);
    setTimelineTime(0);
  }, []);

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
    modifiers: ["ctrl"],
    callback: () => {
      saveObjects();
    },
  });

  useKeyboardShortcut({
    key: "t",
    callback: () => setShowTimeline((prev) => !prev),
  });

  useKeyboardShortcut({
    key: " ",
    callback: handleTimelinePlayPause,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gv-neutral-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gv-neutral-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !experience) {
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
          <h1 className="text-xl font-bold text-white mb-2">Cannot Load Editor</h1>
          <p className="text-gv-neutral-400 mb-6">{error || "Experience not found"}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv transition-colors"
          >
            Back to Dashboard
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Scene Tabs */}
        <SceneTabs
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSceneChange={setActiveSceneId}
          onAddScene={handleAddScene}
          onDeleteScene={handleDeleteScene}
          onRenameScene={handleRenameScene}
          onDuplicateScene={handleDuplicateScene}
        />

        {/* Editor Content Area */}
        <div
          className={`flex-1 relative transition-all ${isDraggingOver ? "ring-4 ring-gv-primary-500 ring-inset" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
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
            {/* Playtest Button */}
            <button
              onClick={() => setIsPlaytestMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 backdrop-blur-sm rounded-gv text-white font-medium transition-colors"
              title="Test your experience"
            >
              <Play className="h-4 w-4" />
              Test
            </button>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing || experience?.status === "PUBLISHED"}
              className={`flex items-center gap-2 px-4 py-2 backdrop-blur-sm rounded-gv text-white font-medium transition-colors ${
                experience?.status === "PUBLISHED"
                  ? "bg-green-500 cursor-default"
                  : isPublishing
                  ? "bg-gv-primary-500/50 cursor-wait"
                  : "bg-gv-primary-500 hover:bg-gv-primary-600"
              }`}
              title={experience?.status === "PUBLISHED" ? "Already published" : "Publish your experience"}
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {experience?.status === "PUBLISHED" ? "Published" : isPublishing ? "Publishing..." : "Publish"}
            </button>

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

          {/* Viewer Controls (experience name, back button) */}
          <ViewerControls sceneName={experience.title} onBack={handleBack} isLoading={false} />

          {/* 3D Scene Editor */}
          <SceneEditor splatUrl={experience.plyUrl || undefined} onSave={saveObjects} />

          {/* Camera Preview - Floating Panel */}
          {showCameraPreview && (
            <div className="absolute bottom-4 right-4 z-20 w-72">
              <CameraPreview
                isLive={true}
                onToggleFullscreen={() => setShowCameraPreview(false)}
              />
            </div>
          )}
        </div>

        {/* Timeline */}
        {showTimeline && (
          <Timeline
            duration={60}
            currentTime={timelineTime}
            isPlaying={isTimelinePlaying}
            onTimeChange={setTimelineTime}
            onPlayPause={handleTimelinePlayPause}
            onStop={handleTimelineStop}
          />
        )}
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
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAudioPanel(false)}
          />
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

      {/* Playtest Mode */}
      {isPlaytestMode && (
        <PlaytestMode
          sceneId={experienceId}
          briefId={experienceId}
          splatUrl={experience.plyUrl || undefined}
          gameConfig={gameConfig}
          placedObjects={placedObjects}
          onExit={() => setIsPlaytestMode(false)}
        />
      )}
    </div>
  );
}
