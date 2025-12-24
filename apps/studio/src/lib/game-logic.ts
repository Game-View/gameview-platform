/**
 * Game Logic Types for Game View Studio
 *
 * This module defines the core game mechanics:
 * - Inventory: Track collected items
 * - Scoring: Point-based progression
 * - Win Conditions: Victory requirements
 * - Progression: Scene/venue unlocking
 * - Rewards: Completion bonuses
 */

// ============================================
// INVENTORY SYSTEM
// ============================================

export interface InventoryItem {
  id: string;
  objectId: string; // Reference to the placed object
  name: string;
  description?: string;
  icon?: string; // URL to icon image
  category?: string;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  stackable: boolean;
  maxStack?: number;
}

export interface InventoryConfig {
  enabled: boolean;
  maxSlots: number; // Maximum inventory capacity (0 = unlimited)
  showCount: boolean; // Show "X of Y collected"
  showInHUD: boolean; // Display inventory in player HUD
  displayStyle: "grid" | "list" | "minimal";
  categories: string[]; // Item categories (e.g., "Tapes", "Keys", "Collectibles")
}

// ============================================
// SCORING SYSTEM
// ============================================

export interface ScoreConfig {
  enabled: boolean;
  startingScore: number;
  showInHUD: boolean;
  showPopups: boolean; // Show "+10" popups on score changes
  allowNegative: boolean;
  trackHighScore: boolean;
  displayFormat: "numeric" | "formatted" | "abbreviated"; // 1000 vs 1,000 vs 1K
}

export interface ScoreRule {
  id: string;
  name: string;
  triggerType: "collect" | "interaction" | "zone_enter" | "time_bonus" | "combo";
  points: number;
  objectId?: string; // Specific object, or null for any
  multiplier?: number; // Score multiplier
  cooldown?: number; // Prevent spam scoring (ms)
}

// ============================================
// WIN CONDITIONS
// ============================================

export type WinConditionType =
  | "collect_all"
  | "collect_count"
  | "reach_score"
  | "complete_objectives"
  | "reach_location"
  | "time_limit"
  | "custom";

export interface WinCondition {
  id: string;
  type: WinConditionType;
  name: string;
  description?: string;
  enabled: boolean;
  required: boolean; // Must be met to win (vs optional objectives)
  config: WinConditionConfig;
}

export type WinConditionConfig =
  | CollectAllConfig
  | CollectCountConfig
  | ReachScoreConfig
  | CompleteObjectivesConfig
  | ReachLocationConfig
  | TimeLimitConfig
  | CustomConditionConfig;

export interface CollectAllConfig {
  type: "collect_all";
  category?: string; // All items in category, or all items if null
  items?: string[]; // Specific item IDs to collect
}

export interface CollectCountConfig {
  type: "collect_count";
  count: number;
  category?: string;
}

export interface ReachScoreConfig {
  type: "reach_score";
  targetScore: number;
}

export interface CompleteObjectivesConfig {
  type: "complete_objectives";
  objectiveIds: string[];
  requireAll: boolean; // AND vs OR
}

export interface ReachLocationConfig {
  type: "reach_location";
  sceneId: string;
  position?: { x: number; y: number; z: number };
  radius?: number;
}

export interface TimeLimitConfig {
  type: "time_limit";
  timeLimit: number; // Seconds
  failOnExpire: boolean; // Fail if time runs out
}

export interface CustomConditionConfig {
  type: "custom";
  variableName: string;
  operator: "equals" | "greater" | "less" | "contains";
  value: string | number | boolean;
}

// ============================================
// OBJECTIVES
// ============================================

export interface Objective {
  id: string;
  name: string;
  description?: string;
  type: "primary" | "secondary" | "bonus";
  hidden: boolean; // Hidden until discovered
  showProgress: boolean; // Show X/Y progress
  targetCount?: number;
  order: number; // Display order
}

// ============================================
// PROGRESSION SYSTEM
// ============================================

export type UnlockRequirement =
  | { type: "none" } // Always unlocked
  | { type: "previous_scene" } // Complete previous scene
  | { type: "collect_item"; itemId: string }
  | { type: "reach_score"; score: number }
  | { type: "complete_objective"; objectiveId: string }
  | { type: "all_scenes"; sceneIds: string[] }; // Complete all specified scenes

export interface SceneProgression {
  sceneId: string;
  order: number;
  unlockRequirement: UnlockRequirement;
  isHub: boolean; // Hub scenes are always accessible once unlocked
}

export interface ProgressionConfig {
  enabled: boolean;
  mode: "linear" | "open" | "hub"; // Linear = sequential, Open = all available, Hub = hub-and-spoke
  showLockedScenes: boolean; // Show locked scenes (grayed out) or hide them
  progressionScenes: SceneProgression[];
}

// ============================================
// REWARDS SYSTEM
// ============================================

export type RewardType =
  | "achievement"
  | "unlock_content"
  | "bonus_points"
  | "badge"
  | "leaderboard_entry"
  | "custom_message";

export interface Reward {
  id: string;
  type: RewardType;
  name: string;
  description?: string;
  icon?: string;
  config: RewardConfig;
}

export type RewardConfig =
  | AchievementRewardConfig
  | UnlockContentRewardConfig
  | BonusPointsRewardConfig
  | BadgeRewardConfig
  | LeaderboardRewardConfig
  | CustomMessageRewardConfig;

export interface AchievementRewardConfig {
  type: "achievement";
  title: string;
  description: string;
  icon?: string;
}

export interface UnlockContentRewardConfig {
  type: "unlock_content";
  contentType: "scene" | "object" | "audio" | "video" | "url";
  contentId?: string;
  contentUrl?: string;
}

export interface BonusPointsRewardConfig {
  type: "bonus_points";
  points: number;
}

export interface BadgeRewardConfig {
  type: "badge";
  badgeId: string;
  badgeName: string;
  badgeIcon?: string;
}

export interface LeaderboardRewardConfig {
  type: "leaderboard_entry";
  leaderboardId: string;
  scoreField: "score" | "time" | "collectibles";
}

export interface CustomMessageRewardConfig {
  type: "custom_message";
  title: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
}

// ============================================
// GAME CONFIG (Experience-Level)
// ============================================

export interface GameConfig {
  // Core systems
  inventory: InventoryConfig;
  scoring: ScoreConfig;
  progression: ProgressionConfig;

  // Win/lose conditions
  winConditions: WinCondition[];
  failConditions: WinCondition[]; // Conditions that cause failure

  // Objectives and rewards
  objectives: Objective[];
  rewards: Reward[];
  scoreRules: ScoreRule[];

  // Experience settings
  timeLimit?: number; // Global time limit (seconds), null = no limit
  showTimer: boolean;
  allowRestart: boolean;
  saveProgress: boolean; // Save player progress between sessions

  // Victory settings
  winTitle: string;
  winMessage: string;
  winActions: WinAction[];

  // Failure settings
  failTitle: string;
  failMessage: string;
  failActions: FailAction[];
}

export type WinAction =
  | { type: "show_rewards" }
  | { type: "show_leaderboard" }
  | { type: "redirect"; url: string }
  | { type: "unlock_next" }
  | { type: "play_audio"; audioUrl: string }
  | { type: "confetti" };

export type FailAction =
  | { type: "offer_retry" }
  | { type: "show_hint" }
  | { type: "redirect"; url: string }
  | { type: "reduce_difficulty" };

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

export const defaultInventoryConfig: InventoryConfig = {
  enabled: true,
  maxSlots: 0, // Unlimited
  showCount: true,
  showInHUD: true,
  displayStyle: "grid",
  categories: ["Collectibles"],
};

export const defaultScoreConfig: ScoreConfig = {
  enabled: true,
  startingScore: 0,
  showInHUD: true,
  showPopups: true,
  allowNegative: false,
  trackHighScore: true,
  displayFormat: "formatted",
};

export const defaultProgressionConfig: ProgressionConfig = {
  enabled: false,
  mode: "open",
  showLockedScenes: true,
  progressionScenes: [],
};

export const defaultGameConfig: GameConfig = {
  inventory: defaultInventoryConfig,
  scoring: defaultScoreConfig,
  progression: defaultProgressionConfig,
  winConditions: [],
  failConditions: [],
  objectives: [],
  rewards: [],
  scoreRules: [],
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

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createWinCondition(
  type: WinConditionType,
  name: string
): WinCondition {
  const id = crypto.randomUUID();
  const baseCondition = {
    id,
    type,
    name,
    enabled: true,
    required: true,
  };

  switch (type) {
    case "collect_all":
      return {
        ...baseCondition,
        config: { type: "collect_all" } as CollectAllConfig,
      };
    case "collect_count":
      return {
        ...baseCondition,
        config: { type: "collect_count", count: 1 } as CollectCountConfig,
      };
    case "reach_score":
      return {
        ...baseCondition,
        config: { type: "reach_score", targetScore: 100 } as ReachScoreConfig,
      };
    case "complete_objectives":
      return {
        ...baseCondition,
        config: {
          type: "complete_objectives",
          objectiveIds: [],
          requireAll: true,
        } as CompleteObjectivesConfig,
      };
    case "reach_location":
      return {
        ...baseCondition,
        config: {
          type: "reach_location",
          sceneId: "",
        } as ReachLocationConfig,
      };
    case "time_limit":
      return {
        ...baseCondition,
        config: {
          type: "time_limit",
          timeLimit: 300,
          failOnExpire: true,
        } as TimeLimitConfig,
      };
    case "custom":
      return {
        ...baseCondition,
        config: {
          type: "custom",
          variableName: "",
          operator: "equals",
          value: "",
        } as CustomConditionConfig,
      };
  }
}

export function createObjective(name: string, type: Objective["type"] = "primary"): Objective {
  return {
    id: crypto.randomUUID(),
    name,
    type,
    hidden: false,
    showProgress: true,
    order: 0,
  };
}

export function createScoreRule(name: string, points: number): ScoreRule {
  return {
    id: crypto.randomUUID(),
    name,
    triggerType: "collect",
    points,
  };
}

export function createReward(type: RewardType, name: string): Reward {
  const id = crypto.randomUUID();
  const baseReward = { id, type, name };

  switch (type) {
    case "achievement":
      return {
        ...baseReward,
        config: {
          type: "achievement",
          title: name,
          description: "",
        } as AchievementRewardConfig,
      };
    case "unlock_content":
      return {
        ...baseReward,
        config: {
          type: "unlock_content",
          contentType: "scene",
        } as UnlockContentRewardConfig,
      };
    case "bonus_points":
      return {
        ...baseReward,
        config: { type: "bonus_points", points: 100 } as BonusPointsRewardConfig,
      };
    case "badge":
      return {
        ...baseReward,
        config: {
          type: "badge",
          badgeId: id,
          badgeName: name,
        } as BadgeRewardConfig,
      };
    case "leaderboard_entry":
      return {
        ...baseReward,
        config: {
          type: "leaderboard_entry",
          leaderboardId: "",
          scoreField: "score",
        } as LeaderboardRewardConfig,
      };
    case "custom_message":
      return {
        ...baseReward,
        config: {
          type: "custom_message",
          title: name,
          message: "",
        } as CustomMessageRewardConfig,
      };
  }
}

// Win condition description for UI
export function describeWinCondition(condition: WinCondition): string {
  switch (condition.config.type) {
    case "collect_all":
      return condition.config.category
        ? `Collect all ${condition.config.category}`
        : "Collect all items";
    case "collect_count":
      return `Collect ${condition.config.count} items${condition.config.category ? ` (${condition.config.category})` : ""}`;
    case "reach_score":
      return `Reach ${condition.config.targetScore.toLocaleString()} points`;
    case "complete_objectives":
      return condition.config.requireAll
        ? `Complete all objectives`
        : `Complete any objective`;
    case "reach_location":
      return `Reach destination`;
    case "time_limit":
      const minutes = Math.floor(condition.config.timeLimit / 60);
      const seconds = condition.config.timeLimit % 60;
      return `Complete within ${minutes}:${seconds.toString().padStart(2, "0")}`;
    case "custom":
      return `${condition.config.variableName} ${condition.config.operator} ${condition.config.value}`;
    default:
      return condition.name;
  }
}

// Labels for UI
export const winConditionLabels: Record<WinConditionType, string> = {
  collect_all: "Collect All Items",
  collect_count: "Collect X Items",
  reach_score: "Reach Score",
  complete_objectives: "Complete Objectives",
  reach_location: "Reach Location",
  time_limit: "Time Limit",
  custom: "Custom Condition",
};

export const rewardTypeLabels: Record<RewardType, string> = {
  achievement: "Achievement",
  unlock_content: "Unlock Content",
  bonus_points: "Bonus Points",
  badge: "Badge",
  leaderboard_entry: "Leaderboard Entry",
  custom_message: "Custom Message",
};
