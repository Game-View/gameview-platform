/**
 * Interaction System Types
 *
 * Pattern: "When [TRIGGER], do [ACTION]"
 *
 * Example interactions:
 * - When player touches coin, play sound and add to score
 * - When player clicks door, teleport to new location
 * - When player enters zone, show message
 */

// ============================================
// TRIGGER TYPES
// ============================================

export type TriggerType =
  | "proximity" // Player gets near the object
  | "click" // Player clicks/touches the object
  | "collision" // Player physically touches/collides
  | "collect" // Player picks up the object
  | "look" // Player looks at the object
  | "enter_zone" // Player enters trigger zone
  | "exit_zone" // Player exits trigger zone
  | "timer" // After X seconds
  | "conditional"; // When a condition is met

// Trigger configuration for each type
export interface ProximityTrigger {
  type: "proximity";
  radius: number; // Distance in meters
  onEnter: boolean; // Trigger on entering radius
  onExit: boolean; // Trigger on exiting radius
}

export interface ClickTrigger {
  type: "click";
  holdDuration?: number; // Optional: require holding for X ms
}

export interface CollisionTrigger {
  type: "collision";
  continuous: boolean; // Trigger once or continuously
}

export interface CollectTrigger {
  type: "collect";
  destroyOnCollect: boolean; // Remove object after collection
}

export interface LookTrigger {
  type: "look";
  duration: number; // How long to look (ms)
  angle: number; // Angle tolerance in degrees
}

export interface ZoneTrigger {
  type: "enter_zone" | "exit_zone";
  zoneShape: "sphere" | "box";
  zoneSize: { x: number; y: number; z: number };
}

export interface TimerTrigger {
  type: "timer";
  delay: number; // Delay in milliseconds
  repeat: boolean; // Repeat the timer
  repeatCount?: number; // Number of times to repeat (0 = infinite)
}

export interface ConditionalTrigger {
  type: "conditional";
  condition: {
    type: "score" | "inventory" | "variable" | "visited";
    operator: "equals" | "greater" | "less" | "contains" | "not_contains";
    value: string | number | boolean;
    variableName?: string;
  };
}

export type TriggerConfig =
  | ProximityTrigger
  | ClickTrigger
  | CollisionTrigger
  | CollectTrigger
  | LookTrigger
  | ZoneTrigger
  | TimerTrigger
  | ConditionalTrigger;

// ============================================
// ACTION TYPES
// ============================================

export type ActionType =
  | "play_sound" // Play audio file
  | "show_message" // Display text message
  | "add_score" // Add points to score
  | "add_inventory" // Add item to inventory
  | "show_object" // Make object visible
  | "hide_object" // Make object invisible
  | "teleport" // Move player to location
  | "play_animation" // Play object animation
  | "change_scene" // Load different scene
  | "set_variable" // Set a game variable
  | "emit_particles" // Spawn particle effect
  | "vibrate" // Haptic feedback
  | "open_url" // Open external link
  | "complete_objective"; // Mark objective complete

// Action configuration for each type
export interface PlaySoundAction {
  type: "play_sound";
  audioUrl: string;
  volume: number; // 0-1
  loop: boolean;
  spatial: boolean; // 3D positioned audio
}

export interface ShowMessageAction {
  type: "show_message";
  title?: string;
  message: string;
  duration: number; // Display duration in ms (0 = until dismissed)
  position: "top" | "center" | "bottom";
  style: "toast" | "dialog" | "subtitle";
}

export interface AddScoreAction {
  type: "add_score";
  points: number;
  scoreType?: string; // e.g., "coins", "stars", "points"
  showPopup: boolean;
}

export interface AddInventoryAction {
  type: "add_inventory";
  itemId: string;
  itemName: string;
  quantity: number;
  showNotification: boolean;
}

export interface ShowHideObjectAction {
  type: "show_object" | "hide_object";
  targetObjectId: string; // Instance ID of target object
  animate: boolean;
  animationDuration?: number;
}

export interface TeleportAction {
  type: "teleport";
  destination: { x: number; y: number; z: number };
  fadeTransition: boolean;
  fadeDuration?: number;
}

export interface PlayAnimationAction {
  type: "play_animation";
  animationName: string;
  loop: boolean;
  speed: number;
}

export interface ChangeSceneAction {
  type: "change_scene";
  sceneId: string;
  transition: "fade" | "slide" | "instant";
  spawnPoint?: string; // Spawn point ID in new scene
}

export interface SetVariableAction {
  type: "set_variable";
  variableName: string;
  operation: "set" | "add" | "subtract" | "toggle";
  value: string | number | boolean;
}

export interface EmitParticlesAction {
  type: "emit_particles";
  particleType: "sparkle" | "confetti" | "smoke" | "fire" | "custom";
  duration: number;
  intensity: number; // 0-1
}

export interface VibrateAction {
  type: "vibrate";
  pattern: "short" | "medium" | "long" | "double" | "success" | "error";
}

export interface OpenUrlAction {
  type: "open_url";
  url: string;
  newTab: boolean;
}

export interface CompleteObjectiveAction {
  type: "complete_objective";
  objectiveId: string;
  objectiveName: string;
  showNotification: boolean;
}

export type ActionConfig =
  | PlaySoundAction
  | ShowMessageAction
  | AddScoreAction
  | AddInventoryAction
  | ShowHideObjectAction
  | TeleportAction
  | PlayAnimationAction
  | ChangeSceneAction
  | SetVariableAction
  | EmitParticlesAction
  | VibrateAction
  | OpenUrlAction
  | CompleteObjectiveAction;

// ============================================
// INTERACTION
// ============================================

export interface Interaction {
  id: string;
  name: string;
  enabled: boolean;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  cooldown?: number; // Minimum time between triggers (ms)
  maxTriggers?: number; // Maximum number of times to trigger (0 = unlimited)
  triggerCount?: number; // Current trigger count (runtime)
}

// ============================================
// HELPERS
// ============================================

// Human-readable trigger descriptions
export const triggerLabels: Record<TriggerType, string> = {
  proximity: "Player gets near",
  click: "Player clicks/taps",
  collision: "Player touches",
  collect: "Player picks up",
  look: "Player looks at",
  enter_zone: "Player enters zone",
  exit_zone: "Player exits zone",
  timer: "After time passes",
  conditional: "When condition is met",
};

// Human-readable action descriptions
export const actionLabels: Record<ActionType, string> = {
  play_sound: "Play sound",
  show_message: "Show message",
  add_score: "Add points",
  add_inventory: "Add to inventory",
  show_object: "Show object",
  hide_object: "Hide object",
  teleport: "Teleport player",
  play_animation: "Play animation",
  change_scene: "Change scene",
  set_variable: "Set variable",
  emit_particles: "Emit particles",
  vibrate: "Vibrate device",
  open_url: "Open link",
  complete_objective: "Complete objective",
};

// Default trigger configurations
export function createDefaultTrigger(type: TriggerType): TriggerConfig {
  switch (type) {
    case "proximity":
      return { type: "proximity", radius: 2, onEnter: true, onExit: false };
    case "click":
      return { type: "click" };
    case "collision":
      return { type: "collision", continuous: false };
    case "collect":
      return { type: "collect", destroyOnCollect: true };
    case "look":
      return { type: "look", duration: 1000, angle: 30 };
    case "enter_zone":
      return { type: "enter_zone", zoneShape: "sphere", zoneSize: { x: 2, y: 2, z: 2 } };
    case "exit_zone":
      return { type: "exit_zone", zoneShape: "sphere", zoneSize: { x: 2, y: 2, z: 2 } };
    case "timer":
      return { type: "timer", delay: 3000, repeat: false };
    case "conditional":
      return {
        type: "conditional",
        condition: { type: "score", operator: "greater", value: 0 },
      };
  }
}

// Default action configurations
export function createDefaultAction(type: ActionType): ActionConfig {
  switch (type) {
    case "play_sound":
      return { type: "play_sound", audioUrl: "", volume: 1, loop: false, spatial: true };
    case "show_message":
      return {
        type: "show_message",
        message: "Hello!",
        duration: 3000,
        position: "bottom",
        style: "toast",
      };
    case "add_score":
      return { type: "add_score", points: 10, showPopup: true };
    case "add_inventory":
      return {
        type: "add_inventory",
        itemId: "",
        itemName: "Item",
        quantity: 1,
        showNotification: true,
      };
    case "show_object":
      return { type: "show_object", targetObjectId: "", animate: true, animationDuration: 300 };
    case "hide_object":
      return { type: "hide_object", targetObjectId: "", animate: true, animationDuration: 300 };
    case "teleport":
      return {
        type: "teleport",
        destination: { x: 0, y: 0, z: 0 },
        fadeTransition: true,
        fadeDuration: 500,
      };
    case "play_animation":
      return { type: "play_animation", animationName: "default", loop: false, speed: 1 };
    case "change_scene":
      return { type: "change_scene", sceneId: "", transition: "fade" };
    case "set_variable":
      return { type: "set_variable", variableName: "", operation: "set", value: "" };
    case "emit_particles":
      return { type: "emit_particles", particleType: "sparkle", duration: 1000, intensity: 0.5 };
    case "vibrate":
      return { type: "vibrate", pattern: "short" };
    case "open_url":
      return { type: "open_url", url: "", newTab: true };
    case "complete_objective":
      return {
        type: "complete_objective",
        objectiveId: "",
        objectiveName: "",
        showNotification: true,
      };
  }
}

// Create a new interaction with defaults
export function createInteraction(name: string = "New Interaction"): Interaction {
  return {
    id: crypto.randomUUID(),
    name,
    enabled: true,
    trigger: createDefaultTrigger("click"),
    actions: [createDefaultAction("show_message")],
  };
}

// Generate description of interaction
export function describeInteraction(interaction: Interaction): string {
  const triggerText = triggerLabels[interaction.trigger.type];
  const actionTexts = interaction.actions.map((a) => actionLabels[a.type]).join(", ");
  return `When ${triggerText.toLowerCase()}: ${actionTexts}`;
}
