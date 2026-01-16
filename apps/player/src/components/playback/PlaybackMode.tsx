"use client";

import { useEffect, useCallback, useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, Html, PointerLockControls } from "@react-three/drei";
import { Loader2, X, Play, Share2, RotateCcw, Trophy, Star, Clock, Target, ArrowLeft, Flag, Pause } from "lucide-react";
import * as THREE from "three";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePlaybackStore, selectFormattedScore, selectRemainingTime } from "@/stores/playback-store";
import type { GameConfig, PlacedObject, PlayerPosition, SceneData } from "@/lib/player-runtime";
import { formatTime, defaultGameConfig } from "@/lib/player-runtime";

// Dynamic import for GaussianSplats
const GaussianSplats = dynamic(
  () => import("@/components/viewer/GaussianSplats").then((mod) => mod.GaussianSplats),
  { ssr: false }
);

interface PlaybackModeProps {
  experienceId: string;
  experienceTitle: string;
  scenes: SceneData[];
  gameConfig: GameConfig | null;
  onExit: () => void;
  onComplete?: (stats: PlayStats) => void;
}

export interface PlayStats {
  score: number;
  collectibles: number;
  timeElapsed: number;
  objectivesCompleted: number;
  hasWon: boolean;
}

export function PlaybackMode({
  experienceId,
  experienceTitle,
  scenes,
  gameConfig: providedConfig,
  onExit,
  onComplete,
}: PlaybackModeProps) {
  const gameConfig = providedConfig || defaultGameConfig;
  const primaryScene = scenes[0];
  const placedObjects = primaryScene?.placedObjects || [];

  const {
    isPlaying,
    isPaused,
    isComplete,
    playerState,
    startPlayback,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    resetPlayback,
    tick,
  } = usePlaybackStore();

  const lastTimeRef = useRef(performance.now());
  const [sceneLoading, setSceneLoading] = useState(true);

  // Start playback on mount
  useEffect(() => {
    if (primaryScene) {
      const startPos = primaryScene.cameraPosition || { x: 0, y: 1.6, z: 5 };
      startPlayback(experienceId, primaryScene.id, gameConfig, placedObjects, startPos);
    }

    return () => {
      stopPlayback();
    };
  }, [experienceId, primaryScene, gameConfig, placedObjects, startPlayback, stopPlayback]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || isPaused) return;

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
  }, [isPlaying, isPaused, tick]);

  // Handle completion
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete({
        score: playerState.score,
        collectibles: playerState.inventory.length,
        timeElapsed: playerState.elapsedTime,
        objectivesCompleted: Array.from(playerState.objectivesProgress.values()).filter(p => p.completed).length,
        hasWon: playerState.hasWon,
      });
    }
  }, [isComplete, playerState, onComplete]);

  // Handle escape to pause/exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPaused) {
          stopPlayback();
          onExit();
        } else {
          pausePlayback();
          document.exitPointerLock();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, pausePlayback, stopPlayback, onExit]);

  const handleExit = useCallback(() => {
    stopPlayback();
    onExit();
  }, [stopPlayback, onExit]);

  const handleReplay = useCallback(() => {
    resetPlayback();
  }, [resetPlayback]);

  if (!primaryScene) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white text-lg">No scene data available</p>
          <button onClick={onExit} className="mt-4 px-6 py-2 bg-gv-primary-500 text-white rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* 3D Scene */}
      <Canvas camera={{ fov: 75, near: 0.1, far: 1000 }} style={{ position: "absolute", inset: 0 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {primaryScene.splatUrl && (
          <GaussianSplats
            url={primaryScene.splatUrl}
            onLoad={() => setSceneLoading(false)}
            onError={() => setSceneLoading(false)}
          />
        )}

        <PlacedObjectsRenderer objects={placedObjects} />
        <FirstPersonControls enabled={!isPaused && !isComplete && !sceneLoading} />
        <InteractionRuntime enabled={!isPaused && !isComplete} />
        <ClickInteractionHandler objects={placedObjects} enabled={!isPaused && !isComplete} />
        <AudioManager enabled={!isPaused && !isComplete} />
      </Canvas>

      {/* Loading Overlay */}
      {sceneLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-gv-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Loading Experience...</p>
          </div>
        </div>
      )}

      {/* Player HUD */}
      {!sceneLoading && !isComplete && <PlayerHUD gameConfig={gameConfig} />}

      {/* Exit Button */}
      <button
        onClick={handleExit}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="hidden sm:inline">Exit</span>
      </button>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <h1 className="text-lg font-bold text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
          {experienceTitle}
        </h1>
      </div>

      {/* Top Right Controls */}
      {!sceneLoading && !isComplete && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          {/* Pause Button */}
          <button
            onClick={() => {
              if (isPaused) resumePlayback();
              else pausePlayback();
            }}
            className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
          {/* Report Issue Button */}
          <button
            onClick={() => {
              const url = `mailto:support@gameview.io?subject=Issue with "${experienceTitle}"&body=Experience ID: ${experienceId}%0A%0ADescribe the issue:%0A`;
              window.open(url, "_blank");
            }}
            className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-colors"
            title="Report Issue"
          >
            <Flag className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && !isComplete && (
        <PauseOverlay onResume={resumePlayback} onExit={handleExit} />
      )}

      {/* Click to Start Overlay */}
      {!sceneLoading && !isPaused && !isComplete && playerState.elapsedTime < 100 && (
        <ClickToStartOverlay />
      )}

      {/* Completion Overlay */}
      {isComplete && (
        <CompletionOverlay
          experienceId={experienceId}
          hasWon={playerState.hasWon}
          score={playerState.score}
          collectibles={playerState.inventory.length}
          timeElapsed={playerState.elapsedTime}
          gameConfig={gameConfig}
          onReplay={handleReplay}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

// Player HUD
function PlayerHUD({ gameConfig }: { gameConfig: GameConfig }) {
  const score = usePlaybackStore(selectFormattedScore);
  const remainingTime = usePlaybackStore(selectRemainingTime);
  const { playerState } = usePlaybackStore();
  const collectibles = playerState.inventory.length;
  const objectives = gameConfig.objectives;
  const completedObjectives = Array.from(playerState.objectivesProgress.values()).filter(p => p.completed).length;

  return (
    <div className="absolute top-16 left-4 z-40 space-y-2">
      {gameConfig.scoring.enabled && gameConfig.scoring.showInHUD && (
        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
          <Star className="h-5 w-5 text-yellow-400" />
          <span className="text-white font-bold">{score}</span>
        </div>
      )}

      {gameConfig.inventory.enabled && gameConfig.inventory.showInHUD && (
        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
          <Trophy className="h-5 w-5 text-gv-primary-400" />
          <span className="text-white font-bold">{collectibles}</span>
        </div>
      )}

      {gameConfig.showTimer && remainingTime !== null && (
        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
          <Clock className={`h-5 w-5 ${remainingTime < 30000 ? "text-red-400" : "text-green-400"}`} />
          <span className="text-white font-bold font-mono">{formatTime(remainingTime)}</span>
        </div>
      )}

      {objectives.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
          <Target className="h-5 w-5 text-blue-400" />
          <span className="text-white font-bold">{completedObjectives}/{objectives.length}</span>
        </div>
      )}
    </div>
  );
}

// Pause Overlay
function PauseOverlay({ onResume, onExit }: { onResume: () => void; onExit: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
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

// Click to Start Overlay
function ClickToStartOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div className="text-center bg-black/60 backdrop-blur-sm rounded-lg p-6">
        <p className="text-white text-xl font-medium mb-4">Click to start</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-left">
          <div className="text-gv-neutral-400">WASD</div>
          <div className="text-white">Move</div>
          <div className="text-gv-neutral-400">Mouse</div>
          <div className="text-white">Look around</div>
          <div className="text-gv-neutral-400">Click</div>
          <div className="text-white">Interact</div>
          <div className="text-gv-neutral-400">Esc</div>
          <div className="text-white">Pause</div>
        </div>
      </div>
    </div>
  );
}

// Completion Overlay
function CompletionOverlay({
  experienceId,
  hasWon,
  score,
  collectibles,
  timeElapsed,
  gameConfig,
  onReplay,
  onExit,
}: {
  experienceId: string;
  hasWon: boolean;
  score: number;
  collectibles: number;
  timeElapsed: number;
  gameConfig: GameConfig;
  onReplay: () => void;
  onExit: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/experience/${experienceId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="text-center bg-gv-neutral-900 border border-gv-neutral-700 rounded-2xl p-8 max-w-md mx-4">
        <Trophy className={`h-16 w-16 mx-auto mb-4 ${hasWon ? "text-yellow-400" : "text-gv-neutral-500"}`} />
        <h2 className="text-2xl font-bold text-white mb-2">
          {hasWon ? gameConfig.winTitle : gameConfig.failTitle}
        </h2>
        <p className="text-gv-neutral-400 mb-6">
          {hasWon ? gameConfig.winMessage : gameConfig.failMessage}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gv-neutral-800 rounded-lg p-4">
            <Star className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{score.toLocaleString()}</p>
            <p className="text-xs text-gv-neutral-400">Score</p>
          </div>
          <div className="bg-gv-neutral-800 rounded-lg p-4">
            <Trophy className="h-6 w-6 text-gv-primary-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{collectibles}</p>
            <p className="text-xs text-gv-neutral-400">Collected</p>
          </div>
          <div className="bg-gv-neutral-800 rounded-lg p-4">
            <Clock className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{formatTime(timeElapsed)}</p>
            <p className="text-xs text-gv-neutral-400">Time</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onReplay}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            Play Again
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-lg transition-colors"
          >
            <Share2 className="h-5 w-5" />
            {copied ? "Copied!" : "Share"}
          </button>
          <button
            onClick={onExit}
            className="flex-1 px-4 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Placed Objects Renderer
function PlacedObjectsRenderer({ objects }: { objects: PlacedObject[] }) {
  const { playerState } = usePlaybackStore();
  const [hiddenObjects, setHiddenObjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = usePlaybackStore.subscribe((state, prevState) => {
      const newEvents = state.eventLog.slice(prevState.eventLog.length);
      newEvents.forEach(event => {
        if (event.type === 'hide_object') {
          setHiddenObjects(prev => {
            const next = new Set(Array.from(prev));
            next.add(event.objectId);
            return next;
          });
        } else if (event.type === 'show_object') {
          setHiddenObjects(prev => {
            const next = new Set(Array.from(prev));
            next.delete(event.objectId);
            return next;
          });
        }
      });
    });
    return unsubscribe;
  }, []);

  const collectedObjectIds = useMemo(() => {
    return new Set(playerState.inventory.map(item => item.objectId));
  }, [playerState.inventory]);

  return (
    <group>
      {objects.map((object) => {
        if (collectedObjectIds.has(object.instanceId) || hiddenObjects.has(object.instanceId)) {
          return null;
        }
        return <PlaybackObject key={object.instanceId} object={object} />;
      })}
    </group>
  );
}

// Individual Object
function PlaybackObject({ object }: { object: PlacedObject }) {
  const { modelUrl, transform, interactions } = object;
  const hasInteractions = Boolean(interactions && interactions.length > 0 && interactions.some(i => i.enabled));
  const isGLTF = Boolean(modelUrl && (modelUrl.endsWith(".gltf") || modelUrl.endsWith(".glb")));

  return (
    <group
      position={[transform.position.x, transform.position.y, transform.position.z]}
      rotation={[
        THREE.MathUtils.degToRad(transform.rotation.x),
        THREE.MathUtils.degToRad(transform.rotation.y),
        THREE.MathUtils.degToRad(transform.rotation.z),
      ]}
      scale={[transform.scale.x, transform.scale.y, transform.scale.z]}
    >
      {isGLTF ? (
        <Suspense fallback={<PlaceholderMesh hasInteractions={hasInteractions} />}>
          <GLTFModel url={modelUrl} hasInteractions={hasInteractions} />
        </Suspense>
      ) : (
        <PlaceholderMesh hasInteractions={hasInteractions} />
      )}

      {hasInteractions && (
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#ffdd00" transparent opacity={0.1} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

function GLTFModel({ url, hasInteractions }: { url: string; hasInteractions: boolean }) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    if (hasInteractions) {
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.emissive) {
            material.emissive = new THREE.Color(0xffdd00);
            material.emissiveIntensity = 0.05;
          }
        }
      });
    }
    return clone;
  }, [scene, hasInteractions]);

  return <primitive object={clonedScene} />;
}

function PlaceholderMesh({ hasInteractions }: { hasInteractions: boolean }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={hasInteractions ? "#fbbf24" : "#4f46e5"}
        metalness={0.3}
        roughness={0.7}
        emissive={hasInteractions ? "#fbbf24" : "#000000"}
        emissiveIntensity={hasInteractions ? 0.1 : 0}
      />
    </mesh>
  );
}

// First Person Controls
function FirstPersonControls({ enabled }: { enabled: boolean }) {
  const { camera, gl } = useThree();
  const { updatePlayerPosition, updatePlayerRotation, playerState } = usePlaybackStore();

  const keysPressed = useRef<Set<string>>(new Set());
  const isPointerLocked = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === gl.domElement;
    };

    const handleClick = () => {
      if (!isPointerLocked.current) {
        gl.domElement.requestPointerLock();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;

      const { playerState } = usePlaybackStore.getState();
      const sensitivity = 0.1;
      const newRotation = {
        pitch: Math.max(-89, Math.min(89, playerState.rotation.pitch - e.movementY * sensitivity)),
        yaw: (playerState.rotation.yaw + e.movementX * sensitivity) % 360,
      };
      updatePlayerRotation(newRotation);

      // Update camera
      camera.rotation.order = 'YXZ';
      camera.rotation.y = THREE.MathUtils.degToRad(-newRotation.yaw);
      camera.rotation.x = THREE.MathUtils.degToRad(newRotation.pitch);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    gl.domElement.addEventListener("click", handleClick);
    document.addEventListener("mousemove", handleMouseMove);

    // Movement loop
    let lastTime = performance.now();
    let animationId: number;

    const movementLoop = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      if (isPointerLocked.current) {
        const keys = keysPressed.current;
        let forward = 0;
        let strafe = 0;
        let vertical = 0;
        let speed = playerState.movementSpeed;

        if (keys.has("KeyW") || keys.has("ArrowUp")) forward += 1;
        if (keys.has("KeyS") || keys.has("ArrowDown")) forward -= 1;
        if (keys.has("KeyA") || keys.has("ArrowLeft")) strafe -= 1;
        if (keys.has("KeyD") || keys.has("ArrowRight")) strafe += 1;
        if (keys.has("Space") || keys.has("KeyT")) vertical += 1;
        if (keys.has("KeyG")) vertical -= 1;
        if (keys.has("ShiftLeft") || keys.has("ShiftRight")) speed *= 2;

        if (forward !== 0 || strafe !== 0 || vertical !== 0) {
          const { playerState: state } = usePlaybackStore.getState();
          const yawRad = (state.rotation.yaw * Math.PI) / 180;
          const moveX = Math.sin(yawRad) * forward + Math.cos(yawRad) * strafe;
          const moveZ = Math.cos(yawRad) * forward - Math.sin(yawRad) * strafe;

          const newPosition = {
            x: state.position.x + moveX * speed * deltaTime,
            y: state.position.y + vertical * speed * deltaTime,
            z: state.position.z + moveZ * speed * deltaTime,
          };

          updatePlayerPosition(newPosition);
          camera.position.set(newPosition.x, newPosition.y, newPosition.z);
        }
      }

      animationId = requestAnimationFrame(movementLoop);
    };

    animationId = requestAnimationFrame(movementLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      gl.domElement.removeEventListener("click", handleClick);
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [enabled, camera, gl, updatePlayerPosition, updatePlayerRotation, playerState.movementSpeed]);

  // Sync camera position with player state on mount
  useEffect(() => {
    camera.position.set(playerState.position.x, playerState.position.y, playerState.position.z);
  }, [camera, playerState.position]);

  return null;
}

// Interaction Runtime (proximity triggers)
function InteractionRuntime({ enabled }: { enabled: boolean }) {
  const { placedObjects, playerState, triggerInteraction, interactionStates, updateInteractionState } = usePlaybackStore();

  useEffect(() => {
    if (!enabled) return;

    const checkProximityTriggers = () => {
      for (const obj of placedObjects) {
        if (!obj.interactions) continue;

        for (const interaction of obj.interactions) {
          if (!interaction.enabled) continue;
          if (interaction.trigger.type !== "proximity") continue;

          const radius = interaction.trigger.radius ?? 2;
          const objPos = obj.transform.position;
          const distance = Math.sqrt(
            Math.pow(playerState.position.x - objPos.x, 2) +
            Math.pow(playerState.position.y - objPos.y, 2) +
            Math.pow(playerState.position.z - objPos.z, 2)
          );

          const key = `${obj.instanceId}:${interaction.id}`;
          const state = interactionStates.get(key);
          const wasInRange = state?.isInRange ?? false;
          const isInRange = distance <= radius;

          if (isInRange && !wasInRange) {
            triggerInteraction(interaction.id, obj.instanceId);
          }

          if (isInRange !== wasInRange) {
            updateInteractionState(interaction.id, obj.instanceId, { isInRange });
          }
        }
      }
    };

    const intervalId = setInterval(checkProximityTriggers, 100);
    return () => clearInterval(intervalId);
  }, [enabled, placedObjects, playerState.position, triggerInteraction, interactionStates, updateInteractionState]);

  return null;
}

// Click Interaction Handler
function ClickInteractionHandler({ objects, enabled }: { objects: PlacedObject[]; enabled: boolean }) {
  const { camera, raycaster, scene, gl } = useThree();
  const { triggerInteraction } = usePlaybackStore();
  const pointerRef = useRef(new THREE.Vector2());

  const findPlacedObject = useCallback((hit: THREE.Intersection): PlacedObject | null => {
    let current: THREE.Object3D | null = hit.object;
    while (current) {
      for (const placedObject of objects) {
        const pos = placedObject.transform.position;
        const objPos = current.position;
        const tolerance = 0.01;
        if (
          Math.abs(objPos.x - pos.x) < tolerance &&
          Math.abs(objPos.y - pos.y) < tolerance &&
          Math.abs(objPos.z - pos.z) < tolerance
        ) {
          return placedObject;
        }
      }
      current = current.parent;
    }
    return null;
  }, [objects]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (document.pointerLockElement !== gl.domElement) return;

      // In pointer lock mode, use center of screen
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;

      raycaster.setFromCamera(pointerRef.current, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length === 0) return;

      const placedObject = findPlacedObject(intersects[0]);

      if (placedObject?.interactions) {
        for (const interaction of placedObject.interactions) {
          if (interaction.enabled && interaction.trigger.type === "click") {
            triggerInteraction(interaction.id, placedObject.instanceId);
          }
        }
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [enabled, objects, camera, raycaster, scene, gl, triggerInteraction, findPlacedObject]);

  return null;
}

// Audio Manager
function AudioManager({ enabled }: { enabled: boolean }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
    };

    window.addEventListener("click", initAudio, { once: true });
    return () => window.removeEventListener("click", initAudio);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const playAudio = async (url: string) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      try {
        let buffer = audioBuffersRef.current.get(url);
        if (!buffer) {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          buffer = await ctx.decodeAudioData(arrayBuffer);
          audioBuffersRef.current.set(url, buffer);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (error) {
        console.error("Failed to play audio:", url, error);
      }
    };

    const unsubscribe = usePlaybackStore.subscribe((state, prevState) => {
      const newEvents = state.eventLog.slice(prevState.eventLog.length);
      newEvents.forEach(event => {
        if (event.type === "sound_played" && event.audioUrl) {
          playAudio(event.audioUrl);
        }
      });
    });

    return unsubscribe;
  }, [enabled]);

  return null;
}
