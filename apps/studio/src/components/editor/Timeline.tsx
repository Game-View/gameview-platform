"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Video,
  Music,
  Box,
  Sparkles,
} from "lucide-react";

export interface TimelineTrack {
  id: string;
  name: string;
  type: "video" | "audio" | "objects" | "effects";
  color: string;
  items?: TimelineItem[];
}

export interface TimelineItem {
  id: string;
  startTime: number;
  duration: number;
  name: string;
}

interface TimelineProps {
  duration?: number; // Total duration in seconds
  currentTime?: number;
  isPlaying?: boolean;
  tracks?: TimelineTrack[];
  onTimeChange?: (time: number) => void;
  onPlayPause?: () => void;
  onSkipForward?: () => void;
  onSkipBack?: () => void;
  className?: string;
}

const defaultTracks: TimelineTrack[] = [
  { id: "video", name: "Video", type: "video", color: "#3B82F6", items: [] },
  { id: "audio", name: "Audio", type: "audio", color: "#8B5CF6", items: [] },
  { id: "objects", name: "Objects", type: "objects", color: "#10B981", items: [] },
  { id: "effects", name: "Effects", type: "effects", color: "#F59E0B", items: [] },
];

export function Timeline({
  duration = 60,
  currentTime: externalTime,
  isPlaying: externalIsPlaying,
  tracks = defaultTracks,
  onTimeChange,
  onPlayPause,
  onSkipForward,
  onSkipBack,
  className = "",
}: TimelineProps) {
  const [internalTime, setInternalTime] = useState(0);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1); // 1 = 100%, 2 = 200%, etc.
  const [isDragging, setIsDragging] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);

  // Use external or internal state
  const currentTime = externalTime ?? internalTime;
  const isPlaying = externalIsPlaying ?? internalIsPlaying;

  // Format time as MM:SS:FF (frames)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (onPlayPause) {
      onPlayPause();
    } else {
      setInternalIsPlaying((prev) => !prev);
    }
  }, [onPlayPause]);

  // Handle skip forward (5 seconds)
  const handleSkipForward = useCallback(() => {
    if (onSkipForward) {
      onSkipForward();
    } else {
      const newTime = Math.min(currentTime + 5, duration);
      setInternalTime(newTime);
      onTimeChange?.(newTime);
    }
  }, [currentTime, duration, onSkipForward, onTimeChange]);

  // Handle skip back (5 seconds)
  const handleSkipBack = useCallback(() => {
    if (onSkipBack) {
      onSkipBack();
    } else {
      const newTime = Math.max(currentTime - 5, 0);
      setInternalTime(newTime);
      onTimeChange?.(newTime);
    }
  }, [currentTime, onSkipBack, onTimeChange]);

  // Handle step forward (1 frame)
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

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.5, 0.5));
  }, []);

  // Calculate timeline width based on zoom
  const timelineWidth = duration * 20 * zoom; // 20px per second at zoom 1
  const playheadPosition = (currentTime / duration) * 100;

  // Handle scrubber drag
  const handleScrubberMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!scrubberRef.current) return;
      e.preventDefault();
      setIsDragging(true);

      const rect = scrubberRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollPosition;
      const newTime = Math.max(0, Math.min(duration, (x / timelineWidth) * duration));
      setInternalTime(newTime);
      onTimeChange?.(newTime);
    },
    [duration, timelineWidth, scrollPosition, onTimeChange]
  );

  // Handle mouse move while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrubberRef.current) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollPosition;
      const newTime = Math.max(0, Math.min(duration, (x / timelineWidth) * duration));
      setInternalTime(newTime);
      onTimeChange?.(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration, timelineWidth, scrollPosition, onTimeChange]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setInternalTime((prev) => {
        const newTime = prev + 1 / 30;
        if (newTime >= duration) {
          setInternalIsPlaying(false);
          return 0;
        }
        onTimeChange?.(newTime);
        return newTime;
      });
    }, 1000 / 30); // 30fps

    return () => clearInterval(interval);
  }, [isPlaying, duration, onTimeChange]);

  // Get icon for track type
  const getTrackIcon = (type: TimelineTrack["type"]) => {
    switch (type) {
      case "video":
        return <Video className="h-3.5 w-3.5" />;
      case "audio":
        return <Music className="h-3.5 w-3.5" />;
      case "objects":
        return <Box className="h-3.5 w-3.5" />;
      case "effects":
        return <Sparkles className="h-3.5 w-3.5" />;
    }
  };

  // Generate time markers
  const markers: { time: number; label: string }[] = [];
  const markerInterval = zoom >= 2 ? 5 : zoom >= 1 ? 10 : 30; // seconds
  for (let t = 0; t <= duration; t += markerInterval) {
    markers.push({
      time: t,
      label: `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`,
    });
  }

  return (
    <div className={`bg-gv-neutral-900 border-t border-gv-neutral-700 ${className}`}>
      {/* Timeline Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gv-neutral-800">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSkipBack}
            className="p-1.5 hover:bg-gv-neutral-700 rounded transition-colors text-gv-neutral-400 hover:text-white"
            title="Skip back 5s"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={handleStepBack}
            className="p-1.5 hover:bg-gv-neutral-700 rounded transition-colors text-gv-neutral-400 hover:text-white"
            title="Step back 1 frame"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className={`p-2 rounded-full transition-colors ${
              isPlaying
                ? "bg-gv-primary-500 text-white hover:bg-gv-primary-600"
                : "bg-gv-neutral-700 text-white hover:bg-gv-neutral-600"
            }`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            onClick={handleStepForward}
            className="p-1.5 hover:bg-gv-neutral-700 rounded transition-colors text-gv-neutral-400 hover:text-white"
            title="Step forward 1 frame"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleSkipForward}
            className="p-1.5 hover:bg-gv-neutral-700 rounded transition-colors text-gv-neutral-400 hover:text-white"
            title="Skip forward 5s"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Time Display */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm text-white bg-gv-neutral-800 px-3 py-1 rounded">
            {formatTime(currentTime)}
          </div>
          <span className="text-gv-neutral-500">/</span>
          <div className="font-mono text-sm text-gv-neutral-400">
            {formatTime(duration)}
          </div>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-gv-neutral-700 rounded transition-colors text-gv-neutral-400 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gv-neutral-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-gv-neutral-700 rounded transition-colors text-gv-neutral-400 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timeline Tracks Area */}
      <div className="flex" ref={timelineRef}>
        {/* Track Labels */}
        <div className="flex-shrink-0 w-32 border-r border-gv-neutral-800">
          {/* Time ruler header */}
          <div className="h-6 border-b border-gv-neutral-800" />

          {/* Track labels */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-10 flex items-center gap-2 px-3 border-b border-gv-neutral-800 text-sm"
              style={{ color: track.color }}
            >
              {getTrackIcon(track.type)}
              <span className="text-gv-neutral-300 truncate">{track.name}</span>
            </div>
          ))}
        </div>

        {/* Timeline Scrubber Area */}
        <div
          className="flex-1 overflow-x-auto"
          ref={scrubberRef}
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          <div style={{ width: timelineWidth, minWidth: "100%" }}>
            {/* Time Ruler */}
            <div
              className="h-6 border-b border-gv-neutral-800 relative cursor-pointer"
              onMouseDown={handleScrubberMouseDown}
            >
              {/* Time markers */}
              {markers.map((marker) => (
                <div
                  key={marker.time}
                  className="absolute top-0 h-full flex flex-col items-center"
                  style={{ left: `${(marker.time / duration) * 100}%` }}
                >
                  <div className="h-2 w-px bg-gv-neutral-600" />
                  <span className="text-[10px] text-gv-neutral-500 mt-0.5">
                    {marker.label}
                  </span>
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 h-full flex flex-col items-center pointer-events-none"
                style={{ left: `${playheadPosition}%` }}
              >
                <div className="w-2.5 h-2.5 bg-red-500 transform -translate-x-1/2 rotate-45" />
              </div>
            </div>

            {/* Track Lanes */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-10 border-b border-gv-neutral-800 relative"
                onMouseDown={handleScrubberMouseDown}
              >
                {/* Track items */}
                {track.items?.map((item) => (
                  <div
                    key={item.id}
                    className="absolute top-1 h-8 rounded px-2 flex items-center text-xs text-white truncate cursor-move"
                    style={{
                      left: `${(item.startTime / duration) * 100}%`,
                      width: `${(item.duration / duration) * 100}%`,
                      backgroundColor: track.color,
                      opacity: 0.8,
                    }}
                  >
                    {item.name}
                  </div>
                ))}

                {/* Playhead line */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-red-500 pointer-events-none"
                  style={{ left: `${playheadPosition}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
