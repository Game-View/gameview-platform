/**
 * Navigation Store - Manages scene navigation and transitions
 */

import { create } from "zustand";
import type {
  PortalConfig,
  SpawnPoint,
  SceneData,
  TransitionState,
  TransitionEffect,
  PreservedState,
  NavigationEvent,
} from "@/lib/scene-navigation";
import {
  initialTransitionState,
  isInPortalZone,
  getDistanceToPortal,
  getNearestPortal,
  getDefaultSpawn,
  extractPreservedState,
} from "@/lib/scene-navigation";

// ============================================
// STORE STATE
// ============================================

interface NavigationState {
  // Current scene
  currentSceneId: string | null;
  currentScene: SceneData | null;

  // Available scenes
  scenes: Map<string, SceneData>;

  // Portal state
  nearbyPortal: PortalConfig | null;
  portalDistance: number;
  isInPortalZone: boolean;

  // Transition state
  transition: TransitionState;
  isTransitioning: boolean;

  // State preservation
  preservedState: PreservedState | null;

  // Event log
  events: NavigationEvent[];

  // Settings
  interactionKey: string; // Default "e"
  autoEnterPortals: boolean; // For "enter" type portals
}

interface NavigationActions {
  // Scene management
  registerScene: (scene: SceneData) => void;
  unregisterScene: (sceneId: string) => void;
  setCurrentScene: (sceneId: string) => void;
  loadScenes: (scenes: SceneData[]) => void;

  // Portal detection (called every frame)
  updatePlayerPosition: (position: { x: number; y: number; z: number }) => void;

  // Portal interaction
  attemptPortalEntry: () => boolean;
  unlockPortal: (portalId: string) => void;
  lockPortal: (portalId: string) => void;

  // Transitions
  startTransition: (
    toSceneId: string,
    toSpawnId: string,
    effect?: TransitionEffect
  ) => void;
  updateTransitionProgress: (progress: number) => void;
  setTransitionPhase: (phase: TransitionState["phase"]) => void;
  completeTransition: () => void;
  cancelTransition: () => void;

  // State preservation
  preserveState: (playerState: Parameters<typeof extractPreservedState>[0]) => void;
  getPreservedState: () => PreservedState | null;
  clearPreservedState: () => void;

  // Spawn points
  getSpawnPoint: (sceneId: string, spawnId?: string) => SpawnPoint | null;

  // Events
  logEvent: (event: NavigationEvent) => void;
  clearEvents: () => void;

  // Reset
  reset: () => void;
}

type NavigationStore = NavigationState & NavigationActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: NavigationState = {
  currentSceneId: null,
  currentScene: null,
  scenes: new Map(),
  nearbyPortal: null,
  portalDistance: Infinity,
  isInPortalZone: false,
  transition: initialTransitionState,
  isTransitioning: false,
  preservedState: null,
  events: [],
  interactionKey: "e",
  autoEnterPortals: true,
};

// ============================================
// STORE
// ============================================

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  ...initialState,

  // Scene management
  registerScene: (scene) => {
    set((state) => {
      const newScenes = new Map(state.scenes);
      newScenes.set(scene.id, scene);
      return { scenes: newScenes };
    });
  },

  unregisterScene: (sceneId) => {
    set((state) => {
      const newScenes = new Map(state.scenes);
      newScenes.delete(sceneId);
      return { scenes: newScenes };
    });
  },

  setCurrentScene: (sceneId) => {
    const { scenes } = get();
    const scene = scenes.get(sceneId);
    set({
      currentSceneId: sceneId,
      currentScene: scene ?? null,
      nearbyPortal: null,
      portalDistance: Infinity,
      isInPortalZone: false,
    });
  },

  loadScenes: (scenesArray) => {
    const scenesMap = new Map<string, SceneData>();
    for (const scene of scenesArray) {
      scenesMap.set(scene.id, scene);
    }
    set({ scenes: scenesMap });
  },

  // Portal detection
  updatePlayerPosition: (position) => {
    const { currentScene, isTransitioning, autoEnterPortals } = get();
    if (!currentScene || isTransitioning) return;

    const portals = currentScene.portals.filter((p) => p.enabled && !p.locked);

    // Find nearest portal
    const nearbyPortal = getNearestPortal(position, portals, 5);

    if (!nearbyPortal) {
      set({
        nearbyPortal: null,
        portalDistance: Infinity,
        isInPortalZone: false,
      });
      return;
    }

    const distance = getDistanceToPortal(position, nearbyPortal);
    const inZone = isInPortalZone(position, nearbyPortal);

    // Check if we just entered a portal zone
    const wasInZone = get().isInPortalZone;
    const wasNearby = get().nearbyPortal?.id;

    set({
      nearbyPortal,
      portalDistance: distance,
      isInPortalZone: inZone,
    });

    // Log approach event
    if (nearbyPortal.id !== wasNearby && distance < 3) {
      get().logEvent({
        type: "portal_approached",
        portalId: nearbyPortal.id,
        distance,
      });
    }

    // Auto-enter for "enter" type portals
    if (
      inZone &&
      !wasInZone &&
      autoEnterPortals &&
      nearbyPortal.triggerType === "enter"
    ) {
      get().attemptPortalEntry();
    }
  },

  // Portal interaction
  attemptPortalEntry: () => {
    const { nearbyPortal, currentSceneId, isTransitioning, scenes } = get();

    if (!nearbyPortal || !currentSceneId || isTransitioning) {
      return false;
    }

    // Check if portal is locked
    if (nearbyPortal.locked) {
      get().logEvent({
        type: "portal_locked",
        portalId: nearbyPortal.id,
        message: nearbyPortal.lockedMessage,
      });
      return false;
    }

    // Check if destination scene exists
    const destinationScene = scenes.get(nearbyPortal.destinationSceneId);
    if (!destinationScene) {
      console.warn(`Destination scene not found: ${nearbyPortal.destinationSceneId}`);
      return false;
    }

    // Log entry event
    get().logEvent({
      type: "portal_entered",
      portalId: nearbyPortal.id,
    });

    // Start transition
    get().startTransition(
      nearbyPortal.destinationSceneId,
      nearbyPortal.destinationSpawnId,
      nearbyPortal.transitionEffect
    );

    return true;
  },

  unlockPortal: (portalId) => {
    const { currentScene } = get();
    if (!currentScene) return;

    const portal = currentScene.portals.find((p) => p.id === portalId);
    if (portal) {
      portal.locked = false;
      get().logEvent({
        type: "portal_unlocked",
        portalId,
      });
    }
  },

  lockPortal: (portalId) => {
    const { currentScene } = get();
    if (!currentScene) return;

    const portal = currentScene.portals.find((p) => p.id === portalId);
    if (portal) {
      portal.locked = true;
    }
  },

  // Transitions (duration param reserved for future animation timing)
  startTransition: (toSceneId, toSpawnId, effect = "fade") => {
    const { currentSceneId } = get();

    set({
      isTransitioning: true,
      transition: {
        phase: "fade_out",
        progress: 0,
        fromSceneId: currentSceneId,
        toSceneId,
        toSpawnId,
        effect,
        color: "#000000",
      },
    });

    get().logEvent({
      type: "transition_started",
      fromSceneId: currentSceneId ?? "",
      toSceneId,
    });
  },

  updateTransitionProgress: (progress) => {
    set((state) => ({
      transition: { ...state.transition, progress },
    }));
  },

  setTransitionPhase: (phase) => {
    const { transition } = get();

    set({
      transition: { ...transition, phase, progress: 0 },
    });

    if (phase === "loading" && transition.toSceneId) {
      get().logEvent({
        type: "scene_loading",
        sceneId: transition.toSceneId,
      });
    }
  },

  completeTransition: () => {
    const { transition } = get();

    if (transition.toSceneId) {
      get().setCurrentScene(transition.toSceneId);

      get().logEvent({
        type: "scene_loaded",
        sceneId: transition.toSceneId,
      });

      get().logEvent({
        type: "transition_completed",
        sceneId: transition.toSceneId,
        spawnId: transition.toSpawnId ?? "default",
      });
    }

    set({
      isTransitioning: false,
      transition: initialTransitionState,
    });
  },

  cancelTransition: () => {
    set({
      isTransitioning: false,
      transition: initialTransitionState,
    });
  },

  // State preservation
  preserveState: (playerState) => {
    const preserved = extractPreservedState(playerState);
    set({ preservedState: preserved });
  },

  getPreservedState: () => {
    return get().preservedState;
  },

  clearPreservedState: () => {
    set({ preservedState: null });
  },

  // Spawn points
  getSpawnPoint: (sceneId, spawnId) => {
    const { scenes } = get();
    const scene = scenes.get(sceneId);
    if (!scene) return null;

    if (spawnId) {
      return scene.spawnPoints.find((sp) => sp.id === spawnId) ?? null;
    }

    return getDefaultSpawn(scene.spawnPoints);
  },

  // Events
  logEvent: (event) => {
    set((state) => ({
      events: [...state.events.slice(-99), event],
    }));
  },

  clearEvents: () => {
    set({ events: [] });
  },

  // Reset
  reset: () => {
    set(initialState);
  },
}));

// ============================================
// SELECTORS
// ============================================

export const selectCurrentScene = (state: NavigationStore) => state.currentScene;
export const selectNearbyPortal = (state: NavigationStore) => state.nearbyPortal;
export const selectIsTransitioning = (state: NavigationStore) => state.isTransitioning;
export const selectTransitionState = (state: NavigationStore) => state.transition;
export const selectPortalDistance = (state: NavigationStore) => state.portalDistance;

export const selectCanEnterPortal = (state: NavigationStore) => {
  const { nearbyPortal, isInPortalZone, isTransitioning } = state;
  if (!nearbyPortal || isTransitioning) return false;
  if (nearbyPortal.locked) return false;

  if (nearbyPortal.triggerType === "enter") {
    return isInPortalZone;
  }

  return state.portalDistance < 2; // Close enough to interact
};

export const selectShowPortalPrompt = (state: NavigationStore) => {
  const { nearbyPortal, portalDistance, isTransitioning } = state;
  return nearbyPortal !== null && portalDistance < 3 && !isTransitioning;
};
