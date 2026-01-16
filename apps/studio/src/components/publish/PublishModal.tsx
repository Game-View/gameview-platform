"use client";

import { useState, useMemo } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Rocket,
  Eye,
  Box,
  Target,
  Trophy,
  Image,
} from "lucide-react";
import { toast } from "@/stores/toast-store";
import type { GameConfig } from "@/lib/game-logic";
import type { PlacedObject } from "@/lib/objects";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefId: string;
  briefName: string;
  gameConfig: GameConfig;
  placedObjects: PlacedObject[];
  scenesReady: number;
  totalScenes: number;
  thumbnailUrl?: string | null;
}

interface ValidationResult {
  id: string;
  label: string;
  status: "pass" | "warning" | "fail";
  message: string;
}

export function PublishModal({
  isOpen,
  onClose,
  briefId,
  briefName,
  gameConfig,
  placedObjects,
  scenesReady,
  totalScenes,
  thumbnailUrl,
}: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    experienceId?: string;
    shareUrl?: string;
    error?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Validate experience before publish
  const validations = useMemo((): ValidationResult[] => {
    const results: ValidationResult[] = [];

    // Check scenes
    if (scenesReady === 0) {
      results.push({
        id: "scenes",
        label: "Completed Scenes",
        status: "fail",
        message: "At least one scene must be processed",
      });
    } else if (scenesReady < totalScenes) {
      results.push({
        id: "scenes",
        label: "Completed Scenes",
        status: "warning",
        message: `${scenesReady} of ${totalScenes} scenes ready`,
      });
    } else {
      results.push({
        id: "scenes",
        label: "Completed Scenes",
        status: "pass",
        message: `All ${totalScenes} scene(s) ready`,
      });
    }

    // Check objects
    if (placedObjects.length === 0) {
      results.push({
        id: "objects",
        label: "Placed Objects",
        status: "warning",
        message: "No objects placed (experience may feel empty)",
      });
    } else {
      results.push({
        id: "objects",
        label: "Placed Objects",
        status: "pass",
        message: `${placedObjects.length} object(s) placed`,
      });
    }

    // Check interactions
    const interactiveObjects = placedObjects.filter(
      (o) => o.interactions && o.interactions.length > 0
    );
    if (interactiveObjects.length === 0 && placedObjects.length > 0) {
      results.push({
        id: "interactions",
        label: "Interactions",
        status: "warning",
        message: "No interactions configured",
      });
    } else if (interactiveObjects.length > 0) {
      results.push({
        id: "interactions",
        label: "Interactions",
        status: "pass",
        message: `${interactiveObjects.length} interactive object(s)`,
      });
    }

    // Check win conditions
    const enabledWinConditions = gameConfig.winConditions.filter((c) => c.enabled);
    if (enabledWinConditions.length === 0) {
      results.push({
        id: "win-conditions",
        label: "Win Conditions",
        status: "warning",
        message: "No win conditions set (players can't complete)",
      });
    } else {
      results.push({
        id: "win-conditions",
        label: "Win Conditions",
        status: "pass",
        message: `${enabledWinConditions.length} win condition(s) set`,
      });
    }

    // Check objectives
    if (gameConfig.objectives.length > 0) {
      results.push({
        id: "objectives",
        label: "Objectives",
        status: "pass",
        message: `${gameConfig.objectives.length} objective(s) defined`,
      });
    }

    // Check thumbnail
    if (!thumbnailUrl) {
      results.push({
        id: "thumbnail",
        label: "Thumbnail",
        status: "warning",
        message: "No thumbnail (auto-generated will be used)",
      });
    } else {
      results.push({
        id: "thumbnail",
        label: "Thumbnail",
        status: "pass",
        message: "Thumbnail ready",
      });
    }

    return results;
  }, [scenesReady, totalScenes, placedObjects, gameConfig, thumbnailUrl]);

  const hasBlockingIssues = validations.some((v) => v.status === "fail");
  const hasWarnings = validations.some((v) => v.status === "warning");

  const handlePublish = async () => {
    if (hasBlockingIssues) return;

    setIsPublishing(true);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish");
      }

      setPublishResult({
        success: true,
        experienceId: data.experienceId,
        shareUrl: data.shareUrl,
      });

      toast.success("Published!", "Your experience is now live");
    } catch (error) {
      console.error("Publish error:", error);
      setPublishResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error("Publish failed", "Please try again");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (publishResult?.shareUrl) {
      navigator.clipboard.writeText(publishResult.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied!", "Link copied to clipboard");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gv-neutral-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gv-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Rocket className="h-5 w-5 text-gv-primary-400" />
              Publish Experience
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gv-neutral-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gv-neutral-400" />
            </button>
          </div>
          <p className="text-sm text-gv-neutral-400 mt-1">
            Publishing &ldquo;{briefName}&rdquo;
          </p>
        </div>

        {/* Content */}
        {!publishResult ? (
          <>
            {/* Validation Results */}
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-medium text-gv-neutral-300 uppercase tracking-wide">
                Pre-publish Checks
              </h3>

              <div className="space-y-2">
                {validations.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-3 bg-gv-neutral-800 rounded-lg"
                  >
                    {v.status === "pass" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : v.status === "warning" ? (
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{v.label}</p>
                      <p
                        className={`text-xs ${
                          v.status === "pass"
                            ? "text-green-400"
                            : v.status === "warning"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {v.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {hasBlockingIssues && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">
                    Please resolve the issues above before publishing.
                  </p>
                </div>
              )}

              {hasWarnings && !hasBlockingIssues && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400">
                    Warnings won&apos;t prevent publishing, but the experience may
                    feel incomplete.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gv-neutral-700 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gv-neutral-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={hasBlockingIssues || isPublishing}
                className="px-6 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 disabled:bg-gv-neutral-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Publish Now
                  </>
                )}
              </button>
            </div>
          </>
        ) : publishResult.success ? (
          <>
            {/* Success */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Published Successfully!
              </h3>
              <p className="text-gv-neutral-400 mb-6">
                Your experience is now live and ready to share.
              </p>

              {/* Share URL */}
              <div className="bg-gv-neutral-800 rounded-lg p-4 mb-4">
                <p className="text-xs text-gv-neutral-400 mb-2">Share Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publishResult.shareUrl}
                    className="flex-1 bg-gv-neutral-700 border-none rounded px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 rounded transition-colors"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-gv-neutral-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <a
                  href={publishResult.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Experience
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Error */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Publish Failed
              </h3>
              <p className="text-gv-neutral-400 mb-6">{publishResult.error}</p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setPublishResult(null)}
                  className="px-4 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
