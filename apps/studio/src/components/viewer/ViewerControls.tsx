"use client";

import { useState, useEffect } from "react";
import {
  Maximize2,
  Minimize2,
  HelpCircle,
  X,
  ArrowLeft,
  RotateCcw,
  Eye,
  Move,
  MousePointer2,
} from "lucide-react";

interface ViewerControlsProps {
  sceneName: string;
  onBack: () => void;
  onReset?: () => void;
  isLoading?: boolean;
}

export function ViewerControls({
  sceneName,
  onBack,
  onReset,
  isLoading = false,
}: ViewerControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Check fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (isLoading) return;

    let timeout: NodeJS.Timeout;

    const showControlsTemporarily = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const handleMouseMove = () => showControlsTemporarily();
    const handleTouchStart = () => showControlsTemporarily();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchstart", handleTouchStart);

    // Initial timeout
    timeout = setTimeout(() => setShowControls(false), 3000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
      clearTimeout(timeout);
    };
  }, [isLoading]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  return (
    <>
      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 transition-opacity duration-300 ${
          showControls || isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-gv text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="px-3 py-2 bg-black/50 backdrop-blur-sm rounded-gv">
            <h1 className="text-white font-medium text-sm sm:text-base">{sceneName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-gv text-white transition-colors"
              title="Reset camera"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-gv text-white transition-colors"
            title="Controls help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-gv text-white transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom hint */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-300 ${
          showControls && !isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
          <span className="hidden sm:inline">
            Click and drag to look around • Scroll to zoom • Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs">?</kbd> for help
          </span>
          <span className="sm:hidden">Tap and drag to explore</span>
        </div>
      </div>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowHelp(false)} />
          <div className="relative bg-gv-neutral-900 border border-gv-neutral-700 rounded-gv-lg p-6 max-w-md w-full">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-1 text-gv-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">Navigation Controls</h2>

            <div className="space-y-6">
              {/* Desktop controls */}
              <div>
                <h3 className="text-sm font-medium text-gv-neutral-400 uppercase tracking-wider mb-3">
                  Desktop
                </h3>
                <div className="space-y-3">
                  <ControlRow
                    icon={<MousePointer2 className="h-4 w-4" />}
                    action="Look around"
                    control="Click + Drag"
                  />
                  <ControlRow
                    icon={<Move className="h-4 w-4" />}
                    action="Pan"
                    control="Right-click + Drag"
                  />
                  <ControlRow
                    icon={<Eye className="h-4 w-4" />}
                    action="Zoom"
                    control="Scroll wheel"
                  />
                </div>
              </div>

              {/* Touch controls */}
              <div>
                <h3 className="text-sm font-medium text-gv-neutral-400 uppercase tracking-wider mb-3">
                  Touch
                </h3>
                <div className="space-y-3">
                  <ControlRow
                    icon={<MousePointer2 className="h-4 w-4" />}
                    action="Look around"
                    control="One finger drag"
                  />
                  <ControlRow
                    icon={<Move className="h-4 w-4" />}
                    action="Pan"
                    control="Two finger drag"
                  />
                  <ControlRow
                    icon={<Eye className="h-4 w-4" />}
                    action="Zoom"
                    control="Pinch"
                  />
                </div>
              </div>

              {/* Keyboard shortcuts */}
              <div>
                <h3 className="text-sm font-medium text-gv-neutral-400 uppercase tracking-wider mb-3">
                  Keyboard
                </h3>
                <div className="space-y-3">
                  <ControlRow
                    icon={<Maximize2 className="h-4 w-4" />}
                    action="Fullscreen"
                    control="F"
                  />
                  <ControlRow
                    icon={<RotateCcw className="h-4 w-4" />}
                    action="Reset view"
                    control="R"
                  />
                  <ControlRow
                    icon={<HelpCircle className="h-4 w-4" />}
                    action="Show help"
                    control="?"
                  />
                  <ControlRow
                    icon={<ArrowLeft className="h-4 w-4" />}
                    action="Go back"
                    control="Esc"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ControlRow({
  icon,
  action,
  control,
}: {
  icon: React.ReactNode;
  action: string;
  control: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-gv-neutral-300">
        <span className="text-gv-neutral-500">{icon}</span>
        <span>{action}</span>
      </div>
      <kbd className="px-2 py-1 bg-gv-neutral-800 rounded text-sm text-gv-neutral-400">
        {control}
      </kbd>
    </div>
  );
}
