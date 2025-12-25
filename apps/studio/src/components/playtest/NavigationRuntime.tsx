"use client";

import { useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { usePlaytestStore } from "@/stores/playtest-store";
import {
  useNavigationStore,
  selectNearbyPortal,
  selectShowPortalPrompt,
  selectTransitionState,
  selectIsTransitioning,
} from "@/stores/navigation-store";
import { PortalsRenderer } from "./PortalVisuals";
import { SceneTransitionOverlay, PortalPrompt } from "./SceneTransition";
import type { PortalConfig, SpawnPoint, SceneData } from "@/lib/scene-navigation";

interface NavigationRuntimeProps {
  enabled?: boolean;
  currentSceneId: string;
  portals: PortalConfig[];
  spawnPoints: SpawnPoint[];
  availableScenes: SceneData[];
}

/**
 * Handles portal detection and scene navigation during playtest
 */
export function NavigationRuntime({
  enabled = true,
  currentSceneId,
  portals,
  spawnPoints,
  availableScenes,
}: NavigationRuntimeProps) {
  const { playerState } = usePlaytestStore();
  const {
    loadScenes,
    setCurrentScene,
    updatePlayerPosition,
    attemptPortalEntry,
  } = useNavigationStore();

  // Initialize navigation store with scenes
  useEffect(() => {
    if (!enabled) return;

    // Load all available scenes
    loadScenes(
      availableScenes.map((scene) => ({
        ...scene,
        portals: scene.id === currentSceneId ? portals : scene.portals ?? [],
        spawnPoints: scene.id === currentSceneId ? spawnPoints : scene.spawnPoints ?? [],
      }))
    );

    // Set current scene
    setCurrentScene(currentSceneId);
  }, [enabled, currentSceneId, portals, spawnPoints, availableScenes, loadScenes, setCurrentScene]);

  // Update player position each frame
  useFrame(() => {
    if (!enabled) return;
    updatePlayerPosition(playerState.position);
  });

  // Handle E key for interact portals
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        const { nearbyPortal } = useNavigationStore.getState();
        if (nearbyPortal?.triggerType === "interact") {
          attemptPortalEntry();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, attemptPortalEntry]);

  // Render portals in 3D
  return (
    <PortalsRenderer
      portals={portals.filter((p) => p.enabled)}
      playerPosition={playerState.position}
    />
  );
}

/**
 * HUD overlay for navigation (portal prompts, transitions)
 */
export function NavigationHUD({ enabled = true }: { enabled?: boolean }) {
  const nearbyPortal = useNavigationStore(selectNearbyPortal);
  const showPrompt = useNavigationStore(selectShowPortalPrompt);
  const transitionState = useNavigationStore(selectTransitionState);
  const isTransitioning = useNavigationStore(selectIsTransitioning);
  const { completeTransition } = useNavigationStore();

  if (!enabled) return null;

  return (
    <>
      {/* Portal Prompt */}
      {showPrompt && nearbyPortal && (
        <PortalPrompt
          portalName={nearbyPortal.name}
          triggerType={nearbyPortal.triggerType}
          isLocked={nearbyPortal.locked}
          lockedMessage={nearbyPortal.lockedMessage}
          enterPrompt={nearbyPortal.enterPrompt}
          visible={true}
        />
      )}

      {/* Transition Overlay */}
      {isTransitioning && (
        <SceneTransitionOverlay
          state={transitionState}
          onTransitionComplete={completeTransition}
        />
      )}
    </>
  );
}

/**
 * Scene loader callback for navigation transitions
 */
export function useSceneLoader(
  loadScene: (sceneId: string) => Promise<SceneData | null>
) {
  const {
    setTransitionPhase,
    completeTransition,
    updateTransitionProgress,
  } = useNavigationStore();

  const handleSceneTransition = useCallback(
    async (sceneId: string) => {
      // Animate fade out
      const fadeOutDuration = 250;
      const startTime = performance.now();

      const animateFadeOut = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / fadeOutDuration);
        updateTransitionProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animateFadeOut);
        } else {
          startLoading();
        }
      };

      const startLoading = async () => {
        setTransitionPhase("loading");

        try {
          // Load the scene data
          const sceneData = await loadScene(sceneId);

          if (sceneData) {
            // Animate fade in
            setTransitionPhase("fade_in");
            const fadeInStart = performance.now();

            const animateFadeIn = () => {
              const elapsed = performance.now() - fadeInStart;
              const progress = Math.min(1, elapsed / fadeOutDuration);
              updateTransitionProgress(progress);

              if (progress < 1) {
                requestAnimationFrame(animateFadeIn);
              } else {
                completeTransition();
              }
            };

            requestAnimationFrame(animateFadeIn);
          }
        } catch (error) {
          console.error("Failed to load scene:", error);
          completeTransition();
        }
      };

      requestAnimationFrame(animateFadeOut);
    },
    [loadScene, setTransitionPhase, updateTransitionProgress, completeTransition]
  );

  return handleSceneTransition;
}

/**
 * Hook to handle portal unlocking via items
 */
export function usePortalKeys() {
  const { playerState } = usePlaytestStore();
  const { unlockPortal, currentScene } = useNavigationStore();

  useEffect(() => {
    if (!currentScene) return;

    // Check each locked portal that requires a key
    for (const portal of currentScene.portals) {
      if (
        portal.locked &&
        portal.triggerType === "key_required" &&
        portal.requiredKeyId
      ) {
        // Check if player has the key
        const hasKey = playerState.inventory.some(
          (item) => item.itemId === portal.requiredKeyId
        );

        if (hasKey) {
          unlockPortal(portal.id);
        }
      }
    }
  }, [playerState.inventory, currentScene, unlockPortal]);
}

/**
 * Spawn point selection when entering a scene
 */
export function useSpawnPosition(sceneId: string, spawnId?: string) {
  const { getSpawnPoint } = useNavigationStore();
  const { updatePlayerPosition, updatePlayerRotation } = usePlaytestStore();

  useEffect(() => {
    const spawn = getSpawnPoint(sceneId, spawnId);
    if (spawn) {
      updatePlayerPosition(spawn.position);
      updatePlayerRotation(spawn.rotation);
    }
  }, [sceneId, spawnId, getSpawnPoint, updatePlayerPosition, updatePlayerRotation]);
}
