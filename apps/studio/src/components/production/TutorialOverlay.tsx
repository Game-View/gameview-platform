"use client";

import { useState } from "react";
import { X, Play, ChevronLeft, ChevronRight, RotateCcw, CheckCircle } from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  videoUrl?: string; // Will be added when recordings are ready
  duration?: string; // e.g., "1:30"
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  onComplete: () => void;
}

/**
 * TutorialOverlay - Video tutorial system
 *
 * Displays step-by-step video tutorials with navigation.
 * Videos are placeholders until final screen recordings are made.
 */
export function TutorialOverlay({
  steps,
  currentStep,
  onStepChange,
  onClose,
  onComplete,
}: TutorialOverlayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Tutorial Card */}
      <div className="relative bg-gv-neutral-900 border border-gv-neutral-700 rounded-gv-lg shadow-2xl max-w-2xl w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gv-neutral-800">
          <div>
            <p className="text-xs text-gv-primary-400 font-medium mb-1">
              Tutorial Part {currentStep + 1} of {steps.length}
            </p>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gv-neutral-400 hover:text-white transition-colors rounded-gv hover:bg-gv-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Area - Placeholder */}
        <div className="aspect-video bg-gv-neutral-800 relative">
          {step.videoUrl ? (
            // Real video when available
            <video
              src={step.videoUrl}
              className="w-full h-full object-cover"
              controls={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            // Placeholder until videos are recorded
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gv-neutral-700/50 flex items-center justify-center mb-4">
                <Play className="h-10 w-10 text-gv-neutral-500 ml-1" />
              </div>
              <p className="text-gv-neutral-400 text-sm mb-2">
                Tutorial Video Placeholder
              </p>
              <p className="text-gv-neutral-500 text-xs px-8 text-center">
                Screen recording will be added here showing: {step.title}
              </p>
              {step.duration && (
                <p className="text-gv-neutral-600 text-xs mt-2">
                  Estimated duration: {step.duration}
                </p>
              )}
            </div>
          )}

          {/* Step indicator pills */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => onStepChange(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep
                    ? "w-6 bg-gv-primary-500"
                    : i < currentStep
                    ? "bg-gv-primary-500/50"
                    : "bg-gv-neutral-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="p-4 border-t border-gv-neutral-800">
          <p className="text-sm text-gv-neutral-300 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-gv-neutral-800">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gv-neutral-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <button
            onClick={() => onStepChange(0)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gv-neutral-400 hover:text-gv-neutral-200 transition-colors"
            title="Restart tutorial"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv transition-colors"
          >
            {isLastStep ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Got it!
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip option */}
        <div className="text-center pb-4">
          <button
            onClick={onComplete}
            className="text-xs text-gv-neutral-500 hover:text-gv-neutral-300 transition-colors"
          >
            Skip tutorial (I know what I&apos;m doing)
          </button>
        </div>
      </div>
    </div>
  );
}

// Placeholder tutorial content - will be updated with actual videos
export const PRODUCTION_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    title: "Welcome to Productions",
    description:
      "A Production is where your video footage gets transformed into a 3D scene. This tutorial will walk you through creating your first Production.",
    duration: "0:45",
  },
  {
    id: "naming",
    title: "Naming Your Production",
    description:
      "Give your Production a descriptive name so you can easily find it later. Good names include the project or venue name and date.",
    duration: "0:30",
  },
  {
    id: "adding-videos",
    title: "Adding Video Files",
    description:
      "Drag and drop your video files or select from your library. For best results, use synchronized footage from multiple camera angles covering the same scene.",
    duration: "1:15",
  },
  {
    id: "quality-settings",
    title: "Quality Settings",
    description:
      "Choose a quality preset: Fast Preview for quick iterations, Balanced for most projects, or High Quality for final productions. Higher quality takes longer to process.",
    duration: "0:45",
  },
  {
    id: "start-processing",
    title: "Starting the Process",
    description:
      "Review your settings and click 'Start Processing'. The system will extract frames, reconstruct the 3D scene, and generate your viewable content. This typically takes 30-60 minutes.",
    duration: "0:30",
  },
];
