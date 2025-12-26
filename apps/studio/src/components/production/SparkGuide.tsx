"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Volume2, VolumeX } from "lucide-react";

interface SparkGuideProps {
  step: number;
  totalSteps: number;
  message: string;
  tip?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

/**
 * SparkGuide - Contextual AI assistant companion
 *
 * Provides step-by-step guidance during production creation.
 * Can be minimized to stay out of the way while still being accessible.
 */
export function SparkGuide({
  step,
  totalSteps,
  message,
  tip,
  isMinimized = false,
  onToggleMinimize,
}: SparkGuideProps) {
  const [isMuted, setIsMuted] = useState(false);

  if (isMinimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gv-primary-500/20 border border-gv-primary-500/30 rounded-full hover:border-gv-primary-500/50 transition-all group shadow-lg"
      >
        <div className="w-8 h-8 rounded-full bg-gv-primary-500/30 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-gv-primary-500" />
        </div>
        <span className="text-sm text-gv-primary-400 font-medium">
          Step {step}/{totalSteps}
        </span>
        <ChevronUp className="h-4 w-4 text-gv-primary-400 group-hover:text-gv-primary-300" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-gv-neutral-900/95 backdrop-blur-sm border border-gv-neutral-700 rounded-gv-lg shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gv-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gv-primary-500/20 flex items-center justify-center animate-pulse-glow">
            <Sparkles className="h-5 w-5 text-gv-primary-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Spark Guide</h4>
            <p className="text-xs text-gv-neutral-400">
              Step {step} of {totalSteps}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-gv-neutral-500 hover:text-gv-neutral-300 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onToggleMinimize}
            className="p-2 text-gv-neutral-500 hover:text-gv-neutral-300 transition-colors"
            title="Minimize"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message */}
      <div className="p-4">
        <p className="text-sm text-gv-neutral-200 leading-relaxed">{message}</p>

        {tip && (
          <div className="mt-3 p-3 bg-gv-primary-500/10 border border-gv-primary-500/20 rounded-gv">
            <p className="text-xs text-gv-primary-300">
              <span className="font-semibold">Tip:</span> {tip}
            </p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="px-4 pb-4">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i < step
                  ? "bg-gv-primary-500"
                  : i === step - 1
                  ? "bg-gv-primary-500"
                  : "bg-gv-neutral-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Spark guidance content for each step
export const SPARK_GUIDE_CONTENT = {
  intro: {
    message: "Let's create something amazing! I'll guide you through each step of setting up your new production.",
    tip: "You can minimize me anytime by clicking the arrow.",
  },
  nameProject: {
    message: "First, give your project a name. This helps you find it later in your library.",
    tip: "Use descriptive names like 'Stadium Tour Q1' or 'Concert Experience'.",
  },
  selectVideos: {
    message: "Now, add your video files. You'll need footage from at least 2 camera angles for the best 3D effect.",
    tip: "Synchronized multi-camera footage works best. Make sure your cameras captured overlapping areas.",
  },
  uploadProgress: {
    message: "Great choice! I'm uploading your videos now. This might take a few minutes depending on file size.",
    tip: "You can continue setting up while files upload in the background.",
  },
  configureSettings: {
    message: "Let's configure your processing settings. Higher quality takes longer but looks better.",
    tip: "Start with 'Balanced' preset for most projects. You can always re-process later.",
  },
  review: {
    message: "Almost there! Review your settings and click 'Start Processing' when ready.",
    tip: "Processing typically takes 30-60 minutes. You'll get a notification when it's done.",
  },
  processing: {
    message: "Your production is being processed! The AI is analyzing your footage and building the 3D scene.",
    tip: "Feel free to work on other projects while this runs.",
  },
  complete: {
    message: "Congratulations! Your 3D scene is ready. Click 'Open in Editor' to start adding interactive elements.",
    tip: "Try the playtest mode to experience your scene from a viewer's perspective!",
  },
};
