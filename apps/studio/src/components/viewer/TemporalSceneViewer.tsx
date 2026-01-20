"use client";

import { useCallback, useEffect } from "react";
import { SceneViewer, SceneViewerProps } from "./SceneViewer";
import { useFramePlayback } from "../../lib/frame-playback";

export interface TemporalSceneViewerProps
  extends Omit<SceneViewerProps, "splatUrl" | "onLoad" | "onProgress"> {
  /**
   * Array of PLY URLs, one per frame.
   * For static scenes, pass a single-element array.
   */
  frameUrls: string[];

  /**
   * Frames per second for playback.
   * @default 15
   */
  fps?: number;

  /**
   * Whether to loop playback.
   * @default true
   */
  loop?: boolean;

  /**
   * External control: current time in seconds.
   * If provided, the component will sync to this time.
   */
  currentTime?: number;

  /**
   * External control: is playing.
   * If provided, the component will sync to this state.
   */
  isPlaying?: boolean;

  /**
   * Called when the current time changes (for timeline sync).
   */
  onTimeChange?: (timeSeconds: number) => void;

  /**
   * Called when playback state changes.
   */
  onPlaybackChange?: (isPlaying: boolean) => void;

  /**
   * Called when the current frame loads.
   */
  onFrameLoad?: (frameIndex: number) => void;

  /**
   * Called on load error.
   */
  onError?: (error: Error) => void;
}

/**
 * TemporalSceneViewer - A viewer for 4D Gaussian Splat motion sequences.
 *
 * This component manages playback of frame sequences exported from 4DGaussians.
 * It can be controlled externally via currentTime/isPlaying props (for timeline sync)
 * or internally via play/pause methods.
 *
 * Example usage:
 * ```tsx
 * <TemporalSceneViewer
 *   frameUrls={[
 *     '/frames/time_00000.ply',
 *     '/frames/time_00001.ply',
 *     '/frames/time_00002.ply',
 *   ]}
 *   fps={15}
 *   currentTime={timelineTime}
 *   isPlaying={isTimelinePlaying}
 *   onTimeChange={setTimelineTime}
 * />
 * ```
 */
export function TemporalSceneViewer({
  frameUrls,
  fps = 15,
  loop = true,
  currentTime: externalTime,
  isPlaying: externalIsPlaying,
  onTimeChange,
  onPlaybackChange,
  onFrameLoad,
  onError,
  ...sceneViewerProps
}: TemporalSceneViewerProps) {
  // Internal playback state
  const playback = useFramePlayback({
    frameUrls,
    fps,
    loop,
    autoPlay: false,
  });

  // Track if we're externally controlled
  const isExternallyControlled = externalTime !== undefined || externalIsPlaying !== undefined;

  // Sync external time to internal frame
  useEffect(() => {
    if (externalTime !== undefined) {
      playback.setTime(externalTime);
    }
  }, [externalTime, playback]);

  // Sync external playing state
  useEffect(() => {
    if (externalIsPlaying !== undefined) {
      if (externalIsPlaying && !playback.isPlaying) {
        playback.play();
      } else if (!externalIsPlaying && playback.isPlaying) {
        playback.pause();
      }
    }
  }, [externalIsPlaying, playback]);

  // Notify parent of time changes
  useEffect(() => {
    onTimeChange?.(playback.currentTime);
  }, [playback.currentTime, onTimeChange]);

  // Notify parent of playback state changes
  useEffect(() => {
    onPlaybackChange?.(playback.isPlaying);
  }, [playback.isPlaying, onPlaybackChange]);

  // Frame load handler
  const handleFrameLoad = useCallback(() => {
    onFrameLoad?.(playback.currentFrame);
  }, [onFrameLoad, playback.currentFrame]);

  // Check if we have frames
  if (frameUrls.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gv-neutral-900">
        <p className="text-gv-neutral-400">No frames to display</p>
      </div>
    );
  }

  // For now, we just pass the current frame URL to SceneViewer.
  // This will cause a full reload when frames change - not smooth for playback,
  // but works for timeline scrubbing (proof of concept).
  //
  // Future optimization: implement frame preloading and smooth switching.
  return (
    <div className="w-full h-full relative">
      <SceneViewer
        {...sceneViewerProps}
        splatUrl={playback.currentFrameUrl}
        onLoad={handleFrameLoad}
        onError={onError}
      />

      {/* Frame info overlay (for development) */}
      {frameUrls.length > 1 && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-gv text-xs">
            <div className="text-gv-neutral-400">
              Frame: {playback.currentFrame + 1} / {playback.totalFrames}
            </div>
            <div className="text-gv-neutral-400">
              Time: {playback.currentTime.toFixed(2)}s / {playback.duration.toFixed(2)}s
            </div>
            {!isExternallyControlled && (
              <div className="text-gv-primary-400 mt-1">
                {playback.isPlaying ? "Playing" : "Paused"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Playback controls (only when not externally controlled) */}
      {frameUrls.length > 1 && !isExternallyControlled && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-gv flex items-center gap-4">
            <button
              onClick={playback.stepBackward}
              className="text-white hover:text-gv-primary-400 transition-colors"
              title="Previous frame"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            <button
              onClick={playback.togglePlayback}
              className="w-10 h-10 rounded-full bg-gv-primary-500 hover:bg-gv-primary-400 text-white flex items-center justify-center transition-colors"
              title={playback.isPlaying ? "Pause" : "Play"}
            >
              {playback.isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={playback.stepForward}
              className="text-white hover:text-gv-primary-400 transition-colors"
              title="Next frame"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
              </svg>
            </button>

            <button
              onClick={playback.stop}
              className="text-white hover:text-gv-primary-400 transition-colors"
              title="Stop"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Utility to generate frame URLs from a base URL pattern.
 *
 * @example
 * const urls = generateFrameUrls('/scenes/123/frames/time_{index}.ply', 150);
 * // Returns: ['/scenes/123/frames/time_00000.ply', '/scenes/123/frames/time_00001.ply', ...]
 */
export function generateFrameUrls(
  pattern: string,
  frameCount: number,
  options: {
    /** Number of digits for zero-padding. @default 5 */
    padding?: number;
    /** Starting index. @default 0 */
    startIndex?: number;
  } = {}
): string[] {
  const { padding = 5, startIndex = 0 } = options;
  const urls: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const frameIndex = startIndex + i;
    const paddedIndex = String(frameIndex).padStart(padding, "0");
    urls.push(pattern.replace("{index}", paddedIndex));
  }

  return urls;
}
