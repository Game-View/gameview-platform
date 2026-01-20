/**
 * Frame Playback Controller
 *
 * Manages playback of frame sequences for 4D Gaussian Splat motion.
 * Designed to work with per-frame PLY exports from 4DGaussians.
 *
 * Usage:
 * ```typescript
 * const controller = new FramePlaybackController({
 *   frameUrls: ['frame_0.ply', 'frame_1.ply', ...],
 *   fps: 15,
 *   onFrameChange: (frameIndex, url) => {
 *     // Update viewer with new frame
 *   }
 * });
 *
 * controller.play();
 * controller.setFrame(10);
 * controller.pause();
 * ```
 */

export interface FramePlaybackOptions {
  /** Array of PLY URLs, one per frame */
  frameUrls: string[];
  /** Playback framerate (frames per second) */
  fps: number;
  /** Called when the current frame changes */
  onFrameChange?: (frameIndex: number, frameUrl: string) => void;
  /** Loop playback when reaching the end */
  loop?: boolean;
}

export interface FramePlaybackState {
  currentFrame: number;
  isPlaying: boolean;
  playbackSpeed: number;
  totalFrames: number;
  duration: number; // in seconds
  currentTime: number; // in seconds
}

export class FramePlaybackController {
  private frameUrls: string[];
  private fps: number;
  private loop: boolean;
  private onFrameChange?: (frameIndex: number, frameUrl: string) => void;

  private _currentFrame: number = 0;
  private _isPlaying: boolean = false;
  private _playbackSpeed: number = 1.0;

  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameInterval: number;

  constructor(options: FramePlaybackOptions) {
    this.frameUrls = options.frameUrls;
    this.fps = options.fps;
    this.loop = options.loop ?? true;
    this.onFrameChange = options.onFrameChange;
    this.frameInterval = 1000 / this.fps;
  }

  /** Get current playback state */
  get state(): FramePlaybackState {
    return {
      currentFrame: this._currentFrame,
      isPlaying: this._isPlaying,
      playbackSpeed: this._playbackSpeed,
      totalFrames: this.frameUrls.length,
      duration: this.frameUrls.length / this.fps,
      currentTime: this._currentFrame / this.fps,
    };
  }

  /** Get current frame index */
  get currentFrame(): number {
    return this._currentFrame;
  }

  /** Get current frame URL */
  get currentFrameUrl(): string {
    return this.frameUrls[this._currentFrame] ?? "";
  }

  /** Check if currently playing */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /** Get total number of frames */
  get totalFrames(): number {
    return this.frameUrls.length;
  }

  /** Get duration in seconds */
  get duration(): number {
    return this.frameUrls.length / this.fps;
  }

  /** Get current time in seconds */
  get currentTime(): number {
    return this._currentFrame / this.fps;
  }

  /** Start playback */
  play(): void {
    if (this._isPlaying) return;
    if (this.frameUrls.length === 0) return;

    this._isPlaying = true;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  /** Pause playback */
  pause(): void {
    this._isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Toggle play/pause */
  togglePlayback(): void {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /** Stop playback and reset to beginning */
  stop(): void {
    this.pause();
    this.setFrame(0);
  }

  /** Set current frame by index */
  setFrame(frameIndex: number): void {
    // Clamp to valid range
    const newFrame = Math.max(0, Math.min(frameIndex, this.frameUrls.length - 1));

    if (newFrame !== this._currentFrame) {
      this._currentFrame = newFrame;
      this.notifyFrameChange();
    }
  }

  /** Set current time in seconds */
  setTime(timeSeconds: number): void {
    const frameIndex = Math.floor(timeSeconds * this.fps);
    this.setFrame(frameIndex);
  }

  /** Set playback speed (1.0 = normal, 0.5 = half, 2.0 = double) */
  setPlaybackSpeed(speed: number): void {
    this._playbackSpeed = Math.max(0.1, Math.min(speed, 4.0));
  }

  /** Step forward one frame */
  stepForward(): void {
    this.setFrame(this._currentFrame + 1);
  }

  /** Step backward one frame */
  stepBackward(): void {
    this.setFrame(this._currentFrame - 1);
  }

  /** Update frame URLs (for dynamic loading) */
  setFrameUrls(urls: string[]): void {
    this.frameUrls = urls;
    // Clamp current frame to new range
    if (this._currentFrame >= urls.length) {
      this.setFrame(urls.length - 1);
    }
  }

  /** Clean up resources */
  dispose(): void {
    this.pause();
    this.onFrameChange = undefined;
  }

  /** Animation tick */
  private tick = (): void => {
    if (!this._isPlaying) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    const adjustedInterval = this.frameInterval / this._playbackSpeed;

    if (elapsed >= adjustedInterval) {
      // Advance frame
      let nextFrame = this._currentFrame + 1;

      if (nextFrame >= this.frameUrls.length) {
        if (this.loop) {
          nextFrame = 0;
        } else {
          // Stop at end
          this.pause();
          return;
        }
      }

      this._currentFrame = nextFrame;
      this.notifyFrameChange();
      this.lastFrameTime = now - (elapsed % adjustedInterval);
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /** Notify listener of frame change */
  private notifyFrameChange(): void {
    this.onFrameChange?.(this._currentFrame, this.frameUrls[this._currentFrame] ?? "");
  }
}

/**
 * React hook for using FramePlaybackController
 */
import { useState, useEffect, useRef, useCallback } from "react";

export interface UseFramePlaybackOptions {
  frameUrls: string[];
  fps?: number;
  loop?: boolean;
  autoPlay?: boolean;
}

export interface UseFramePlaybackReturn {
  currentFrame: number;
  currentFrameUrl: string;
  isPlaying: boolean;
  totalFrames: number;
  duration: number;
  currentTime: number;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  stop: () => void;
  setFrame: (index: number) => void;
  setTime: (seconds: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
}

export function useFramePlayback(options: UseFramePlaybackOptions): UseFramePlaybackReturn {
  const { frameUrls, fps = 15, loop = true, autoPlay = false } = options;

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const controllerRef = useRef<FramePlaybackController | null>(null);

  // Initialize controller
  useEffect(() => {
    const controller = new FramePlaybackController({
      frameUrls,
      fps,
      loop,
      onFrameChange: (frameIndex) => {
        setCurrentFrame(frameIndex);
      },
    });

    controllerRef.current = controller;

    if (autoPlay && frameUrls.length > 0) {
      controller.play();
      setIsPlaying(true);
    }

    return () => {
      controller.dispose();
    };
  }, [frameUrls, fps, loop, autoPlay]);

  // Sync playing state
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    if (isPlaying && !controller.isPlaying) {
      controller.play();
    } else if (!isPlaying && controller.isPlaying) {
      controller.pause();
    }
  }, [isPlaying]);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame(0);
    controllerRef.current?.stop();
  }, []);

  const setFrameCallback = useCallback((index: number) => {
    controllerRef.current?.setFrame(index);
    setCurrentFrame(index);
  }, []);

  const setTime = useCallback((seconds: number) => {
    controllerRef.current?.setTime(seconds);
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    controllerRef.current?.setPlaybackSpeed(speed);
  }, []);

  const stepForward = useCallback(() => {
    controllerRef.current?.stepForward();
  }, []);

  const stepBackward = useCallback(() => {
    controllerRef.current?.stepBackward();
  }, []);

  const currentFrameUrl = frameUrls[currentFrame] ?? "";
  const totalFrames = frameUrls.length;
  const duration = totalFrames / fps;
  const currentTime = currentFrame / fps;

  return {
    currentFrame,
    currentFrameUrl,
    isPlaying,
    totalFrames,
    duration,
    currentTime,
    play,
    pause,
    togglePlayback,
    stop,
    setFrame: setFrameCallback,
    setTime,
    setPlaybackSpeed,
    stepForward,
    stepBackward,
  };
}
