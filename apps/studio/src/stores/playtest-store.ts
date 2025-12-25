/**
 * Playtest Store - Zustand store for managing playtest mode
 *
 * Handles:
 * - Player state (position, score, inventory)
 * - Interaction trigger state
 * - Action execution
 * - Win/fail condition checking
 * - Debug mode settings
 */

import { create } from "zustand";
import type { GameConfig } from "@/lib/game-logic";
import type { ActionConfig } from "@/lib/interactions";
import type { PlacedObject } from "@/lib/objects";
import {
  type PlayerState,
  type PlayerPosition,
  type PlayerRotation,
  type CollectedItem,
  type InteractionState,
  type DebugState,
  type RuntimeEvent,
  type RuntimeEventHandler,
  createDefaultPlayerState,
  defaultDebugState,
  checkWinConditions,
  checkFailConditions,
  movePlayer,
  formatScore,
  formatTime,
} from "@/lib/player-runtime";

// ============================================
// STORE STATE
// ============================================

interface PlaytestState {
  // Mode
  isPlaytestMode: boolean;
  isPaused: boolean;

  // Scene data
  sceneId: string | null;
  briefId: string | null;
  gameConfig: GameConfig | null;
  placedObjects: PlacedObject[];

  // Player state
  playerState: PlayerState;
  interactionStates: Map<string, InteractionState>;

  // Event handling
  eventLog: RuntimeEvent[];
  eventHandlers: Set<RuntimeEventHandler>;

  // Debug
  debugState: DebugState;

  // UI State
  activeMessage: { title?: string; message: string; style: string } | null;
  showInventory: boolean;
  showObjectives: boolean;
}

interface PlaytestActions {
  // Mode control
  startPlaytest: (
    sceneId: string,
    briefId: string,
    gameConfig: GameConfig,
    placedObjects: PlacedObject[],
    startPosition?: PlayerPosition
  ) => void;
  stopPlaytest: () => void;
  pausePlaytest: () => void;
  resumePlaytest: () => void;
  resetPlaytest: () => void;

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

  // Debug
  setDebugOption: <K extends keyof DebugState>(key: K, value: DebugState[K]) => void;
  toggleDebugOption: (key: keyof DebugState) => void;

  // Tick (called each frame)
  tick: (deltaTime: number) => void;

  // UI
  toggleInventory: () => void;
  toggleObjectives: () => void;
}

type PlaytestStore = PlaytestState & PlaytestActions;

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const usePlaytestStore = create<PlaytestStore>((set, get) => ({
  // Initial state
  isPlaytestMode: false,
  isPaused: false,
  sceneId: null,
  briefId: null,
  gameConfig: null,
  placedObjects: [],
  playerState: createDefaultPlayerState(),
  interactionStates: new Map(),
  eventLog: [],
  eventHandlers: new Set(),
  debugState: { ...defaultDebugState },
  activeMessage: null,
  showInventory: false,
  showObjectives: false,

  // Mode control
  startPlaytest: (sceneId, briefId, gameConfig, placedObjects, startPosition) => {
    set({
      isPlaytestMode: true,
      isPaused: false,
      sceneId,
      briefId,
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

  stopPlaytest: () => {
    set({
      isPlaytestMode: false,
      isPaused: false,
      sceneId: null,
      briefId: null,
      gameConfig: null,
      placedObjects: [],
      playerState: createDefaultPlayerState(),
      interactionStates: new Map(),
      eventLog: [],
      activeMessage: null,
    });
  },

  pausePlaytest: () => set({ isPaused: true }),
  resumePlaytest: () => set({ isPaused: false }),

  resetPlaytest: () => {
    const { sceneId, briefId, gameConfig, placedObjects } = get();
    if (sceneId && briefId && gameConfig) {
      get().startPlaytest(sceneId, briefId, gameConfig, placedObjects);
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

    // Check if negative scores allowed
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
        // Stack existing item
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

    // Check cooldown
    if (state?.isOnCooldown) return;

    // Find the interaction
    const object = placedObjects.find((o) => o.instanceId === objectId);
    const interaction = object?.interactions?.find((i) => i.id === interactionId);

    if (!interaction || !interaction.enabled) return;

    // Check max triggers
    if (interaction.maxTriggers && state && state.triggerCount >= interaction.maxTriggers) {
      return;
    }

    // Execute actions
    get().executeActions(interaction.actions, objectId);

    // Update state
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

    // Set cooldown timer
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
          get().emitEvent({ type: "sound_played", audioUrl: action.audioUrl });
          break;

        case "show_message":
          get().showMessage(action.title, action.message, action.style, action.duration);
          break;

        case "add_score":
          get().addScore(action.points);
          break;

        case "add_inventory":
          get().collectItem({
            itemId: action.itemId,
            objectId,
            name: action.itemName,
            quantity: action.quantity,
            collectedAt: Date.now(),
          });
          break;

        case "teleport":
          get().teleportPlayer(action.destination);
          break;

        case "change_scene":
          get().emitEvent({ type: "scene_changed", sceneId: action.sceneId });
          break;

        case "set_variable":
          const currentVal = get().getVariable(action.variableName);
          let newVal: string | number | boolean = action.value;

          if (action.operation === "add" && typeof currentVal === "number") {
            newVal = currentVal + Number(action.value);
          } else if (action.operation === "subtract" && typeof currentVal === "number") {
            newVal = currentVal - Number(action.value);
          } else if (action.operation === "toggle" && typeof currentVal === "boolean") {
            newVal = !currentVal;
          }

          get().setVariable(action.variableName, newVal);
          break;

        case "complete_objective":
          get().completeObjective(action.objectiveId);
          break;

        // Additional action types handled by event listeners
        case "show_object":
        case "hide_object":
        case "play_animation":
        case "emit_particles":
        case "vibrate":
        case "open_url":
          // These are handled by event listeners in the 3D scene
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

    // Notify handlers
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

  // Debug
  setDebugOption: (key, value) => {
    set((state) => ({
      debugState: { ...state.debugState, [key]: value },
    }));
  },

  toggleDebugOption: (key) => {
    set((state) => ({
      debugState: {
        ...state.debugState,
        [key]: !state.debugState[key as keyof typeof state.debugState],
      },
    }));
  },

  // Tick
  tick: (deltaTime) => {
    const { isPaused, playerState, gameConfig, debugState } = get();
    if (isPaused || !gameConfig) return;

    // Apply time scale
    const scaledDelta = deltaTime * debugState.timeScale;

    // Update elapsed time
    const newElapsed = playerState.elapsedTime + scaledDelta * 1000;

    // Check win conditions
    const winMet = checkWinConditions(
      { ...playerState, elapsedTime: newElapsed },
      gameConfig
    );
    const allRequiredWinMet = gameConfig.winConditions
      .filter((c) => c.enabled && c.required)
      .every((c) => winMet.includes(c.id));

    // Check fail conditions
    const failMet = checkFailConditions(
      { ...playerState, elapsedTime: newElapsed },
      gameConfig
    );

    // Update state
    set({
      playerState: {
        ...playerState,
        elapsedTime: newElapsed,
        winConditionsMet: winMet,
        failConditionsMet: failMet,
        hasWon: allRequiredWinMet && winMet.length > 0,
        hasFailed: failMet.length > 0 && !debugState.invincible,
      },
    });

    // Emit events for newly met conditions
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

    // Check for game end
    if (allRequiredWinMet && winMet.length > 0 && !playerState.hasWon) {
      get().emitEvent({ type: "game_won" });
    }

    if (failMet.length > 0 && !debugState.invincible && !playerState.hasFailed) {
      get().emitEvent({ type: "game_failed" });
    }
  },

  // UI
  toggleInventory: () => set((state) => ({ showInventory: !state.showInventory })),
  toggleObjectives: () => set((state) => ({ showObjectives: !state.showObjectives })),
}));

// ============================================
// SELECTORS
// ============================================

export const selectFormattedScore = (state: PlaytestStore) => {
  const format = state.gameConfig?.scoring.displayFormat ?? "formatted";
  return formatScore(state.playerState.score, format);
};

export const selectFormattedTime = (state: PlaytestStore) => {
  return formatTime(state.playerState.elapsedTime);
};

export const selectRemainingTime = (state: PlaytestStore) => {
  const timeLimit = state.gameConfig?.timeLimit;
  if (!timeLimit) return null;
  const remaining = timeLimit * 1000 - state.playerState.elapsedTime;
  return Math.max(0, remaining);
};

export const selectInventoryCount = (state: PlaytestStore) => {
  return state.playerState.inventory.reduce((sum, item) => sum + item.quantity, 0);
};
