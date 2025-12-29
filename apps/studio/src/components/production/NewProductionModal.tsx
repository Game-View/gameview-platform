"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FolderOpen,
  Video,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  HelpCircle,
  Zap,
  Scale,
  Star,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { SparkGuide, SPARK_GUIDE_CONTENT } from "./SparkGuide";
import { TutorialOverlay, PRODUCTION_TUTORIAL_STEPS } from "./TutorialOverlay";

// Types
interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  duration?: number;
  thumbnail?: string;
  uploadProgress: number;
  status: "pending" | "uploading" | "ready" | "error";
  // Added for real upload
  url?: string;
  path?: string;
  error?: string;
}

interface ProductionSettings {
  name: string;
  preset: "fast" | "balanced" | "high";
  videos: VideoFile[];
}

interface NewProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (settings: ProductionSettings) => Promise<void>;
}

// Quality presets
const QUALITY_PRESETS = {
  fast: {
    id: "fast",
    name: "Fast Preview",
    description: "Quick processing for previews and testing",
    icon: Zap,
    time: "15-30 min",
    quality: "Good",
    steps: 5000,
    recommended: false,
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    description: "Best balance of quality and processing time",
    icon: Scale,
    time: "30-60 min",
    quality: "Great",
    steps: 15000,
    recommended: true,
  },
  high: {
    id: "high",
    name: "High Quality",
    description: "Maximum quality for final productions",
    icon: Star,
    time: "1-2 hours",
    quality: "Excellent",
    steps: 30000,
    recommended: false,
  },
};

type ModalStep = "name" | "videos" | "settings" | "review";

const STEPS: ModalStep[] = ["name", "videos", "settings", "review"];

/**
 * NewProductionModal - Create a new video-to-3D production
 *
 * Multi-step wizard with Spark guide integration:
 * 1. Name your production
 * 2. Add video files (drag & drop or library)
 * 3. Choose quality settings
 * 4. Review and start processing
 */
export function NewProductionModal({
  isOpen,
  onClose,
  onSubmit,
}: NewProductionModalProps) {
  // Step state
  const [currentStep, setCurrentStep] = useState<ModalStep>("name");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Spark guide state
  const [isSparkMinimized, setIsSparkMinimized] = useState(false);

  // Form state
  const [productionName, setProductionName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<"fast" | "balanced" | "high">("balanced");
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Check if user has seen tutorial before
  useEffect(() => {
    if (isOpen && !hasSeenTutorial) {
      const seen = localStorage.getItem("gv_production_tutorial_seen");
      if (!seen) {
        setShowTutorial(true);
      } else {
        setHasSeenTutorial(true);
      }
    }
  }, [isOpen, hasSeenTutorial]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !showTutorial) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, showTutorial]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("name");
      setProductionName("");
      setSelectedPreset("balanced");
      setVideos([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Get current step index
  const currentStepIndex = STEPS.indexOf(currentStep);

  // Validation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case "name":
        return productionName.trim().length >= 3;
      case "videos":
        return videos.length >= 2 && videos.every((v) => v.status === "ready");
      case "settings":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep, productionName, videos]);

  // Navigation
  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("video/")
    );

    addVideoFiles(files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Add video files
  const addVideoFiles = (files: File[]) => {
    const newVideos: VideoFile[] = files.map((file) => ({
      id: `video_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      uploadProgress: 0,
      status: "pending" as const,
    }));

    setVideos((prev) => [...prev, ...newVideos]);

    // Upload each file
    newVideos.forEach((video) => {
      handleVideoUpload(video.id, video.file);
    });
  };

  // Real file upload to Supabase Storage using signed URLs
  // This bypasses Vercel's 4.5MB body size limit by uploading directly to Supabase
  const uploadVideo = async (videoId: string, file: File) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId ? { ...v, status: "uploading" as const } : v
      )
    );

    try {
      // Step 1: Get a signed upload URL from our API (small request)
      const urlResponse = await fetch("/api/productions/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const urlData = await urlResponse.json();

      if (!urlData.success || !urlData.uploadUrl) {
        throw new Error(urlData.error || "Failed to get upload URL");
      }

      // Step 2: Upload directly to Supabase using the signed URL
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setVideos((prev) =>
            prev.map((v) =>
              v.id === videoId ? { ...v, uploadProgress: progress } : v
            )
          );
        }
      });

      const uploadSuccess = await new Promise<boolean>((resolve) => {
        xhr.onload = () => {
          resolve(xhr.status >= 200 && xhr.status < 300);
        };
        xhr.onerror = () => {
          resolve(false);
        };
        xhr.open("PUT", urlData.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.send(file);
      });

      if (uploadSuccess) {
        // Generate the public URL for the uploaded file
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const fileUrl = `${supabaseUrl}/storage/v1/object/production-videos/${urlData.path}`;

        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  uploadProgress: 100,
                  status: "ready" as const,
                  url: fileUrl,
                  path: urlData.path,
                }
              : v
          )
        );
      } else {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  status: "error" as const,
                  error: "Upload to storage failed",
                }
              : v
          )
        );
      }
    } catch (error) {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? {
                ...v,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : v
        )
      );
    }
  };

  // Simulated upload for development/testing when Supabase is not configured
  const simulateUpload = (videoId: string) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId ? { ...v, status: "uploading" as const } : v
      )
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  uploadProgress: 100,
                  status: "ready" as const,
                  url: `/mock-uploads/${videoId}/${v.name}`, // Mock URL
                }
              : v
          )
        );
      } else {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId ? { ...v, uploadProgress: Math.floor(progress) } : v
          )
        );
      }
    }, 200);
  };

  // Use real upload if Supabase is configured, otherwise simulate
  const handleVideoUpload = (videoId: string, file: File) => {
    // Check if we should use real upload (environment check)
    const useRealUpload = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (useRealUpload) {
      uploadVideo(videoId, file);
    } else {
      simulateUpload(videoId);
    }
  };

  // Remove video
  const removeVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("video/")
    );
    addVideoFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: productionName,
        preset: selectedPreset,
        videos,
      });
      onClose();
    } catch (error) {
      console.error("Failed to start production:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete tutorial
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem("gv_production_tutorial_seen", "true");
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Get Spark guide content for current step
  const getSparkContent = () => {
    switch (currentStep) {
      case "name":
        return SPARK_GUIDE_CONTENT.nameProject;
      case "videos":
        return videos.length > 0 && videos.some((v) => v.status === "uploading")
          ? SPARK_GUIDE_CONTENT.uploadProgress
          : SPARK_GUIDE_CONTENT.selectVideos;
      case "settings":
        return SPARK_GUIDE_CONTENT.configureSettings;
      case "review":
        return SPARK_GUIDE_CONTENT.review;
      default:
        return SPARK_GUIDE_CONTENT.intro;
    }
  };

  if (!isOpen) return null;

  const sparkContent = getSparkContent();

  return (
    <>
      {/* Tutorial Overlay */}
      {showTutorial && (
        <TutorialOverlay
          steps={PRODUCTION_TUTORIAL_STEPS}
          currentStep={tutorialStep}
          onStepChange={setTutorialStep}
          onClose={handleTutorialComplete}
          onComplete={handleTutorialComplete}
        />
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className="relative bg-gv-neutral-900 border border-gv-neutral-700 rounded-gv-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gv-neutral-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-gv bg-gv-primary-500/20 flex items-center justify-center">
                <Video className="h-5 w-5 text-gv-primary-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  New Production
                </h2>
                <p className="text-sm text-gv-neutral-400">
                  Step {currentStepIndex + 1} of {STEPS.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTutorial(true)}
                className="p-2 text-gv-neutral-400 hover:text-white transition-colors rounded-gv hover:bg-gv-neutral-800"
                title="View tutorial"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gv-neutral-400 hover:text-white transition-colors rounded-gv hover:bg-gv-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Step Progress */}
          <div className="px-6 py-3 border-b border-gv-neutral-800 bg-gv-neutral-800/30">
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index < currentStepIndex
                        ? "bg-gv-primary-500 text-white"
                        : index === currentStepIndex
                        ? "bg-gv-primary-500/20 text-gv-primary-400 border-2 border-gv-primary-500"
                        : "bg-gv-neutral-700 text-gv-neutral-400"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        index < currentStepIndex
                          ? "bg-gv-primary-500"
                          : "bg-gv-neutral-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {/* Step 1: Name */}
            {currentStep === "name" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Production Name
                  </label>
                  <input
                    type="text"
                    value={productionName}
                    onChange={(e) => setProductionName(e.target.value)}
                    placeholder="e.g., Stadium Tour 2025"
                    className="w-full px-4 py-3 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 focus:outline-none focus:border-gv-primary-500 text-lg"
                    autoFocus
                  />
                  <p className="mt-2 text-sm text-gv-neutral-400">
                    Give your production a descriptive name to find it easily later.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Videos */}
            {currentStep === "videos" && (
              <div className="space-y-4">
                {/* Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative border-2 border-dashed rounded-gv-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-gv-primary-500 bg-gv-primary-500/10"
                      : "border-gv-neutral-700 hover:border-gv-neutral-600"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gv-neutral-800 flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-gv-neutral-400" />
                    </div>
                    <p className="text-white font-medium mb-2">
                      Drag & drop video files here
                    </p>
                    <p className="text-sm text-gv-neutral-400 mb-4">
                      or select from your files
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv text-sm font-medium transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Files
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-gv text-sm font-medium transition-colors">
                        <FolderOpen className="h-4 w-4" />
                        Browse Library
                      </button>
                    </div>
                  </div>
                </div>

                {/* Minimum cameras notice */}
                {videos.length < 2 && (
                  <div className="flex items-start gap-3 p-3 bg-gv-warning-500/10 border border-gv-warning-500/30 rounded-gv">
                    <AlertCircle className="h-5 w-5 text-gv-warning-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gv-warning-400 font-medium">
                        At least 2 camera angles required
                      </p>
                      <p className="text-xs text-gv-neutral-400 mt-1">
                        For best 3D reconstruction, use synchronized footage from
                        multiple cameras covering overlapping areas.
                      </p>
                    </div>
                  </div>
                )}

                {/* Video List */}
                {videos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">
                      Added Videos ({videos.length})
                    </p>
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-3 bg-gv-neutral-800 rounded-gv"
                      >
                        <div className="w-10 h-10 rounded bg-gv-neutral-700 flex items-center justify-center">
                          <Video className="h-5 w-5 text-gv-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {video.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gv-neutral-400">
                              {formatSize(video.size)}
                            </p>
                            {video.status === "uploading" && (
                              <p className="text-xs text-gv-primary-400">
                                {video.uploadProgress}%
                              </p>
                            )}
                            {video.status === "ready" && (
                              <span className="text-xs text-gv-success flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Ready
                              </span>
                            )}
                            {video.status === "error" && (
                              <span className="text-xs text-gv-error flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {video.error || "Upload failed"}
                              </span>
                            )}
                            {video.status === "pending" && (
                              <span className="text-xs text-gv-neutral-500">
                                Waiting...
                              </span>
                            )}
                          </div>
                          {video.status === "uploading" && (
                            <div className="mt-1 h-1 bg-gv-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gv-primary-500 transition-all"
                                style={{ width: `${video.uploadProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeVideo(video.id)}
                          className="p-2 text-gv-neutral-400 hover:text-gv-error transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Settings */}
            {currentStep === "settings" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Processing Quality
                  </label>
                  <div className="space-y-3">
                    {Object.values(QUALITY_PRESETS).map((preset) => {
                      const Icon = preset.icon;
                      const isSelected = selectedPreset === preset.id;

                      return (
                        <button
                          key={preset.id}
                          onClick={() =>
                            setSelectedPreset(preset.id as typeof selectedPreset)
                          }
                          className={`w-full flex items-start gap-4 p-4 rounded-gv border transition-all text-left ${
                            isSelected
                              ? "border-gv-primary-500 bg-gv-primary-500/10"
                              : "border-gv-neutral-700 hover:border-gv-neutral-600 bg-gv-neutral-800/50"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-gv flex items-center justify-center ${
                              isSelected
                                ? "bg-gv-primary-500/20 text-gv-primary-400"
                                : "bg-gv-neutral-700 text-gv-neutral-400"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {preset.name}
                              </span>
                              {preset.recommended && (
                                <span className="px-2 py-0.5 bg-gv-primary-500/20 text-gv-primary-400 text-xs rounded-full">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gv-neutral-400 mt-0.5">
                              {preset.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gv-neutral-500">
                              <span>Time: {preset.time}</span>
                              <span>Quality: {preset.quality}</span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "border-gv-primary-500 bg-gv-primary-500"
                                : "border-gv-neutral-600"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === "review" && (
              <div className="space-y-6">
                <div className="p-4 bg-gv-neutral-800/50 rounded-gv space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gv-neutral-400">
                      Production Name
                    </span>
                    <span className="text-white font-medium">{productionName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gv-neutral-400">
                      Video Files
                    </span>
                    <span className="text-white font-medium">
                      {videos.length} cameras
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gv-neutral-400">
                      Quality Preset
                    </span>
                    <span className="text-white font-medium">
                      {QUALITY_PRESETS[selectedPreset].name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gv-neutral-400">
                      Estimated Time
                    </span>
                    <span className="text-white font-medium">
                      {QUALITY_PRESETS[selectedPreset].time}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gv-primary-500/10 border border-gv-primary-500/30 rounded-gv">
                  <Sparkles className="h-5 w-5 text-gv-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gv-primary-300 font-medium">
                      Ready to start!
                    </p>
                    <p className="text-xs text-gv-neutral-400 mt-1">
                      Once processing begins, you can continue working on other
                      projects. We&apos;ll notify you when your 3D scene is ready.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gv-neutral-800 bg-gv-neutral-800/30">
            <button
              onClick={currentStepIndex === 0 ? onClose : handleBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gv-neutral-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {currentStepIndex === 0 ? "Cancel" : "Back"}
            </button>

            {currentStep === "review" ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Start Processing
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spark Guide (floating companion) */}
      <SparkGuide
        step={currentStepIndex + 1}
        totalSteps={STEPS.length}
        message={sparkContent.message}
        tip={sparkContent.tip}
        isMinimized={isSparkMinimized}
        onToggleMinimize={() => setIsSparkMinimized(!isSparkMinimized)}
      />
    </>
  );
}
