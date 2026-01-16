/**
 * Player Runtime System for Interactive Playback
 *
 * Simplified version for player app - no debug features
 */

// ============================================
// TYPES FROM EXPERIENCE DATA
// ============================================

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

export interface PlayerRotation {
  pitch: number;
  yaw: number;
}

export interface Transform {
  position: PlayerPosition;
  rotation: PlayerPosition;
  scale: PlayerPosition;
}

export interface TriggerConfig {
  type: "click" | "proximity" | "collision" | "look" | "collect" | "conditional" | "timer" | "sequence" | "zone";
  radius?: number;
  duration?: number;
  angle?: number;
}

export interface ActionConfig {
  type: string;
  [key: string]: unknown;
}

export interface InteractionConfig {
  id: string;
  name: string;
  enabled: boolean;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  cooldown?: number;
  maxTriggers?: number;
}

export interface PlacedObject {
  instanceId: string;
  objectId: string;
  name: string;
  modelUrl: string;
  transform: Transform;
  interactions?: InteractionConfig[];
}

export interface SceneData {
  id: string;
  name: string;
  splatUrl: string | null;
  thumbnailUrl: string | null;
  placedObjects: PlacedObject[];
  interactions: unknown[];
  cameraPosition: PlayerPosition | null;
  cameraTarget: PlayerPosition | null;
  audioConfig: unknown | null;
}

export interface InventoryConfig {
  enabled: boolean;
  maxSlots: number;
  showCount: boolean;
  showInHUD: boolean;
  displayStyle: "grid" | "list" | "minimal";
  categories: string[];
}

export interface ScoreConfig {
  enabled: boolean;
  startingScore: number;
  showInHUD: boolean;
  showPopups: boolean;
  allowNegative: boolean;
  trackHighScore: boolean;
  displayFormat: "numeric" | "formatted" | "abbreviated";
}

export interface WinCondition {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  required: boolean;
  config: {
    type: string;
    count?: number;
    targetScore?: number;
    timeLimit?: number;
    failOnExpire?: boolean;
    [key: string]: unknown;
  };
}

export interface Objective {
  id: string;
  name: string;
  description?: string;
  type: "primary" | "secondary" | "bonus";
  hidden: boolean;
  showProgress: boolean;
  targetCount?: number;
  order: number;
}

export interface Reward {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
}

export interface GameConfig {
  inventory: InventoryConfig;
  scoring: ScoreConfig;
  winConditions: WinCondition[];
  failConditions: WinCondition[];
  objectives: Objective[];
  rewards: Reward[];
  timeLimit?: number;
  showTimer: boolean;
  allowRestart: boolean;
  saveProgress: boolean;
  winTitle: string;
  winMessage: string;
  winActions: { type: string; [key: string]: unknown }[];
  failTitle: string;
  failMessage: string;
  failActions: { type: string; [key: string]: unknown }[];
}

// ============================================
// PLAYER STATE
// ============================================

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
  progress: number;
  completedAt?: number;
}

export interface PlayerState {
  position: PlayerPosition;
  rotation: PlayerRotation;
  isMoving: boolean;
  movementSpeed: number;
  score: number;
  inventory: CollectedItem[];
  objectivesProgress: Map<string, ObjectiveProgress>;
  visitedScenes: Set<string>;
  variables: Map<string, string | number | boolean>;
  startTime: number;
  elapsedTime: number;
  isPaused: boolean;
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
// INTERACTION STATE
// ============================================

export interface InteractionState {
  interactionId: string;
  objectId: string;
  triggerCount: number;
  lastTriggeredAt: number | null;
  isOnCooldown: boolean;
  isInRange: boolean;
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
    movementSpeed: 3,
    score: gameConfig?.scoring?.startingScore ?? 0,
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

export function isInSphere(point: PlayerPosition, center: PlayerPosition, radius: number): boolean {
  return distance3D(point, center) <= radius;
}

// ============================================
// WIN/FAIL CONDITION CHECKING
// ============================================

export function checkWinConditions(state: PlayerState, gameConfig: GameConfig): string[] {
  const metConditions: string[] = [];

  for (const condition of gameConfig.winConditions) {
    if (!condition.enabled) continue;

    let isMet = false;

    switch (condition.config.type) {
      case "collect_count": {
        const count = condition.config.count ?? 1;
        const totalCollected = state.inventory.reduce((sum, item) => sum + item.quantity, 0);
        isMet = totalCollected >= count;
        break;
      }

      case "reach_score": {
        isMet = state.score >= (condition.config.targetScore ?? 0);
        break;
      }

      case "complete_objectives": {
        const objectiveIds = (condition.config.objectiveIds as string[]) ?? [];
        const requireAll = condition.config.requireAll ?? true;
        if (requireAll) {
          isMet = objectiveIds.every(id => state.objectivesProgress.get(id)?.completed);
        } else {
          isMet = objectiveIds.some(id => state.objectivesProgress.get(id)?.completed);
        }
        break;
      }

      case "collect_all": {
        isMet = state.inventory.length > 0;
        break;
      }

      case "time_limit": {
        isMet = state.elapsedTime < (condition.config.timeLimit ?? 300) * 1000;
        break;
      }
    }

    if (isMet) {
      metConditions.push(condition.id);
    }
  }

  return metConditions;
}

export function checkFailConditions(state: PlayerState, gameConfig: GameConfig): string[] {
  const metConditions: string[] = [];

  for (const condition of gameConfig.failConditions) {
    if (!condition.enabled) continue;

    if (condition.config.type === "time_limit") {
      const { timeLimit, failOnExpire } = condition.config;
      if (failOnExpire && state.elapsedTime >= (timeLimit ?? 300) * 1000) {
        metConditions.push(condition.id);
      }
    }
  }

  if (gameConfig.timeLimit && state.elapsedTime >= gameConfig.timeLimit * 1000) {
    metConditions.push("global_time_limit");
  }

  return metConditions;
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
  const yawRad = (rotation.yaw * Math.PI) / 180;
  const moveX = Math.sin(yawRad) * forward + Math.cos(yawRad) * strafe;
  const moveZ = Math.cos(yawRad) * forward - Math.sin(yawRad) * strafe;

  return {
    x: position.x + moveX * speed * deltaTime,
    y: position.y,
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

// Default game config for experiences without one
export const defaultGameConfig: GameConfig = {
  inventory: {
    enabled: true,
    maxSlots: 0,
    showCount: true,
    showInHUD: true,
    displayStyle: "grid",
    categories: ["Collectibles"],
  },
  scoring: {
    enabled: true,
    startingScore: 0,
    showInHUD: true,
    showPopups: true,
    allowNegative: false,
    trackHighScore: true,
    displayFormat: "formatted",
  },
  winConditions: [],
  failConditions: [],
  objectives: [],
  rewards: [],
  timeLimit: undefined,
  showTimer: false,
  allowRestart: true,
  saveProgress: false,
  winTitle: "Congratulations!",
  winMessage: "You completed the experience!",
  winActions: [{ type: "show_rewards" }],
  failTitle: "Try Again",
  failMessage: "Better luck next time!",
  failActions: [{ type: "offer_retry" }],
};
