/**
 * Player Runtime System for Playtest Mode
 *
 * This module manages the live game state during playtest:
 * - Player position and movement
 * - Inventory tracking
 * - Score and objectives
 * - Interaction trigger state
 * - Win/fail condition checking
 */

import type { GameConfig } from "./game-logic";

// ============================================
// PLAYER STATE
// ============================================

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

export interface PlayerRotation {
  pitch: number; // Up/down look angle
  yaw: number; // Left/right look angle
}

export interface CollectedItem {
  itemId: string;
  objectId: string;
  name: string;
  quantity: number;
  collectedAt: number;
}

export interface ObjectiveProgress {
  objectiveId: string;
  completed: boolean;
  progress: number; // 0-100 or count
  completedAt?: number;
}

export interface PlayerState {
  // Position and movement
  position: PlayerPosition;
  rotation: PlayerRotation;
  isMoving: boolean;
  movementSpeed: number;

  // Game state
  score: number;
  inventory: CollectedItem[];
  objectivesProgress: Map<string, ObjectiveProgress>;
  visitedScenes: Set<string>;
  variables: Map<string, string | number | boolean>;

  // Timing
  startTime: number;
  elapsedTime: number;
  isPaused: boolean;

  // Status
  isAlive: boolean;
  hasWon: boolean;
  hasFailed: boolean;
  winConditionsMet: string[];
  failConditionsMet: string[];
}

// ============================================
// RUNTIME EVENTS
// ============================================

export type RuntimeEvent =
  | { type: "score_changed"; oldScore: number; newScore: number; delta: number }
  | { type: "item_collected"; item: CollectedItem }
  | { type: "item_removed"; itemId: string }
  | { type: "objective_progress"; objectiveId: string; progress: number }
  | { type: "objective_completed"; objectiveId: string }
  | { type: "message_shown"; title?: string; message: string }
  | { type: "sound_played"; audioUrl: string }
  | { type: "teleported"; destination: PlayerPosition }
  | { type: "scene_changed"; sceneId: string }
  | { type: "variable_changed"; name: string; value: string | number | boolean }
  | { type: "win_condition_met"; conditionId: string }
  | { type: "fail_condition_met"; conditionId: string }
  | { type: "game_won" }
  | { type: "game_failed" }
  | { type: "interaction_triggered"; interactionId: string; objectId: string }
  | { type: "show_object"; objectId: string }
  | { type: "hide_object"; objectId: string };

export type RuntimeEventHandler = (event: RuntimeEvent) => void;

// ============================================
// INTERACTION RUNTIME STATE
// ============================================

export interface InteractionState {
  interactionId: string;
  objectId: string;
  triggerCount: number;
  lastTriggeredAt: number | null;
  isOnCooldown: boolean;
  isInRange: boolean; // For proximity triggers
}

// ============================================
// DEBUG STATE
// ============================================

export interface DebugState {
  showTriggerZones: boolean;
  showCollisionBounds: boolean;
  showPlayerInfo: boolean;
  showObjectLabels: boolean;
  timeScale: number; // 0.5 = slow, 1 = normal, 2 = fast
  invincible: boolean;
  unlimitedInventory: boolean;
}

export const defaultDebugState: DebugState = {
  showTriggerZones: false,
  showCollisionBounds: false,
  showPlayerInfo: true,
  showObjectLabels: false,
  timeScale: 1,
  invincible: false,
  unlimitedInventory: false,
};

// ============================================
// PLAYTEST SESSION
// ============================================

export interface PlaytestSession {
  sessionId: string;
  sceneId: string;
  briefId: string;
  playerState: PlayerState;
  interactionStates: Map<string, InteractionState>;
  eventLog: RuntimeEvent[];
  debugState: DebugState;
  gameConfig: GameConfig;
}

// ============================================
// DEFAULT STATE
// ============================================

export function createDefaultPlayerState(
  startPosition: PlayerPosition = { x: 0, y: 1.6, z: 0 },
  gameConfig?: GameConfig
): PlayerState {
  return {
    position: startPosition,
    rotation: { pitch: 0, yaw: 0 },
    isMoving: false,
    movementSpeed: 3, // meters per second

    score: gameConfig?.scoring.startingScore ?? 0,
    inventory: [],
    objectivesProgress: new Map(),
    visitedScenes: new Set(),
    variables: new Map(),

    startTime: Date.now(),
    elapsedTime: 0,
    isPaused: false,

    isAlive: true,
    hasWon: false,
    hasFailed: false,
    winConditionsMet: [],
    failConditionsMet: [],
  };
}

export function createPlaytestSession(
  sceneId: string,
  briefId: string,
  gameConfig: GameConfig,
  startPosition?: PlayerPosition
): PlaytestSession {
  return {
    sessionId: crypto.randomUUID(),
    sceneId,
    briefId,
    playerState: createDefaultPlayerState(startPosition, gameConfig),
    interactionStates: new Map(),
    eventLog: [],
    debugState: { ...defaultDebugState },
    gameConfig,
  };
}

// ============================================
// DISTANCE & COLLISION HELPERS
// ============================================

export function distance3D(a: PlayerPosition, b: PlayerPosition): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

export function isInSphere(
  point: PlayerPosition,
  center: PlayerPosition,
  radius: number
): boolean {
  return distance3D(point, center) <= radius;
}

export function isInBox(
  point: PlayerPosition,
  center: PlayerPosition,
  size: { x: number; y: number; z: number }
): boolean {
  const halfX = size.x / 2;
  const halfY = size.y / 2;
  const halfZ = size.z / 2;

  return (
    point.x >= center.x - halfX &&
    point.x <= center.x + halfX &&
    point.y >= center.y - halfY &&
    point.y <= center.y + halfY &&
    point.z >= center.z - halfZ &&
    point.z <= center.z + halfZ
  );
}

// ============================================
// WIN/FAIL CONDITION CHECKING
// ============================================

export function checkWinConditions(
  state: PlayerState,
  gameConfig: GameConfig
): string[] {
  const metConditions: string[] = [];

  for (const condition of gameConfig.winConditions) {
    if (!condition.enabled) continue;

    let isMet = false;

    switch (condition.config.type) {
      case "collect_all": {
        const { category, items } = condition.config;
        if (items && items.length > 0) {
          // Check specific items
          isMet = items.every((itemId) =>
            state.inventory.some((inv) => inv.itemId === itemId)
          );
        } else if (category) {
          // Would need item category info - for now, assume met if any collected
          isMet = state.inventory.length > 0;
        } else {
          // All items - would need total count
          isMet = state.inventory.length > 0;
        }
        break;
      }

      case "collect_count": {
        const { count } = condition.config;
        const totalCollected = state.inventory.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        isMet = totalCollected >= count;
        break;
      }

      case "reach_score": {
        isMet = state.score >= condition.config.targetScore;
        break;
      }

      case "complete_objectives": {
        const { objectiveIds, requireAll } = condition.config;
        if (requireAll) {
          isMet = objectiveIds.every(
            (id) => state.objectivesProgress.get(id)?.completed
          );
        } else {
          isMet = objectiveIds.some(
            (id) => state.objectivesProgress.get(id)?.completed
          );
        }
        break;
      }

      case "reach_location": {
        const { sceneId, position, radius } = condition.config;
        if (position && radius) {
          isMet = isInSphere(state.position, position, radius);
        } else if (sceneId) {
          isMet = state.visitedScenes.has(sceneId);
        }
        break;
      }

      case "time_limit": {
        // Time limit is handled differently - it's usually a fail condition
        isMet = state.elapsedTime < condition.config.timeLimit * 1000;
        break;
      }

      case "custom": {
        const { variableName, operator, value } = condition.config;
        const currentValue = state.variables.get(variableName);
        if (currentValue !== undefined) {
          switch (operator) {
            case "equals":
              isMet = currentValue === value;
              break;
            case "greater":
              isMet = Number(currentValue) > Number(value);
              break;
            case "less":
              isMet = Number(currentValue) < Number(value);
              break;
            case "contains":
              isMet = String(currentValue).includes(String(value));
              break;
          }
        }
        break;
      }
    }

    if (isMet) {
      metConditions.push(condition.id);
    }
  }

  return metConditions;
}

export function checkFailConditions(
  state: PlayerState,
  gameConfig: GameConfig
): string[] {
  const metConditions: string[] = [];

  for (const condition of gameConfig.failConditions) {
    if (!condition.enabled) continue;

    let isMet = false;

    // Time limit fail condition
    if (condition.config.type === "time_limit") {
      const { timeLimit, failOnExpire } = condition.config;
      if (failOnExpire && state.elapsedTime >= timeLimit * 1000) {
        isMet = true;
      }
    }

    // Other fail conditions similar to win conditions
    // (Could share logic but keeping separate for clarity)

    if (isMet) {
      metConditions.push(condition.id);
    }
  }

  // Global time limit
  if (gameConfig.timeLimit && state.elapsedTime >= gameConfig.timeLimit * 1000) {
    metConditions.push("global_time_limit");
  }

  return metConditions;
}

// ============================================
// TRIGGER CHECKING
// ============================================

export function checkProximityTrigger(
  playerPos: PlayerPosition,
  objectPos: PlayerPosition,
  radius: number
): boolean {
  return distance3D(playerPos, objectPos) <= radius;
}

export function checkZoneTrigger(
  playerPos: PlayerPosition,
  zoneCenter: PlayerPosition,
  zoneShape: "sphere" | "box",
  zoneSize: { x: number; y: number; z: number }
): boolean {
  if (zoneShape === "sphere") {
    return isInSphere(playerPos, zoneCenter, zoneSize.x / 2);
  }
  return isInBox(playerPos, zoneCenter, zoneSize);
}

// ============================================
// MOVEMENT HELPERS
// ============================================

export function movePlayer(
  position: PlayerPosition,
  rotation: PlayerRotation,
  forward: number,
  strafe: number,
  deltaTime: number,
  speed: number
): PlayerPosition {
  // Convert yaw to radians
  const yawRad = (rotation.yaw * Math.PI) / 180;

  // Calculate movement direction
  const moveX = Math.sin(yawRad) * forward + Math.cos(yawRad) * strafe;
  const moveZ = Math.cos(yawRad) * forward - Math.sin(yawRad) * strafe;

  // Apply movement
  return {
    x: position.x + moveX * speed * deltaTime,
    y: position.y, // Keep same height (no jumping yet)
    z: position.z + moveZ * speed * deltaTime,
  };
}

export function rotatePlayer(
  rotation: PlayerRotation,
  deltaPitch: number,
  deltaYaw: number
): PlayerRotation {
  return {
    pitch: Math.max(-89, Math.min(89, rotation.pitch + deltaPitch)),
    yaw: (rotation.yaw + deltaYaw) % 360,
  };
}

// ============================================
// FORMAT HELPERS
// ============================================

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatScore(score: number, format: "numeric" | "formatted" | "abbreviated"): string {
  switch (format) {
    case "formatted":
      return score.toLocaleString();
    case "abbreviated":
      if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
      if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
      return score.toString();
    default:
      return score.toString();
  }
}
