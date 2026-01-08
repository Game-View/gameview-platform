"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Video,
  Trash2,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  Eye,
  ChevronRight,
  X,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/stores/toast-store";
import { GameLogicPanel } from "@/components/game-logic";
import { defaultGameConfig, type GameConfig } from "@/lib/game-logic";
import type { StoredScene, VideoFile, ProcessingStatus } from "@/lib/scenes";

interface StoredBrief {
  id: string;
  name: string | null;
  tagline: string | null;
  status: string;
  gameConfig: GameConfig | null;
}

export default function BuildPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const briefId = params.briefId as string;

  const [brief, setBrief] = useState<StoredBrief | null>(null);
  const [scenes, setScenes] = useState<StoredScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<StoredScene | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [showGameLogic, setShowGameLogic] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Fetch brief and scenes
  useEffect(() => {
    async function fetchData() {
      if (!isLoaded || !user) return;

      try {
        // Fetch brief
        const briefRes = await fetch(`/api/briefs/${briefId}`);
        if (!briefRes.ok) {
          router.push("/dashboard");
          return;
        }
        const briefData = await briefRes.json();
        setBrief(briefData);

        // Load game config if exists
        if (briefData.gameConfig) {
          setGameConfig(briefData.gameConfig);
        }

        // Fetch scenes for this brief
        const scenesRes = await fetch(`/api/scenes?briefId=${briefId}`);
        if (scenesRes.ok) {
          const scenesData = await scenesRes.json();
          setScenes(scenesData);
          if (scenesData.length > 0 && !selectedScene) {
            setSelectedScene(scenesData[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Error", "Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [briefId, isLoaded, user, router, selectedScene]);

  // Poll for processing status
  useEffect(() => {
    if (!selectedScene) return;

    const isProcessing = [
      "processing",
      "frame_extraction",
      "colmap",
      "brush",
      "metadata",
    ].includes(selectedScene.processingStatus);

    if (!isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/processing?sceneId=${selectedScene.id}`);
        if (res.ok) {
          const status = await res.json();
          setSelectedScene((prev) =>
            prev
              ? {
                  ...prev,
                  processingStatus: status.status,
                  processingProgress: status.progress,
                  processingMessage: status.message,
                  splatUrl: status.outputs?.splatUrl,
                  thumbnailUrl: status.outputs?.thumbnailUrl,
                }
              : null
          );

          // Update in scenes list
          setScenes((prev) =>
            prev.map((s) =>
              s.id === selectedScene.id
                ? {
                    ...s,
                    processingStatus: status.status,
                    processingProgress: status.progress,
                  }
                : s
            )
          );

          if (status.status === "completed") {
            toast.success("Processing complete!", "Your scene is ready to view");
          } else if (status.status === "failed") {
            toast.error("Processing failed", status.error || "Unknown error");
          }
        }
      } catch (error) {
        console.error("Failed to poll status:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedScene]);

  // Create new scene
  const handleCreateScene = async () => {
    if (!newSceneName.trim()) {
      toast.error("Error", "Please enter a scene name");
      return;
    }

    setIsCreatingScene(true);
    try {
      const res = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefId,
          name: newSceneName,
          orderIndex: scenes.length,
        }),
      });

      if (!res.ok) throw new Error("Failed to create scene");

      const newScene = await res.json();
      setScenes((prev) => [...prev, newScene]);
      setSelectedScene(newScene);
      setNewSceneName("");
      toast.success("Scene created", `"${newSceneName}" is ready for videos`);
    } catch (error) {
      console.error("Failed to create scene:", error);
      toast.error("Error", "Failed to create scene");
    } finally {
      setIsCreatingScene(false);
    }
  };

  // Handle file upload
  const handleUpload = useCallback(
    async (files: FileList) => {
      if (!selectedScene) {
        toast.error("Error", "Please select or create a scene first");
        return;
      }

      setIsUploading(true);

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("sceneId", selectedScene.id);
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Upload failed");
          }

          const result = await res.json();

          // Update selected scene with new video
          setSelectedScene((prev) =>
            prev
              ? {
                  ...prev,
                  videoFiles: [...prev.videoFiles, result.video],
                  totalVideoSize: result.totalSize,
                  processingStatus: "pending" as ProcessingStatus,
                }
              : null
          );

          toast.success("Video uploaded", `${file.name} added to scene`);
        } catch (error) {
          console.error("Upload failed:", error);
          toast.error("Upload failed", error instanceof Error ? error.message : "Unknown error");
        }
      }

      setIsUploading(false);
    },
    [selectedScene]
  );

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  // Remove video
  const handleRemoveVideo = async (filename: string) => {
    if (!selectedScene) return;

    try {
      const res = await fetch(
        `/api/upload?sceneId=${selectedScene.id}&filename=${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to remove video");

      setSelectedScene((prev) =>
        prev
          ? {
              ...prev,
              videoFiles: prev.videoFiles.filter((v) => v.filename !== filename),
            }
          : null
      );

      toast.success("Video removed", filename);
    } catch (error) {
      console.error("Failed to remove video:", error);
      toast.error("Error", "Failed to remove video");
    }
  };

  // Start processing
  const handleStartProcessing = async () => {
    if (!selectedScene) return;

    try {
      const res = await fetch("/api/processing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneId: selectedScene.id,
          preset: "Balanced",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to start processing");
      }

      setSelectedScene((prev) =>
        prev
          ? {
              ...prev,
              processingStatus: "processing" as ProcessingStatus,
              processingProgress: 0,
            }
          : null
      );

      toast.info("Processing started", "This may take a while...");
    } catch (error) {
      console.error("Failed to start processing:", error);
      toast.error("Error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Handle game config changes with auto-save
  const handleGameConfigChange = useCallback(
    async (newConfig: GameConfig) => {
      setGameConfig(newConfig);

      // Debounced auto-save
      setIsSavingConfig(true);
      try {
        const res = await fetch(`/api/briefs/${briefId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameConfig: newConfig }),
        });

        if (!res.ok) throw new Error("Failed to save");
        toast.success("Saved", "Game logic saved");
      } catch (error) {
        console.error("Failed to save game config:", error);
        toast.error("Error", "Failed to save game logic");
      } finally {
        setIsSavingConfig(false);
      }
    },
    [briefId]
  );

  // Handle publish
  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to publish");
      }

      setPublishedUrl(data.shareUrl);
      setShowPublishModal(true);
      toast.success("Published!", "Your experience is now live");
    } catch (error) {
      console.error("Failed to publish:", error);
      toast.error("Error", error instanceof Error ? error.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  }, [briefId]);

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(() => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      toast.success("Copied!", "Link copied to clipboard");
    }
  }, [publishedUrl]);

  // Check if any scene is completed
  const hasCompletedScene = scenes.some(s => s.processingStatus === "completed");

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Get status badge
  const getStatusBadge = (status: ProcessingStatus) => {
    const badges: Record<ProcessingStatus, { color: string; icon: React.ReactNode }> = {
      pending: { color: "bg-gv-neutral-700 text-gv-neutral-300", icon: null },
      uploading: { color: "bg-blue-500/20 text-blue-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      processing: { color: "bg-blue-500/20 text-blue-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      frame_extraction: { color: "bg-blue-500/20 text-blue-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      colmap: { color: "bg-purple-500/20 text-purple-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      brush: { color: "bg-orange-500/20 text-orange-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      metadata: { color: "bg-green-500/20 text-green-400", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      completed: { color: "bg-green-500/20 text-green-400", icon: <CheckCircle className="h-3 w-3" /> },
      failed: { color: "bg-red-500/20 text-red-400", icon: <XCircle className="h-3 w-3" /> },
    };
    return badges[status];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gv-neutral-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gv-neutral-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gv-neutral-800 bg-gv-neutral-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {brief?.name || "Untitled Project"}
              </h1>
              <p className="text-sm text-gv-neutral-400">Build Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/spark?brief=${briefId}`}
              className="px-4 py-2 text-sm text-gv-neutral-400 hover:text-white transition-colors"
            >
              Edit Brief
            </Link>
            <button
              onClick={() => setShowGameLogic(true)}
              className={`p-2 transition-colors ${
                showGameLogic
                  ? "text-gv-primary-400"
                  : "text-gv-neutral-400 hover:text-white"
              }`}
              title="Game Logic Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            {hasCompletedScene && (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-gv transition-colors disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Publish
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Scene List Sidebar */}
        <aside className="w-64 border-r border-gv-neutral-800 bg-gv-neutral-900/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gv-neutral-400 uppercase tracking-wider">
              Scenes
            </h2>
          </div>

          <div className="space-y-2 mb-4">
            {scenes.map((scene) => {
              const badge = getStatusBadge(scene.processingStatus);
              return (
                <button
                  key={scene.id}
                  onClick={() => setSelectedScene(scene)}
                  className={`w-full text-left p-3 rounded-gv transition-colors ${
                    selectedScene?.id === scene.id
                      ? "bg-gv-primary-500/20 border border-gv-primary-500/50"
                      : "bg-gv-neutral-800/50 border border-transparent hover:bg-gv-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white truncate">{scene.name}</span>
                    <ChevronRight className="h-4 w-4 text-gv-neutral-500" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.icon}
                      {scene.processingStatus === "completed" ? "Ready" : scene.processingStatus}
                    </span>
                    {scene.videoFiles.length > 0 && (
                      <span className="text-xs text-gv-neutral-500">
                        {scene.videoFiles.length} video{scene.videoFiles.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add Scene */}
          <div className="border-t border-gv-neutral-800 pt-4">
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="New scene name..."
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 text-sm mb-2"
              onKeyDown={(e) => e.key === "Enter" && handleCreateScene()}
            />
            <button
              onClick={handleCreateScene}
              disabled={isCreatingScene || !newSceneName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gv-neutral-800 hover:bg-gv-neutral-700 border border-gv-neutral-700 rounded-gv text-sm text-gv-neutral-300 disabled:opacity-50 transition-colors"
            >
              {isCreatingScene ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Scene
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {selectedScene ? (
            <div className="max-w-3xl mx-auto">
              {/* Scene Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedScene.name}</h2>
                <div className="flex items-center gap-4">
                  {(() => {
                    const badge = getStatusBadge(selectedScene.processingStatus);
                    return (
                      <span className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${badge.color}`}>
                        {badge.icon}
                        {selectedScene.processingMessage || selectedScene.processingStatus}
                      </span>
                    );
                  })()}
                  {selectedScene.processingProgress > 0 && selectedScene.processingProgress < 100 && (
                    <span className="text-sm text-gv-neutral-400">
                      {selectedScene.processingProgress}% complete
                    </span>
                  )}
                </div>
              </div>

              {/* Processing Progress */}
              {["processing", "frame_extraction", "colmap", "brush", "metadata"].includes(
                selectedScene.processingStatus
              ) && (
                <div className="mb-6 p-4 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Processing</span>
                    <span className="text-sm text-gv-neutral-400">
                      {selectedScene.processingProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gv-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gv-primary-500 to-gv-primary-400 transition-all duration-500"
                      style={{ width: `${selectedScene.processingProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gv-neutral-400 mt-2">
                    {selectedScene.processingMessage}
                  </p>
                </div>
              )}

              {/* Completed Scene */}
              {selectedScene.processingStatus === "completed" && (
                <div className="mb-6 p-6 bg-green-500/10 border border-green-500/30 rounded-gv-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <span className="text-lg font-medium text-white">Scene Ready!</span>
                  </div>
                  <p className="text-gv-neutral-300 mb-4">
                    Your 3D scene has been processed and is ready to view.
                  </p>
                  <Link
                    href={`/project/${briefId}/scene/${selectedScene.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv transition-colors"
                  >
                    <Eye className="h-5 w-5" />
                    View Scene
                  </Link>
                </div>
              )}

              {/* Upload Area */}
              {selectedScene.processingStatus === "pending" && (
                <>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mb-6 p-8 border-2 border-dashed rounded-gv-lg text-center transition-colors ${
                      isDragging
                        ? "border-gv-primary-500 bg-gv-primary-500/10"
                        : "border-gv-neutral-700 hover:border-gv-neutral-600"
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 text-gv-primary-500 animate-spin mb-4" />
                        <p className="text-white font-medium">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gv-neutral-500 mx-auto mb-4" />
                        <p className="text-white font-medium mb-2">
                          Drop video files here or click to browse
                        </p>
                        <p className="text-sm text-gv-neutral-400 mb-4">
                          Supports MP4, MOV, AVI, WebM (max 2GB per file)
                        </p>
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-gv-neutral-800 hover:bg-gv-neutral-700 border border-gv-neutral-700 rounded-gv text-white cursor-pointer transition-colors">
                          <Video className="h-5 w-5" />
                          Select Videos
                          <input
                            type="file"
                            accept="video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleUpload(e.target.files)}
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {/* Video List */}
                  {selectedScene.videoFiles.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gv-neutral-400 uppercase tracking-wider mb-3">
                        Uploaded Videos ({selectedScene.videoFiles.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedScene.videoFiles.map((video: VideoFile) => (
                          <div
                            key={video.filename}
                            className="flex items-center justify-between p-3 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv"
                          >
                            <div className="flex items-center gap-3">
                              <Video className="h-5 w-5 text-gv-neutral-500" />
                              <div>
                                <p className="text-white font-medium">{video.filename}</p>
                                <p className="text-sm text-gv-neutral-400">
                                  {formatSize(video.size)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveVideo(video.filename)}
                              className="p-2 text-gv-neutral-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gv-neutral-400 mt-2">
                        Total: {formatSize(selectedScene.totalVideoSize)}
                      </p>
                    </div>
                  )}

                  {/* Process Button */}
                  {selectedScene.videoFiles.length >= 2 && (
                    <button
                      onClick={handleStartProcessing}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv transition-colors"
                    >
                      <Play className="h-5 w-5" />
                      Start Processing
                    </button>
                  )}

                  {selectedScene.videoFiles.length === 1 && (
                    <p className="text-center text-sm text-gv-neutral-400">
                      Add at least 2 videos for 3D reconstruction (multi-camera required)
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Video className="h-16 w-16 text-gv-neutral-600 mb-4" />
              <h2 className="text-xl font-medium text-white mb-2">No scenes yet</h2>
              <p className="text-gv-neutral-400 mb-6 max-w-md">
                Create your first scene to start uploading videos. Each scene represents a venue or
                location in your experience.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  placeholder="Scene name..."
                  className="px-4 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateScene()}
                />
                <button
                  onClick={handleCreateScene}
                  disabled={isCreatingScene || !newSceneName.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv disabled:opacity-50 transition-colors"
                >
                  {isCreatingScene ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Scene
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Game Logic Panel (Slide-out) */}
        <aside
          className={`fixed top-0 right-0 h-full w-96 bg-gv-neutral-900 border-l border-gv-neutral-800 shadow-2xl transform transition-transform duration-300 z-50 ${
            showGameLogic ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gv-neutral-800">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gv-primary-400" />
              <h2 className="text-lg font-semibold text-white">Game Logic</h2>
              {isSavingConfig && (
                <Loader2 className="h-4 w-4 text-gv-neutral-400 animate-spin" />
              )}
            </div>
            <button
              onClick={() => setShowGameLogic(false)}
              className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <GameLogicPanel
            config={gameConfig}
            onChange={handleGameConfigChange}
            className="h-[calc(100%-64px)]"
          />
        </aside>

        {/* Backdrop for Game Logic Panel */}
        {showGameLogic && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowGameLogic(false)}
          />
        )}
      </div>

      {/* Publish Success Modal */}
      {showPublishModal && publishedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowPublishModal(false)}
          />
          <div className="relative bg-gv-neutral-900 border border-gv-neutral-700 rounded-gv-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <button
              onClick={() => setShowPublishModal(false)}
              className="absolute top-4 right-4 p-2 text-gv-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Published!</h2>
              <p className="text-gv-neutral-400">
                Your experience is now live and ready to share.
              </p>
            </div>

            <div className="bg-gv-neutral-800 rounded-gv p-3 mb-4">
              <p className="text-sm text-gv-neutral-400 mb-1">Share Link</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publishedUrl}
                  className="flex-1 bg-transparent text-white text-sm truncate outline-none"
                />
                <button
                  onClick={copyShareUrl}
                  className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
                  title="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyShareUrl}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-white font-medium rounded-gv transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
