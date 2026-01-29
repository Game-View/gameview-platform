"use client";

import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Video,
  Eye,
  RotateCcw,
  Trash2,
  ChevronDown,
  Download,
  StopCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Production stages matching Modal worker pipeline
export type ProductionStage =
  | "queued"
  | "downloading"
  | "frame_extraction"
  | "colmap"
  | "reconstruction"
  | "training"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled";

export interface Production {
  id: string;
  experienceId: string; // The experience this production creates
  name: string;
  status: ProductionStage;
  progress: number; // 0-100
  stageProgress: number; // 0-100 for current stage
  createdAt: string;
  completedAt?: string;
  videoCount: number;
  preset: "fast" | "balanced" | "high";
  errorMessage?: string;
  thumbnailUrl?: string;
  outputPath?: string;
}

interface ProductionProgressCardProps {
  production: Production;
  onView?: (id: string) => void;
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onExportPLY?: (id: string, experienceId: string) => void;
}

const STAGE_LABELS: Record<ProductionStage, string> = {
  queued: "Queued",
  downloading: "Downloading Videos",
  frame_extraction: "Extracting Frames",
  colmap: "Feature Matching",
  reconstruction: "Reconstructing Scene",
  training: "Training 3D Model",
  uploading: "Uploading Results",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STAGE_PROGRESS_RANGES: Record<ProductionStage, [number, number]> = {
  queued: [0, 0],
  downloading: [0, 10],
  frame_extraction: [10, 25],
  colmap: [25, 45],
  reconstruction: [45, 60],
  training: [60, 90],
  uploading: [90, 100],
  completed: [100, 100],
  failed: [0, 0],
  cancelled: [0, 0],
};

/**
 * ProductionProgressCard - Display production status and progress
 *
 * Shows real-time progress for productions in the pipeline.
 * Stages: Frame Extraction → COLMAP → Brush → Metadata
 */
export function ProductionProgressCard({
  production,
  onView,
  onRetry,
  onDelete,
  onCancel,
  onExportPLY,
}: ProductionProgressCardProps) {
  const isProcessing = !["completed", "failed", "cancelled"].includes(
    production.status
  );
  const isFailed = production.status === "failed";
  const isCompleted = production.status === "completed";

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showExportMenu]);

  // Calculate time elapsed or total time
  const formatTimeElapsed = () => {
    const start = new Date(production.createdAt);
    const end = production.completedAt
      ? new Date(production.completedAt)
      : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just started";
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className={`bg-gv-neutral-800/50 border rounded-gv-lg overflow-hidden transition-all ${
        isFailed
          ? "border-gv-error/30"
          : isCompleted
          ? "border-gv-success/30"
          : "border-gv-neutral-700 hover:border-gv-neutral-600"
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-4">
        {/* Thumbnail or placeholder */}
        <div className="w-20 h-14 rounded bg-gv-neutral-700 flex-shrink-0 overflow-hidden">
          {production.thumbnailUrl ? (
            <img
              src={production.thumbnailUrl}
              alt={production.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-6 w-6 text-gv-neutral-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{production.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-gv-neutral-400">
            <span>{production.videoCount} cameras</span>
            <span className="capitalize">{production.preset}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeElapsed()}
            </span>
          </div>
        </div>

        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isProcessing && (
            <div className="w-8 h-8 rounded-full bg-gv-primary-500/20 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-gv-primary-500 animate-spin" />
            </div>
          )}
          {isCompleted && (
            <div className="w-8 h-8 rounded-full bg-gv-success/20 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-gv-success" />
            </div>
          )}
          {isFailed && (
            <div className="w-8 h-8 rounded-full bg-gv-error/20 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-gv-error" />
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gv-neutral-300">
              {STAGE_LABELS[production.status]}
            </span>
            <span className="text-gv-primary-400">{production.progress}%</span>
          </div>
          <div className="h-1.5 bg-gv-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gv-primary-500 transition-all duration-300"
              style={{ width: `${production.progress}%` }}
            />
          </div>
          {/* Stage indicators */}
          <div className="flex gap-1 mt-2">
            {["downloading", "frame_extraction", "colmap", "reconstruction", "training", "uploading"].map(
              (stage) => {
                const range = STAGE_PROGRESS_RANGES[stage as ProductionStage];
                const stageStart = range ? range[0] : 0;
                const isActive = production.status === stage;
                const isComplete = production.progress > stageStart;

                return (
                  <div
                    key={stage}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      isActive
                        ? "bg-gv-primary-500"
                        : isComplete
                        ? "bg-gv-primary-500/50"
                        : "bg-gv-neutral-700"
                    }`}
                  />
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {isFailed && production.errorMessage && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-gv-error/10 border border-gv-error/20 rounded-gv">
            <p className="text-xs text-gv-error">{production.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        {isCompleted && onView && (
          <button
            onClick={() => onView(production.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv text-sm font-medium transition-colors"
          >
            <Eye className="h-4 w-4" />
            Open in Editor
          </button>
        )}
        {isFailed && onRetry && (
          <button
            onClick={() => onRetry(production.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-gv text-sm font-medium transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        )}
        {isProcessing && onCancel && (
          <button
            onClick={() => onCancel(production.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gv-neutral-400 hover:text-gv-warning-500 hover:bg-gv-neutral-700 rounded-gv text-sm transition-colors"
            title="Cancel production"
          >
            <StopCircle className="h-4 w-4" />
            Cancel
          </button>
        )}
        {!isProcessing && onDelete && (
          <button
            onClick={() => onDelete(production.id)}
            className="flex items-center justify-center gap-2 px-3 py-2 text-gv-neutral-400 hover:text-gv-error hover:bg-gv-neutral-700 rounded-gv text-sm transition-colors"
            title="Delete production"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {isCompleted && onExportPLY && (
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-gv text-sm transition-colors"
            >
              Export
              <ChevronDown className="h-4 w-4" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv shadow-lg z-10 py-1 min-w-[140px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("[ProductionCard] Download PLY clicked", production.id, production.experienceId);
                    onExportPLY(production.id, production.experienceId);
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gv-neutral-300 hover:bg-gv-neutral-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PLY
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ProductionProgressList - List of productions with progress
 */
interface ProductionProgressListProps {
  productions: Production[];
  onView?: (id: string) => void;
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onExportPLY?: (id: string, experienceId: string) => void;
}

export function ProductionProgressList({
  productions,
  onView,
  onRetry,
  onDelete,
  onCancel,
  onExportPLY,
}: ProductionProgressListProps) {
  if (productions.length === 0) {
    return null;
  }

  // Sort: processing first, then by date
  const sorted = [...productions].sort((a, b) => {
    const aProcessing = !["completed", "failed", "cancelled"].includes(a.status);
    const bProcessing = !["completed", "failed", "cancelled"].includes(b.status);
    if (aProcessing && !bProcessing) return -1;
    if (!aProcessing && bProcessing) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-3">
      {sorted.map((production) => (
        <ProductionProgressCard
          key={production.id}
          production={production}
          onView={onView}
          onRetry={onRetry}
          onDelete={onDelete}
          onCancel={onCancel}
          onExportPLY={onExportPLY}
        />
      ))}
    </div>
  );
}
