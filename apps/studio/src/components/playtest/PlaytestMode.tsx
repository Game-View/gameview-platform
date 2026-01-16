"use client";

import { useEffect, useCallback, useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import { Loader2, X, Play } from "lucide-react";
import * as THREE from "three";
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

        {/* Click Interaction Handler */}
        <ClickInteractionHandler objects={placedObjects} enabled={!isPaused} />

        {/* Audio Manager */}
        <AudioManager enabled={!isPaused} />

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

// Placed objects renderer with actual GLTF models
function PlacedObjectsRenderer({
  objects,
  showLabels,
}: {
  objects: PlacedObject[];
  showLabels: boolean;
}) {
  const { playerState, interactionStates } = usePlaytestStore();
  const [hiddenObjects, setHiddenObjects] = useState<Set<string>>(new Set());

  // Listen for show/hide events
  useEffect(() => {
    const unsubscribe = usePlaytestStore.subscribe((state, prevState) => {
      // Check for show_object and hide_object events in the event log
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

  // Get collected object IDs to hide them
  const collectedObjectIds = useMemo(() => {
    return new Set(playerState.inventory.map(item => item.objectId));
  }, [playerState.inventory]);

  return (
    <group>
      {objects.map((object) => {
        // Don't render collected or hidden objects
        if (collectedObjectIds.has(object.instanceId) || hiddenObjects.has(object.instanceId)) {
          return null;
        }

        return (
          <PlaytestObject
            key={object.instanceId}
            object={object}
            showLabel={showLabels}
          />
        );
      })}
    </group>
  );
}

// Individual object renderer with GLTF loading
function PlaytestObject({
  object,
  showLabel,
}: {
  object: PlacedObject;
  showLabel: boolean;
}) {
  const { modelUrl, transform, name, interactions } = object;

  // Check if it has interactive triggers
  const hasInteractions = Boolean(interactions && interactions.length > 0 && interactions.some(i => i.enabled));

  // Check if it's a real GLTF model
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

      {/* Label */}
      {showLabel && (
        <Html
          position={[0, 1.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white whitespace-nowrap">
            {name}
            {hasInteractions && <span className="ml-1 text-yellow-400">⚡</span>}
          </div>
        </Html>
      )}

      {/* Interactive indicator (subtle glow for interactive objects) */}
      {hasInteractions && (
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial
            color="#ffdd00"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

// GLTF model loader for playtest
function GLTFModel({ url, hasInteractions }: { url: string; hasInteractions: boolean }) {
  const { scene } = useGLTF(url);

  // Clone the scene to avoid sharing materials between instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone();

    // If interactive, add subtle emissive glow
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

// Placeholder mesh for objects without GLTF models
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

// Click and hover interaction handler using raycasting
function ClickInteractionHandler({
  objects,
  enabled,
}: {
  objects: PlacedObject[];
  enabled: boolean;
}) {
  const { camera, raycaster, scene, gl } = useThree();
  const { triggerInteraction } = usePlaytestStore();
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const pointerRef = useRef(new THREE.Vector2());

  // Helper function to find placed object from intersection
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

  // Check if object has click interactions
  const hasClickInteraction = useCallback((obj: PlacedObject): boolean => {
    return Boolean(
      obj.interactions?.some(i => i.enabled && i.trigger.type === "click")
    );
  }, []);

  // Handle mouse move for hover detection
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (event: MouseEvent) => {
      // Calculate pointer position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update raycaster
      raycaster.setFromCamera(pointerRef.current, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length === 0) {
        if (hoveredObjectId) {
          setHoveredObjectId(null);
          document.body.style.cursor = "default";
        }
        return;
      }

      // Find placed object
      const placedObject = findPlacedObject(intersects[0]);

      if (placedObject && hasClickInteraction(placedObject)) {
        if (hoveredObjectId !== placedObject.instanceId) {
          setHoveredObjectId(placedObject.instanceId);
          document.body.style.cursor = "pointer";
        }
      } else {
        if (hoveredObjectId) {
          setHoveredObjectId(null);
          document.body.style.cursor = "default";
        }
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) return;

      // Calculate pointer position
      const rect = gl.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

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

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      document.body.style.cursor = "default";
    };
  }, [enabled, objects, camera, raycaster, scene, gl, triggerInteraction, hoveredObjectId, findPlacedObject, hasClickInteraction]);

  return null;
}

// Audio manager for playtest sounds
function AudioManager({ enabled }: { enabled: boolean }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
    };

    window.addEventListener("click", initAudio, { once: true });
    return () => window.removeEventListener("click", initAudio);
  }, []);

  // Listen for sound_played events
  useEffect(() => {
    if (!enabled) return;

    const handleEvent = (event: { type: string; audioUrl?: string }) => {
      if (event.type !== "sound_played" || !event.audioUrl) return;

      const audioUrl = event.audioUrl;

      // Try to play the audio
      playAudio(audioUrl);
    };

    const playAudio = async (url: string) => {
      // Ensure audio context exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // Resume context if suspended
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      try {
        // Check cache first
        let buffer = audioBuffersRef.current.get(url);

        if (!buffer) {
          // Fetch and decode audio
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          buffer = await ctx.decodeAudioData(arrayBuffer);
          audioBuffersRef.current.set(url, buffer);
        }

        // Play the audio
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (error) {
        console.error("Failed to play audio:", url, error);
      }
    };

    // Subscribe to playtest store events
    const unsubscribe = usePlaytestStore.subscribe((state, prevState) => {
      const newEvents = state.eventLog.slice(prevState.eventLog.length);
      newEvents.forEach(handleEvent);
    });

    return unsubscribe;
  }, [enabled]);

  return null;
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
