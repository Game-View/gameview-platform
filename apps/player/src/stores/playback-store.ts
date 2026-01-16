/**
 * Playback Store - Zustand store for interactive experience playback
 *
 * Simplified version for player app - no debug features
 */

import { create } from "zustand";
import {
  type PlayerState,
  type PlayerPosition,
  type PlayerRotation,
  type CollectedItem,
  type InteractionState,
  type RuntimeEvent,
  type RuntimeEventHandler,
  type GameConfig,
  type PlacedObject,
  type ActionConfig,
  createDefaultPlayerState,
  checkWinConditions,
  checkFailConditions,
  movePlayer,
  formatScore,
  formatTime,
} from "@/lib/player-runtime";

// ============================================
// STORE STATE
// ============================================

interface PlaybackState {
  // Mode
  isPlaying: boolean;
  isPaused: boolean;
  isComplete: boolean;

  // Experience data
  experienceId: string | null;
  currentSceneId: string | null;
  gameConfig: GameConfig | null;
  placedObjects: PlacedObject[];

  // Player state
  playerState: PlayerState;
  interactionStates: Map<string, InteractionState>;

  // Event handling
  eventLog: RuntimeEvent[];
  eventHandlers: Set<RuntimeEventHandler>;

  // UI State
  activeMessage: { title?: string; message: string; style: string } | null;
  showInventory: boolean;
  showObjectives: boolean;
}

interface PlaybackActions {
  // Mode control
  startPlayback: (
    experienceId: string,
    sceneId: string,
    gameConfig: GameConfig,
    placedObjects: PlacedObject[],
    startPosition?: PlayerPosition
  ) => void;
  stopPlayback: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  resetPlayback: () => void;
  completePlayback: () => void;

  // Player movement
  updatePlayerPosition: (position: PlayerPosition) => void;
  updatePlayerRotation: (rotation: PlayerRotation) => void;
  movePlayerBy: (forward: number, strafe: number, deltaTime: number) => void;
  teleportPlayer: (destination: PlayerPosition) => void;

  // Game state
  addScore: (points: number) => void;
  setScore: (score: number) => void;
  collectItem: (item: CollectedItem) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  completeObjective: (objectiveId: string) => void;
  setVariable: (name: string, value: string | number | boolean) => void;
  getVariable: (name: string) => string | number | boolean | undefined;

  // Interactions
  triggerInteraction: (interactionId: string, objectId: string) => void;
  executeActions: (actions: ActionConfig[], objectId: string) => void;
  updateInteractionState: (
    interactionId: string,
    objectId: string,
    updates: Partial<InteractionState>
  ) => void;

  // Events
  emitEvent: (event: RuntimeEvent) => void;
  addEventHandler: (handler: RuntimeEventHandler) => void;
  removeEventHandler: (handler: RuntimeEventHandler) => void;

  // Messages
  showMessage: (title: string | undefined, message: string, style: string, duration: number) => void;
  hideMessage: () => void;

  // Tick (called each frame)
  tick: (deltaTime: number) => void;

  // UI
  toggleInventory: () => void;
  toggleObjectives: () => void;
}

type PlaybackStore = PlaybackState & PlaybackActions;

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  // Initial state
  isPlaying: false,
  isPaused: false,
  isComplete: false,
  experienceId: null,
  currentSceneId: null,
  gameConfig: null,
  placedObjects: [],
  playerState: createDefaultPlayerState(),
  interactionStates: new Map(),
  eventLog: [],
  eventHandlers: new Set(),
  activeMessage: null,
  showInventory: false,
  showObjectives: false,

  // Mode control
  startPlayback: (experienceId, sceneId, gameConfig, placedObjects, startPosition) => {
    set({
      isPlaying: true,
      isPaused: false,
      isComplete: false,
      experienceId,
      currentSceneId: sceneId,
      gameConfig,
      placedObjects,
      playerState: createDefaultPlayerState(startPosition, gameConfig),
      interactionStates: new Map(),
      eventLog: [],
      activeMessage: null,
      showInventory: false,
      showObjectives: false,
    });
  },

  stopPlayback: () => {
    set({
      isPlaying: false,
      isPaused: false,
      isComplete: false,
      experienceId: null,
      currentSceneId: null,
      gameConfig: null,
      placedObjects: [],
      playerState: createDefaultPlayerState(),
      interactionStates: new Map(),
      eventLog: [],
      activeMessage: null,
    });
  },

  pausePlayback: () => set({ isPaused: true }),
  resumePlayback: () => set({ isPaused: false }),
  completePlayback: () => set({ isComplete: true, isPaused: true }),

  resetPlayback: () => {
    const { experienceId, currentSceneId, gameConfig, placedObjects } = get();
    if (experienceId && currentSceneId && gameConfig) {
      get().startPlayback(experienceId, currentSceneId, gameConfig, placedObjects);
    }
  },

  // Player movement
  updatePlayerPosition: (position) => {
    set((state) => ({
      playerState: { ...state.playerState, position },
    }));
  },

  updatePlayerRotation: (rotation) => {
    set((state) => ({
      playerState: { ...state.playerState, rotation },
    }));
  },

  movePlayerBy: (forward, strafe, deltaTime) => {
    const { playerState } = get();
    const newPosition = movePlayer(
      playerState.position,
      playerState.rotation,
      forward,
      strafe,
      deltaTime,
      playerState.movementSpeed
    );
    set({
      playerState: {
        ...playerState,
        position: newPosition,
        isMoving: forward !== 0 || strafe !== 0,
      },
    });
  },

  teleportPlayer: (destination) => {
    set((state) => ({
      playerState: { ...state.playerState, position: destination },
    }));
    get().emitEvent({ type: "teleported", destination });
  },

  // Game state
  addScore: (points) => {
    const { playerState, gameConfig } = get();
    const oldScore = playerState.score;
    let newScore = oldScore + points;

    if (!gameConfig?.scoring.allowNegative && newScore < 0) {
      newScore = 0;
    }

    set({
      playerState: { ...playerState, score: newScore },
    });

    get().emitEvent({
      type: "score_changed",
      oldScore,
      newScore,
      delta: points,
    });
  },

  setScore: (score) => {
    set((state) => ({
      playerState: { ...state.playerState, score },
    }));
  },

  collectItem: (item) => {
    set((state) => {
      const inventory = [...state.playerState.inventory];
      const existingIndex = inventory.findIndex((i) => i.itemId === item.itemId);

      if (existingIndex >= 0) {
        inventory[existingIndex] = {
          ...inventory[existingIndex],
          quantity: inventory[existingIndex].quantity + item.quantity,
        };
      } else {
        inventory.push(item);
      }

      return {
        playerState: { ...state.playerState, inventory },
      };
    });

    get().emitEvent({ type: "item_collected", item });
  },

  removeItem: (itemId, quantity = 1) => {
    set((state) => {
      const inventory = state.playerState.inventory
        .map((item) => {
          if (item.itemId === itemId) {
            return { ...item, quantity: item.quantity - quantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      return {
        playerState: { ...state.playerState, inventory },
      };
    });

    get().emitEvent({ type: "item_removed", itemId });
  },

  completeObjective: (objectiveId) => {
    set((state) => {
      const progress = new Map(state.playerState.objectivesProgress);
      progress.set(objectiveId, {
        objectiveId,
        completed: true,
        progress: 100,
        completedAt: Date.now(),
      });

      return {
        playerState: { ...state.playerState, objectivesProgress: progress },
      };
    });

    get().emitEvent({ type: "objective_completed", objectiveId });
  },

  setVariable: (name, value) => {
    set((state) => {
      const variables = new Map(state.playerState.variables);
      variables.set(name, value);
      return {
        playerState: { ...state.playerState, variables },
      };
    });

    get().emitEvent({ type: "variable_changed", name, value });
  },

  getVariable: (name) => {
    return get().playerState.variables.get(name);
  },

  // Interactions
  triggerInteraction: (interactionId, objectId) => {
    const { interactionStates, placedObjects } = get();
    const key = `${objectId}:${interactionId}`;
    const state = interactionStates.get(key);

    if (state?.isOnCooldown) return;

    const object = placedObjects.find((o) => o.instanceId === objectId);
    const interaction = object?.interactions?.find((i) => i.id === interactionId);

    if (!interaction || !interaction.enabled) return;

    if (interaction.maxTriggers && state && state.triggerCount >= interaction.maxTriggers) {
      return;
    }

    get().executeActions(interaction.actions, objectId);

    const newState: InteractionState = {
      interactionId,
      objectId,
      triggerCount: (state?.triggerCount ?? 0) + 1,
      lastTriggeredAt: Date.now(),
      isOnCooldown: !!interaction.cooldown,
      isInRange: true,
    };

    const newStates = new Map(interactionStates);
    newStates.set(key, newState);
    set({ interactionStates: newStates });

    if (interaction.cooldown) {
      setTimeout(() => {
        const states = get().interactionStates;
        const s = states.get(key);
        if (s) {
          const updated = new Map(states);
          updated.set(key, { ...s, isOnCooldown: false });
          set({ interactionStates: updated });
        }
      }, interaction.cooldown);
    }

    get().emitEvent({ type: "interaction_triggered", interactionId, objectId });
  },

  executeActions: (actions, objectId) => {
    for (const action of actions) {
      switch (action.type) {
        case "play_sound":
          get().emitEvent({ type: "sound_played", audioUrl: action.audioUrl as string });
          break;

        case "show_message":
          get().showMessage(
            action.title as string | undefined,
            action.message as string,
            action.style as string,
            action.duration as number
          );
          break;

        case "add_score":
          get().addScore(action.points as number);
          break;

        case "add_inventory":
          get().collectItem({
            itemId: action.itemId as string,
            objectId,
            name: action.itemName as string,
            quantity: (action.quantity as number) ?? 1,
            collectedAt: Date.now(),
          });
          break;

        case "teleport":
          get().teleportPlayer(action.destination as PlayerPosition);
          break;

        case "change_scene":
          get().emitEvent({ type: "scene_changed", sceneId: action.sceneId as string });
          break;

        case "set_variable": {
          const currentVal = get().getVariable(action.variableName as string);
          let newVal: string | number | boolean = action.value as string | number | boolean;

          if (action.operation === "add" && typeof currentVal === "number") {
            newVal = currentVal + Number(action.value);
          } else if (action.operation === "subtract" && typeof currentVal === "number") {
            newVal = currentVal - Number(action.value);
          } else if (action.operation === "toggle" && typeof currentVal === "boolean") {
            newVal = !currentVal;
          }

          get().setVariable(action.variableName as string, newVal);
          break;
        }

        case "complete_objective":
          get().completeObjective(action.objectiveId as string);
          break;

        case "show_object":
          get().emitEvent({ type: "show_object", objectId: action.targetObjectId as string });
          break;

        case "hide_object":
          get().emitEvent({ type: "hide_object", objectId: action.targetObjectId as string });
          break;
      }
    }
  },

  updateInteractionState: (interactionId, objectId, updates) => {
    const key = `${objectId}:${interactionId}`;
    set((state) => {
      const newStates = new Map(state.interactionStates);
      const current = newStates.get(key) || {
        interactionId,
        objectId,
        triggerCount: 0,
        lastTriggeredAt: null,
        isOnCooldown: false,
        isInRange: false,
      };
      newStates.set(key, { ...current, ...updates });
      return { interactionStates: newStates };
    });
  },

  // Events
  emitEvent: (event) => {
    set((state) => ({
      eventLog: [...state.eventLog.slice(-99), event],
    }));

    get().eventHandlers.forEach((handler) => handler(event));
  },

  addEventHandler: (handler) => {
    set((state) => {
      const handlers = new Set(state.eventHandlers);
      handlers.add(handler);
      return { eventHandlers: handlers };
    });
  },

  removeEventHandler: (handler) => {
    set((state) => {
      const handlers = new Set(state.eventHandlers);
      handlers.delete(handler);
      return { eventHandlers: handlers };
    });
  },

  // Messages
  showMessage: (title, message, style, duration) => {
    set({ activeMessage: { title, message, style } });

    get().emitEvent({ type: "message_shown", title, message });

    if (duration > 0) {
      setTimeout(() => {
        get().hideMessage();
      }, duration);
    }
  },

  hideMessage: () => {
    set({ activeMessage: null });
  },

  // Tick
  tick: (deltaTime) => {
    const { isPaused, isComplete, playerState, gameConfig } = get();
    if (isPaused || isComplete || !gameConfig) return;

    const newElapsed = playerState.elapsedTime + deltaTime * 1000;

    const winMet = checkWinConditions(
      { ...playerState, elapsedTime: newElapsed },
      gameConfig
    );
    const allRequiredWinMet = gameConfig.winConditions
      .filter((c) => c.enabled && c.required)
      .every((c) => winMet.includes(c.id));

    const failMet = checkFailConditions(
      { ...playerState, elapsedTime: newElapsed },
      gameConfig
    );

    set({
      playerState: {
        ...playerState,
        elapsedTime: newElapsed,
        winConditionsMet: winMet,
        failConditionsMet: failMet,
        hasWon: allRequiredWinMet && winMet.length > 0,
        hasFailed: failMet.length > 0,
      },
    });

    const prevWinMet = playerState.winConditionsMet;
    const prevFailMet = playerState.failConditionsMet;

    winMet.forEach((id) => {
      if (!prevWinMet.includes(id)) {
        get().emitEvent({ type: "win_condition_met", conditionId: id });
      }
    });

    failMet.forEach((id) => {
      if (!prevFailMet.includes(id)) {
        get().emitEvent({ type: "fail_condition_met", conditionId: id });
      }
    });

    if (allRequiredWinMet && winMet.length > 0 && !playerState.hasWon) {
      get().emitEvent({ type: "game_won" });
      get().completePlayback();
    }

    if (failMet.length > 0 && !playerState.hasFailed) {
      get().emitEvent({ type: "game_failed" });
      get().completePlayback();
    }
  },

  // UI
  toggleInventory: () => set((state) => ({ showInventory: !state.showInventory })),
  toggleObjectives: () => set((state) => ({ showObjectives: !state.showObjectives })),
}));

// ============================================
// SELECTORS
// ============================================

export const selectFormattedScore = (state: PlaybackStore) => {
  const format = state.gameConfig?.scoring.displayFormat ?? "formatted";
  return formatScore(state.playerState.score, format);
};

export const selectFormattedTime = (state: PlaybackStore) => {
  return formatTime(state.playerState.elapsedTime);
};

export const selectRemainingTime = (state: PlaybackStore) => {
  const timeLimit = state.gameConfig?.timeLimit;
  if (!timeLimit) return null;
  const remaining = timeLimit * 1000 - state.playerState.elapsedTime;
  return Math.max(0, remaining);
};

export const selectInventoryCount = (state: PlaybackStore) => {
  return state.playerState.inventory.reduce((sum, item) => sum + item.quantity, 0);
};
