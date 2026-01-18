"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sliders,
  Scissors,
  MousePointer2,
  Magnet,
  Flag,
} from "lucide-react";

export interface TimelineThumbnail {
  time: number;
  imageUrl?: string;
  label?: string;
}

interface TimelineProps {
  duration?: number; // Total duration in seconds
  currentTime?: number;
  isPlaying?: boolean;
  thumbnails?: TimelineThumbnail[];
  onTimeChange?: (time: number) => void;
  onPlayPause?: () => void;
  onStop?: () => void;
  className?: string;
}

export function Timeline({
  duration = 60,
  currentTime: externalTime,
  isPlaying: externalIsPlaying,
  thumbnails = [],
  onTimeChange,
  onPlayPause,
  onStop,
  className = "",
}: TimelineProps) {
  const [internalTime, setInternalTime] = useState(0);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOverview, setIsDraggingOverview] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Use external or internal state
  const currentTime = externalTime ?? internalTime;
  const isPlaying = externalIsPlaying ?? internalIsPlaying;

  // Format time as HH:MM:SS:FF (timecode format like DaVinci)
  const formatTimecode = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (onPlayPause) {
      onPlayPause();
    } else {
      setInternalIsPlaying((prev) => !prev);
    }
  }, [onPlayPause]);

  // Handle stop
  const handleStop = useCallback(() => {
    if (onStop) {
      onStop();
    } else {
      setInternalIsPlaying(false);
      setInternalTime(0);
      onTimeChange?.(0);
    }
  }, [onStop, onTimeChange]);

  // Handle skip to start
  const handleSkipToStart = useCallback(() => {
    setInternalTime(0);
    onTimeChange?.(0);
  }, [onTimeChange]);

  // Handle skip to end
  const handleSkipToEnd = useCallback(() => {
    setInternalTime(duration);
    onTimeChange?.(duration);
  }, [duration, onTimeChange]);

  // Handle step forward (1 frame = 1/30 second)
  const handleStepForward = useCallback(() => {
    const newTime = Math.min(currentTime + 1 / 30, duration);
    setInternalTime(newTime);
    onTimeChange?.(newTime);
  }, [currentTime, duration, onTimeChange]);

  // Handle step back (1 frame)
  const handleStepBack = useCallback(() => {
    const newTime = Math.max(currentTime - 1 / 30, 0);
    setInternalTime(newTime);
    onTimeChange?.(newTime);
  }, [currentTime, onTimeChange]);

  // Handle play reverse
  const handlePlayReverse = useCallback(() => {
    // For now, just step back - could implement continuous reverse
    const newTime = Math.max(currentTime - 1, 0);
    setInternalTime(newTime);
    onTimeChange?.(newTime);
  }, [currentTime, onTimeChange]);

  // Calculate playhead position as percentage
  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle overview bar click/drag
  const handleOverviewMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!overviewRef.current) return;
      e.preventDefault();
      setIsDraggingOverview(true);

      const rect = overviewRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = Math.max(0, Math.min(duration, percentage * duration));
      setInternalTime(newTime);
      onTimeChange?.(newTime);
    },
    [duration, onTimeChange]
  );

  // Handle detail timeline click/drag
  const handleDetailMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!detailRef.current) return;
      e.preventDefault();
      setIsDragging(true);

      const rect = detailRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = Math.max(0, Math.min(duration, percentage * duration));
      setInternalTime(newTime);
      onTimeChange?.(newTime);
    },
    [duration, onTimeChange]
  );

  // Handle mouse move while dragging
  useEffect(() => {
    if (!isDragging && !isDraggingOverview) return;

    const handleMouseMove = (e: MouseEvent) => {
      const ref = isDraggingOverview ? overviewRef.current : detailRef.current;
      if (!ref) return;

      const rect = ref.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      setInternalTime(newTime);
      onTimeChange?.(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingOverview(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isDraggingOverview, duration, onTimeChange]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setInternalTime((prev) => {
        const newTime = prev + 1 / 30;
        if (newTime >= duration) {
          setInternalIsPlaying(false);
          return duration;
        }
        onTimeChange?.(newTime);
        return newTime;
      });
    }, 1000 / 30); // 30fps

    return () => clearInterval(interval);
  }, [isPlaying, duration, onTimeChange]);

  // Generate time markers for detail view (every 2 seconds visible)
  const detailMarkers: { time: number; label: string }[] = [];
  const visibleDuration = 10; // Show ~10 seconds of detail
  const startTime = Math.max(0, currentTime - visibleDuration / 2);
  const endTime = Math.min(duration, startTime + visibleDuration);

  for (let t = Math.floor(startTime); t <= Math.ceil(endTime); t += 2) {
    if (t >= 0 && t <= duration) {
      const hrs = Math.floor(t / 3600);
      const mins = Math.floor((t % 3600) / 60);
      const secs = t % 60;
      detailMarkers.push({
        time: t,
        label: `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:00`,
      });
    }
  }

  return (
    <div className={`bg-gv-neutral-900 border-t border-gv-neutral-700 ${className}`} ref={timelineRef}>
      {/* Transport Controls Bar - DaVinci style */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-gv-neutral-800 border-b border-gv-neutral-700">
        {/* Left: Tool Icons */}
        <div className="flex items-center gap-0.5">
          <ToolButton icon={<Sliders className="h-4 w-4" />} title="Inspector" />
          <ToolButton icon={<MousePointer2 className="h-4 w-4" />} title="Selection" />
          <div className="w-px h-5 bg-gv-neutral-600 mx-1" />
          <ToolButton icon={<Scissors className="h-4 w-4" />} title="Cut" />
          <ToolButton icon={<Magnet className="h-4 w-4" />} title="Snap" />
          <div className="w-px h-5 bg-gv-neutral-600 mx-1" />
          <ToolButton icon={<Flag className="h-4 w-4" />} title="Marker" />
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-0.5">
          <TransportButton
            icon={<SkipBack className="h-4 w-4" />}
            title="Go to start"
            onClick={handleSkipToStart}
          />
          <TransportButton
            icon={<ChevronLeft className="h-4 w-4" />}
            title="Step back"
            onClick={handleStepBack}
          />
          <TransportButton
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12L8 5v14l11-7z" transform="scale(-1,1) translate(-24,0)" />
              </svg>
            }
            title="Play reverse"
            onClick={handlePlayReverse}
          />
          <TransportButton
            icon={<Square className="h-3.5 w-3.5" fill="currentColor" />}
            title="Stop"
            onClick={handleStop}
          />
          <TransportButton
            icon={
              isPlaying
                ? <Pause className="h-4 w-4" fill="currentColor" />
                : <Play className="h-4 w-4" fill="currentColor" />
            }
            title={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
            active={isPlaying}
          />
          <TransportButton
            icon={<ChevronRight className="h-4 w-4" />}
            title="Step forward"
            onClick={handleStepForward}
          />
          <TransportButton
            icon={<SkipForward className="h-4 w-4" />}
            title="Go to end"
            onClick={handleSkipToEnd}
          />
          <TransportButton
            icon={<RotateCcw className="h-4 w-4" />}
            title="Loop"
          />
        </div>

        {/* Right: Large Timecode Display */}
        <div className="font-mono text-lg text-gv-neutral-200 tracking-wider min-w-[140px] text-right">
          {formatTimecode(currentTime)}
        </div>
      </div>

      {/* Overview Timeline Bar - Compact view of entire timeline */}
      <div
        ref={overviewRef}
        className="h-8 bg-gv-neutral-800 border-b border-gv-neutral-700 relative cursor-pointer"
        onMouseDown={handleOverviewMouseDown}
      >
        {/* Time markers on overview */}
        <div className="absolute inset-x-0 top-0 h-3 flex items-end">
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const time = pct * duration;
            const hrs = Math.floor(time / 3600);
            const mins = Math.floor((time % 3600) / 60);
            const secs = Math.floor(time % 60);
            return (
              <div
                key={pct}
                className="absolute text-[9px] text-gv-neutral-500 transform -translate-x-1/2"
                style={{ left: `${pct * 100}%` }}
              >
                {`${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:00`}
              </div>
            );
          })}
        </div>

        {/* Overview clip/region visualization */}
        <div className="absolute left-0 right-0 bottom-0 h-4 mx-1">
          <div className="h-full bg-gv-primary-600 rounded-sm opacity-80 flex items-center">
            {/* Segment markers - representing content/scenes */}
            {[0.1, 0.2, 0.35, 0.4, 0.55, 0.6, 0.65, 0.75, 0.8, 0.85, 0.9].map((pct, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gv-neutral-800"
                style={{ left: `${pct * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Overview playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${playheadPosition}%` }}
        />
      </div>

      {/* Detail Timeline - Frame-accurate view */}
      <div
        ref={detailRef}
        className="relative cursor-pointer select-none"
        onMouseDown={handleDetailMouseDown}
      >
        {/* Time ruler with frame markers */}
        <div className="h-5 bg-gv-neutral-800 border-b border-gv-neutral-700 relative">
          {detailMarkers.map((marker) => {
            const position = ((marker.time - startTime) / (endTime - startTime)) * 100;
            if (position < 0 || position > 100) return null;
            return (
              <div
                key={marker.time}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${position}%` }}
              >
                <div className="h-2 w-px bg-gv-neutral-600" />
                <span className="text-[9px] text-gv-neutral-500 whitespace-nowrap">
                  {marker.label}
                </span>
              </div>
            );
          })}

          {/* Playhead triangle */}
          <div
            className="absolute -bottom-1 z-20 pointer-events-none"
            style={{ left: `${playheadPosition}%` }}
          >
            <div
              className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500 transform -translate-x-1/2"
            />
          </div>
        </div>

        {/* Video track with thumbnails */}
        <div className="h-24 bg-gv-neutral-900 relative overflow-hidden">
          {/* Thumbnail strip */}
          <div className="absolute inset-0 flex">
            {thumbnails.length > 0 ? (
              thumbnails.map((thumb, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 h-full border-r border-gv-neutral-700 relative"
                  style={{ width: `${100 / Math.max(thumbnails.length, 8)}%` }}
                >
                  {thumb.imageUrl ? (
                    <img
                      src={thumb.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gv-primary-900/30 to-gv-neutral-900" />
                  )}
                  {thumb.label && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-gv-neutral-400 px-1 truncate">
                      {thumb.label}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Default placeholder thumbnails
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 h-full border-r border-gv-neutral-700 bg-gradient-to-br from-gv-primary-900/30 to-gv-neutral-900"
                  style={{ width: `${100 / 12}%` }}
                />
              ))
            )}
          </div>

          {/* Playhead line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: `${playheadPosition}%` }}
          />
        </div>

        {/* Text/Graphics track indicator */}
        <div className="h-6 bg-gv-neutral-800 border-t border-gv-neutral-700 relative flex items-center">
          <div className="absolute inset-0 flex items-center px-2">
            <span className="text-[10px] text-gv-primary-400 uppercase tracking-wider truncate">
              3D Scene • Objects • Interactions
            </span>
          </div>

          {/* Playhead line continues */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: `${playheadPosition}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Tool button for left toolbar
function ToolButton({
  icon,
  title,
  active = false,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-gv-neutral-600 text-white"
          : "text-gv-neutral-500 hover:text-white hover:bg-gv-neutral-700"
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}

// Transport button for playback controls
function TransportButton({
  icon,
  title,
  active = false,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded transition-colors ${
        active
          ? "bg-gv-neutral-600 text-white"
          : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-700"
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}

export default Timeline;
