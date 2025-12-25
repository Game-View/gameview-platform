"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import type {
  TransitionState,
  TransitionEffect,
  TransitionPhase,
} from "@/lib/scene-navigation";

interface SceneTransitionProps {
  state: TransitionState;
  onTransitionComplete?: () => void;
}

/**
 * Renders transition effects between scenes
 */
export function SceneTransitionOverlay({
  state,
  onTransitionComplete,
}: SceneTransitionProps) {
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState("");

  useEffect(() => {
    if (state.phase === "idle" || state.phase === "complete") {
      setOpacity(0);
      return;
    }

    // Calculate opacity based on phase and progress
    if (state.phase === "fade_out") {
      setOpacity(state.progress);
    } else if (state.phase === "loading") {
      setOpacity(1);
    } else if (state.phase === "fade_in") {
      setOpacity(1 - state.progress);
    }

    // Apply transform for slide/zoom effects
    setTransform(getTransformForEffect(state.effect, state.phase, state.progress));

    // Notify completion
    if (state.phase === "fade_in" && state.progress >= 1) {
      onTransitionComplete?.();
    }
  }, [state, onTransitionComplete]);

  // Don't render if idle
  if (state.phase === "idle" || (state.phase === "complete" && opacity === 0)) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-auto"
      style={{
        backgroundColor: state.color,
        opacity,
        transform,
        transition: "opacity 50ms linear",
      }}
    >
      {/* Loading indicator during scene load */}
      {state.phase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Loading scene...</p>
          </div>
        </div>
      )}

      {/* Dissolve effect overlay */}
      {state.effect === "dissolve" && (
        <DissolveEffect progress={state.progress} phase={state.phase} />
      )}
    </div>
  );
}

function getTransformForEffect(
  effect: TransitionEffect,
  phase: TransitionPhase,
  progress: number
): string {
  const direction = phase === "fade_out" ? 1 : -1;
  const value = phase === "fade_out" ? progress : 1 - progress;

  switch (effect) {
    case "slide_left":
      return `translateX(${-100 * value * direction}%)`;
    case "slide_right":
      return `translateX(${100 * value * direction}%)`;
    case "slide_up":
      return `translateY(${-100 * value * direction}%)`;
    case "slide_down":
      return `translateY(${100 * value * direction}%)`;
    case "zoom":
      const scale = phase === "fade_out" ? 1 + progress * 0.5 : 1.5 - progress * 0.5;
      return `scale(${scale})`;
    default:
      return "";
  }
}

/**
 * Pixelate dissolve effect
 */
function DissolveEffect({
  progress,
  phase,
}: {
  progress: number;
  phase: TransitionPhase;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const pixelSize = Math.max(4, Math.floor(32 * (phase === "fade_out" ? progress : 1 - progress)));

    ctx.clearRect(0, 0, width, height);

    // Create pixelated pattern
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        if (Math.random() < (phase === "fade_out" ? progress : 1 - progress)) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
    }
  }, [progress, phase]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="absolute inset-0 pointer-events-none"
    />
  );
}

// ============================================
// TRANSITION MANAGER HOOK
// ============================================

interface UseSceneTransitionOptions {
  duration?: number;
  effect?: TransitionEffect;
  color?: string;
  onSceneLoad?: (sceneId: string) => Promise<void>;
  onComplete?: (sceneId: string, spawnId: string) => void;
}

export function useSceneTransition(options: UseSceneTransitionOptions = {}) {
  const {
    duration = 500,
    effect = "fade",
    color = "#000000",
    onSceneLoad,
    onComplete,
  } = options;

  const [state, setState] = useState<TransitionState>({
    phase: "idle",
    progress: 0,
    fromSceneId: null,
    toSceneId: null,
    toSpawnId: null,
    effect,
    color,
  });

  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const startTransition = useCallback(
    async (
      fromSceneId: string,
      toSceneId: string,
      toSpawnId: string,
      transitionEffect?: TransitionEffect,
      transitionDuration?: number,
      transitionColor?: string
    ) => {
      const useDuration = transitionDuration ?? duration;
      const useEffect = transitionEffect ?? effect;
      const useColor = transitionColor ?? color;

      // Initialize transition state
      setState({
        phase: "fade_out",
        progress: 0,
        fromSceneId,
        toSceneId,
        toSpawnId,
        effect: useEffect,
        color: useColor,
      });

      startTimeRef.current = performance.now();

      // Animate fade out
      await new Promise<void>((resolve) => {
        const animateFadeOut = () => {
          const elapsed = performance.now() - startTimeRef.current;
          const progress = Math.min(1, elapsed / (useDuration / 2));

          setState((prev) => ({ ...prev, progress }));

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animateFadeOut);
          } else {
            resolve();
          }
        };
        animateFadeOut();
      });

      // Loading phase
      setState((prev) => ({ ...prev, phase: "loading", progress: 0 }));

      // Load the new scene
      if (onSceneLoad) {
        await onSceneLoad(toSceneId);
      }

      // Animate fade in
      startTimeRef.current = performance.now();
      setState((prev) => ({ ...prev, phase: "fade_in", progress: 0 }));

      await new Promise<void>((resolve) => {
        const animateFadeIn = () => {
          const elapsed = performance.now() - startTimeRef.current;
          const progress = Math.min(1, elapsed / (useDuration / 2));

          setState((prev) => ({ ...prev, progress }));

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animateFadeIn);
          } else {
            resolve();
          }
        };
        animateFadeIn();
      });

      // Complete
      setState((prev) => ({ ...prev, phase: "complete" }));
      onComplete?.(toSceneId, toSpawnId);

      // Reset to idle after a short delay
      setTimeout(() => {
        setState({
          phase: "idle",
          progress: 0,
          fromSceneId: null,
          toSceneId: null,
          toSpawnId: null,
          effect,
          color,
        });
      }, 100);
    },
    [duration, effect, color, onSceneLoad, onComplete]
  );

  const cancelTransition = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setState({
      phase: "idle",
      progress: 0,
      fromSceneId: null,
      toSceneId: null,
      toSpawnId: null,
      effect,
      color,
    });
  }, [effect, color]);

  return {
    state,
    startTransition,
    cancelTransition,
    isTransitioning: state.phase !== "idle" && state.phase !== "complete",
  };
}

// ============================================
// PORTAL PROMPT OVERLAY
// ============================================

interface PortalPromptProps {
  portalName: string;
  triggerType: "enter" | "interact" | "key_required";
  isLocked?: boolean;
  lockedMessage?: string;
  enterPrompt?: string;
  visible: boolean;
}

export function PortalPrompt({
  portalName,
  triggerType,
  isLocked,
  lockedMessage,
  enterPrompt,
  visible,
}: PortalPromptProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-6 py-3 text-center animate-fade-in">
        <p className="text-white font-medium mb-1">{portalName}</p>
        {isLocked ? (
          <p className="text-red-400 text-sm">{lockedMessage ?? "This portal is locked"}</p>
        ) : triggerType === "interact" ? (
          <p className="text-gv-primary-400 text-sm">
            {enterPrompt ?? "Press E to enter"}
          </p>
        ) : triggerType === "key_required" ? (
          <p className="text-yellow-400 text-sm">Requires key item</p>
        ) : (
          <p className="text-gv-neutral-400 text-sm">Walk through to enter</p>
        )}
      </div>
    </div>
  );
}
