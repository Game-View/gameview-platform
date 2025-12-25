/**
 * Scene Navigation System for Multi-Scene Experiences
 *
 * This module manages:
 * - Portal/door definitions for scene transitions
 * - Spawn points for player entry positions
 * - Scene linking and connection graph
 * - Transition effects and state preservation
 */

// ============================================
// SPAWN POINTS
// ============================================

export interface SpawnPoint {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number };
  isDefault: boolean; // First spawn point when entering scene
}

export function createSpawnPoint(
  name: string,
  position: { x: number; y: number; z: number },
  rotation: { pitch: number; yaw: number } = { pitch: 0, yaw: 0 },
  isDefault = false
): SpawnPoint {
  return {
    id: crypto.randomUUID(),
    name,
    position,
    rotation,
    isDefault,
  };
}

export const defaultSpawnPoint: SpawnPoint = {
  id: "default",
  name: "Default Spawn",
  position: { x: 0, y: 1.6, z: 5 },
  rotation: { pitch: 0, yaw: 0 },
  isDefault: true,
};

// ============================================
// PORTAL TYPES
// ============================================

export type PortalStyle =
  | "door" // Rectangular door-shaped portal
  | "archway" // Arch-shaped portal
  | "circular" // Round portal
  | "invisible" // Trigger zone only
  | "custom"; // Custom mesh

export type TransitionEffect =
  | "fade" // Fade to black/white
  | "dissolve" // Pixelate dissolve
  | "slide_left"
  | "slide_right"
  | "slide_up"
  | "slide_down"
  | "zoom" // Zoom into portal
  | "instant"; // No transition

export interface PortalVisuals {
  style: PortalStyle;
  color: string; // Hex color for portal glow
  emissiveIntensity: number; // Glow strength (0-2)
  particleEffect: boolean; // Show swirling particles
  pulseAnimation: boolean; // Pulsing glow animation
  customModelUrl?: string; // For custom style
}

export interface PortalConfig {
  id: string;
  name: string;

  // Physical properties
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number }; // Trigger zone size

  // Destination
  destinationSceneId: string;
  destinationSpawnId: string; // Which spawn point in destination scene

  // Activation
  triggerType: "enter" | "interact" | "key_required";
  requiredKeyId?: string; // Item ID needed to unlock

  // Effects
  transitionEffect: TransitionEffect;
  transitionDuration: number; // milliseconds
  transitionColor: string; // Color to fade to/from

  // Visuals
  visuals: PortalVisuals;

  // State
  enabled: boolean;
  locked: boolean;
  oneWay: boolean; // Can't return through this portal

  // Messages
  lockedMessage?: string;
  enterPrompt?: string; // "Press E to enter"
}

export function createDefaultPortal(
  name: string,
  position: { x: number; y: number; z: number },
  destinationSceneId: string
): PortalConfig {
  return {
    id: crypto.randomUUID(),
    name,
    position,
    rotation: { x: 0, y: 0, z: 0 },
    size: { width: 2, height: 3, depth: 0.5 },
    destinationSceneId,
    destinationSpawnId: "default",
    triggerType: "enter",
    transitionEffect: "fade",
    transitionDuration: 500,
    transitionColor: "#000000",
    visuals: {
      style: "door",
      color: "#4a9eff",
      emissiveIntensity: 0.5,
      particleEffect: true,
      pulseAnimation: true,
    },
    enabled: true,
    locked: false,
    oneWay: false,
  };
}

// ============================================
// SCENE LINK (Connection between scenes)
// ============================================

export interface SceneLink {
  id: string;
  sourceSceneId: string;
  sourcePortalId: string;
  destinationSceneId: string;
  destinationSpawnId: string;
  bidirectional: boolean; // Auto-create return portal
}

export interface SceneNode {
  sceneId: string;
  sceneName: string;
  spawnPoints: SpawnPoint[];
  portals: PortalConfig[];
  thumbnail?: string;
}

export interface SceneGraph {
  nodes: Map<string, SceneNode>;
  links: SceneLink[];
  startingSceneId: string;
}

export function createSceneGraph(startingSceneId: string): SceneGraph {
  return {
    nodes: new Map(),
    links: [],
    startingSceneId,
  };
}

// ============================================
// TRANSITION STATE
// ============================================

export type TransitionPhase =
  | "idle"
  | "fade_out"
  | "loading"
  | "fade_in"
  | "complete";

export interface TransitionState {
  phase: TransitionPhase;
  progress: number; // 0-1
  fromSceneId: string | null;
  toSceneId: string | null;
  toSpawnId: string | null;
  effect: TransitionEffect;
  color: string;
}

export const initialTransitionState: TransitionState = {
  phase: "idle",
  progress: 0,
  fromSceneId: null,
  toSceneId: null,
  toSpawnId: null,
  effect: "fade",
  color: "#000000",
};

// ============================================
// SCENE NAVIGATION EVENTS
// ============================================

export type NavigationEvent =
  | { type: "portal_approached"; portalId: string; distance: number }
  | { type: "portal_entered"; portalId: string }
  | { type: "transition_started"; fromSceneId: string; toSceneId: string }
  | { type: "scene_loading"; sceneId: string }
  | { type: "scene_loaded"; sceneId: string }
  | { type: "transition_completed"; sceneId: string; spawnId: string }
  | { type: "portal_locked"; portalId: string; message?: string }
  | { type: "portal_unlocked"; portalId: string };

// ============================================
// PRESERVED STATE (What carries between scenes)
// ============================================

export interface PreservedState {
  score: number;
  inventory: Array<{
    itemId: string;
    objectId: string;
    name: string;
    quantity: number;
  }>;
  variables: Record<string, string | number | boolean>;
  objectivesProgress: Record<string, { completed: boolean; progress: number }>;
  visitedScenes: string[];
  elapsedTime: number;
}

export function extractPreservedState(playerState: {
  score: number;
  inventory: Array<{ itemId: string; objectId: string; name: string; quantity: number }>;
  variables: Map<string, string | number | boolean>;
  objectivesProgress: Map<string, { completed: boolean; progress: number }>;
  visitedScenes: Set<string>;
  elapsedTime: number;
}): PreservedState {
  return {
    score: playerState.score,
    inventory: [...playerState.inventory],
    variables: Object.fromEntries(playerState.variables),
    objectivesProgress: Object.fromEntries(
      Array.from(playerState.objectivesProgress.entries()).map(([k, v]) => [
        k,
        { completed: v.completed, progress: v.progress },
      ])
    ),
    visitedScenes: [...playerState.visitedScenes],
    elapsedTime: playerState.elapsedTime,
  };
}

export function applyPreservedState(
  preserved: PreservedState,
  target: {
    score: number;
    inventory: Array<{ itemId: string; objectId: string; name: string; quantity: number; collectedAt: number }>;
    variables: Map<string, string | number | boolean>;
    objectivesProgress: Map<string, { objectiveId: string; completed: boolean; progress: number }>;
    visitedScenes: Set<string>;
    elapsedTime: number;
  }
): void {
  target.score = preserved.score;
  target.inventory = preserved.inventory.map((item) => ({
    ...item,
    collectedAt: Date.now(),
  }));
  target.variables = new Map(Object.entries(preserved.variables));
  target.objectivesProgress = new Map(
    Object.entries(preserved.objectivesProgress).map(([id, data]) => [
      id,
      { objectiveId: id, ...data },
    ])
  );
  target.visitedScenes = new Set(preserved.visitedScenes);
  target.elapsedTime = preserved.elapsedTime;
}

// ============================================
// PORTAL DETECTION HELPERS
// ============================================

export function isInPortalZone(
  playerPosition: { x: number; y: number; z: number },
  portal: PortalConfig
): boolean {
  const halfWidth = portal.size.width / 2;
  const halfHeight = portal.size.height / 2;
  const halfDepth = portal.size.depth / 2;

  // Simple AABB check (ignoring rotation for now)
  return (
    playerPosition.x >= portal.position.x - halfWidth &&
    playerPosition.x <= portal.position.x + halfWidth &&
    playerPosition.y >= portal.position.y - halfHeight &&
    playerPosition.y <= portal.position.y + halfHeight &&
    playerPosition.z >= portal.position.z - halfDepth &&
    playerPosition.z <= portal.position.z + halfDepth
  );
}

export function getDistanceToPortal(
  playerPosition: { x: number; y: number; z: number },
  portal: PortalConfig
): number {
  const dx = playerPosition.x - portal.position.x;
  const dy = playerPosition.y - portal.position.y;
  const dz = playerPosition.z - portal.position.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function getNearestPortal(
  playerPosition: { x: number; y: number; z: number },
  portals: PortalConfig[],
  maxDistance = 5
): PortalConfig | null {
  let nearest: PortalConfig | null = null;
  let nearestDistance = maxDistance;

  for (const portal of portals) {
    if (!portal.enabled) continue;
    const distance = getDistanceToPortal(playerPosition, portal);
    if (distance < nearestDistance) {
      nearest = portal;
      nearestDistance = distance;
    }
  }

  return nearest;
}

// ============================================
// SCENE DATA HELPERS
// ============================================

export interface SceneData {
  id: string;
  name: string;
  splatUrl?: string;
  spawnPoints: SpawnPoint[];
  portals: PortalConfig[];
}

export function getDefaultSpawn(spawnPoints: SpawnPoint[]): SpawnPoint {
  return spawnPoints.find((sp) => sp.isDefault) ?? spawnPoints[0] ?? defaultSpawnPoint;
}

export function getSpawnById(spawnPoints: SpawnPoint[], spawnId: string): SpawnPoint | undefined {
  return spawnPoints.find((sp) => sp.id === spawnId);
}
