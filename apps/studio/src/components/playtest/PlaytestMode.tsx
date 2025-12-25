"use client";

import { useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader2, X, Play } from "lucide-react";
import dynamic from "next/dynamic";
import { usePlaytestStore } from "@/stores/playtest-store";
import { PlayerHUD } from "./PlayerHUD";
import { FirstPersonControls } from "./FirstPersonControls";
import { InteractionRuntime, TriggerZoneVisuals } from "./InteractionRuntime";
import { DebugToolbar } from "./DebugToolbar";
import { NavigationRuntime, NavigationHUD } from "./NavigationRuntime";
import type { GameConfig } from "@/lib/game-logic";
import type { PlacedObject } from "@/lib/objects";
import type { PortalConfig, SpawnPoint, SceneData } from "@/lib/scene-navigation";

// Dynamic import for GaussianSplats
const GaussianSplats = dynamic(
  () => import("@/components/viewer/GaussianSplats").then((mod) => mod.GaussianSplats),
  { ssr: false }
);

interface PlaytestModeProps {
  sceneId: string;
  briefId: string;
  splatUrl?: string;
  gameConfig: GameConfig;
  placedObjects: PlacedObject[];
  portals?: PortalConfig[];
  spawnPoints?: SpawnPoint[];
  availableScenes?: SceneData[];
  onExit: () => void;
}

export function PlaytestMode({
  sceneId,
  briefId,
  splatUrl,
  gameConfig,
  placedObjects,
  portals = [],
  spawnPoints = [],
  availableScenes = [],
  onExit,
}: PlaytestModeProps) {
  const {
    isPlaytestMode,
    isPaused,
    debugState,
    startPlaytest,
    stopPlaytest,
    pausePlaytest,
    resumePlaytest,
    tick,
  } = usePlaytestStore();

  const lastTimeRef = useRef(performance.now());

  // Start playtest on mount
  useEffect(() => {
    startPlaytest(sceneId, briefId, gameConfig, placedObjects, {
      x: 0,
      y: 1.6,
      z: 5,
    });

    return () => {
      stopPlaytest();
    };
  }, [sceneId, briefId, gameConfig, placedObjects, startPlaytest, stopPlaytest]);

  // Game loop
  useEffect(() => {
    if (!isPlaytestMode) return;

    let animationId: number;

    const gameLoop = () => {
      const now = performance.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      tick(deltaTime);
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaytestMode, tick]);

  // Handle escape to pause/exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPaused) {
          // Already paused - exit playtest
          stopPlaytest();
          onExit();
        } else {
          // Pause
          pausePlaytest();
          document.exitPointerLock();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, pausePlaytest, stopPlaytest, onExit]);

  const handleExit = useCallback(() => {
    stopPlaytest();
    onExit();
  }, [stopPlaytest, onExit]);

  if (!isPlaytestMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* 3D Scene */}
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Gaussian Splats Scene */}
        {splatUrl && <GaussianSplats url={splatUrl} />}

        {/* Placed Objects */}
        <PlacedObjectsRenderer objects={placedObjects} showLabels={debugState.showObjectLabels} />

        {/* First Person Controls */}
        <FirstPersonControls enabled={!isPaused} />

        {/* Interaction Runtime */}
        <InteractionRuntime enabled={!isPaused} />

        {/* Navigation Runtime (Portals) */}
        {portals.length > 0 && (
          <NavigationRuntime
            enabled={!isPaused}
            currentSceneId={sceneId}
            portals={portals}
            spawnPoints={spawnPoints}
            availableScenes={availableScenes}
          />
        )}

        {/* Debug Visuals */}
        <TriggerZoneVisuals objects={placedObjects} visible={debugState.showTriggerZones} />
      </Canvas>

      {/* HUD Overlay */}
      <PlayerHUD className="absolute inset-0" />

      {/* Navigation HUD (Portal Prompts, Transitions) */}
      <NavigationHUD enabled={!isPaused && portals.length > 0} />

      {/* Debug Toolbar */}
      <DebugToolbar />

      {/* Exit Button */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-colors"
        title="Exit playtest (Esc)"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Pause Overlay */}
      {isPaused && <PauseOverlay onResume={resumePlaytest} onExit={handleExit} />}

      {/* Click to Start Overlay */}
      <ClickToStartOverlay />
    </div>
  );
}

// Pause overlay
function PauseOverlay({
  onResume,
  onExit,
}: {
  onResume: () => void;
  onExit: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Paused</h2>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onResume}
            className="px-8 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Play className="h-5 w-5" />
            Resume
          </button>
          <button
            onClick={onExit}
            className="px-8 py-3 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white font-medium rounded-lg transition-colors"
          >
            Exit
          </button>
        </div>
        <p className="mt-4 text-gv-neutral-400 text-sm">Press Esc to exit</p>
      </div>
    </div>
  );
}

// Click to start overlay
function ClickToStartOverlay() {
  const { isPaused, playerState } = usePlaytestStore();

  // Only show at start
  if (isPaused || playerState.elapsedTime > 100) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div className="text-center bg-black/60 backdrop-blur-sm rounded-lg p-6">
        <p className="text-white text-xl font-medium mb-4">Click to start</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-left">
          <div className="text-gv-neutral-400">WASD</div>
          <div className="text-white">Move</div>
          <div className="text-gv-neutral-400">Mouse / Arrows</div>
          <div className="text-white">Look around</div>
          <div className="text-gv-neutral-400">Space</div>
          <div className="text-white">Jump</div>
          <div className="text-gv-neutral-400">T / G</div>
          <div className="text-white">Fly up / down</div>
          <div className="text-gv-neutral-400">Q</div>
          <div className="text-white">Spin</div>
          <div className="text-gv-neutral-400">Shift</div>
          <div className="text-white">Sprint</div>
          <div className="text-gv-neutral-400">Esc</div>
          <div className="text-white">Pause / Exit</div>
        </div>
      </div>
    </div>
  );
}

// Simple placed objects renderer
function PlacedObjectsRenderer({
  objects,
  showLabels,
}: {
  objects: PlacedObject[];
  showLabels: boolean;
}) {
  // For now, render simple boxes for placed objects
  // In production, this would load the actual 3D models
  return (
    <group>
      {objects.map((object) => (
        <group
          key={object.instanceId}
          position={[
            object.transform.position.x,
            object.transform.position.y,
            object.transform.position.z,
          ]}
          rotation={[
            (object.transform.rotation.x * Math.PI) / 180,
            (object.transform.rotation.y * Math.PI) / 180,
            (object.transform.rotation.z * Math.PI) / 180,
          ]}
          scale={[
            object.transform.scale.x,
            object.transform.scale.y,
            object.transform.scale.z,
          ]}
        >
          {/* Placeholder mesh */}
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4a9eff" />
          </mesh>

          {/* Label */}
          {showLabels && (
            <sprite position={[0, 1.5, 0]} scale={[2, 0.5, 1]}>
              <spriteMaterial color="white" opacity={0.8} transparent />
            </sprite>
          )}
        </group>
      ))}
    </group>
  );
}

// Entry point button for scene editor
interface PlaytestButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function PlaytestButton({ onClick, disabled, className = "" }: PlaytestButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gv-neutral-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors ${className}`}
    >
      <Play className="h-4 w-4" />
      Test Play
    </button>
  );
}
