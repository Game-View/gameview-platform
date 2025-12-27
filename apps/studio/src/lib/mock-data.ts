/**
 * Mock Data for Testing
 *
 * This module provides sample data for testing the studio
 * when NEXT_PUBLIC_USE_MOCK_DATA=true
 */

import type { PlacedObject } from "./objects";
import type { GameConfig } from "./game-logic";
import type { AudioConfig } from "./audio-types";
import type { PortalConfig, SpawnPoint } from "./scene-navigation";

// ============================================
// MOCK USER
// ============================================

export const mockUser = {
  id: "user_test_123",
  email: "creator@gameview.test",
  firstName: "Test",
  lastName: "Creator",
  imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=gameview",
};

// ============================================
// MOCK PROJECTS
// ============================================

export const mockProjects = [
  {
    id: "proj_demo_001",
    name: "Demo Experience",
    description: "A sample experience for testing all features",
    thumbnail: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: mockUser.id,
  },
  {
    id: "proj_museum_002",
    name: "Virtual Museum Tour",
    description: "Explore a virtual museum with interactive exhibits",
    thumbnail: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    userId: mockUser.id,
  },
];

// ============================================
// MOCK BRIEFS
// ============================================

export const mockBriefs = [
  {
    id: "brief_demo_001",
    projectId: "proj_demo_001",
    name: "Main Gallery",
    description: "The main gallery experience",
    type: "exploration",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "brief_demo_002",
    projectId: "proj_demo_001",
    name: "Treasure Hunt",
    description: "Find all the hidden treasures",
    type: "game",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// MOCK SCENES
// ============================================

export const mockScenes = [
  {
    id: "scene_demo_001",
    briefId: "brief_demo_001",
    name: "Gallery Entrance",
    splatUrl: null, // Would be a real splat URL
    thumbnail: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "scene_demo_002",
    briefId: "brief_demo_001",
    name: "Main Hall",
    splatUrl: null,
    thumbnail: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// MOCK PLACED OBJECTS
// ============================================

export const mockPlacedObjects: PlacedObject[] = [
  {
    instanceId: "obj_001",
    objectId: "lib_chest_gold",
    name: "Golden Chest",
    modelUrl: "/objects/models/chest_gold.glb",
    transform: {
      position: { x: 2, y: 0, z: -3 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    interactionType: "collectible",
    metadata: {},
    interactions: [
      {
        id: "int_001",
        name: "Open Chest",
        enabled: true,
        trigger: { type: "click" },
        actions: [
          {
            type: "add_inventory",
            itemId: "gold_coin",
            itemName: "Gold Coin",
            quantity: 1,
            showNotification: true,
          },
          {
            type: "add_score",
            points: 100,
            showPopup: true,
          },
          {
            type: "play_sound",
            audioUrl: "/audio/sfx/chest_open.mp3",
            volume: 0.8,
            loop: false,
            spatial: true,
          },
        ],
        maxTriggers: 1,
      },
    ],
  },
  {
    instanceId: "obj_002",
    objectId: "lib_sign_info",
    name: "Info Sign",
    modelUrl: "/objects/models/sign_info.glb",
    transform: {
      position: { x: -2, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    interactionType: "trigger",
    metadata: {},
    interactions: [
      {
        id: "int_002",
        name: "Read Sign",
        enabled: true,
        trigger: { type: "proximity", radius: 2, onEnter: true, onExit: false },
        actions: [
          {
            type: "show_message",
            message: "Welcome to the Gallery! Look for hidden treasures.",
            duration: 3000,
            position: "bottom",
            style: "toast",
          },
        ],
      },
    ],
  },
  {
    instanceId: "obj_003",
    objectId: "lib_key_brass",
    name: "Brass Key",
    modelUrl: "/objects/models/key_brass.glb",
    transform: {
      position: { x: 5, y: 0.5, z: 2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.5, y: 0.5, z: 0.5 },
    },
    interactionType: "collectible",
    metadata: {},
    interactions: [
      {
        id: "int_003",
        name: "Collect Key",
        enabled: true,
        trigger: { type: "click" },
        actions: [
          {
            type: "add_inventory",
            itemId: "brass_key",
            itemName: "Brass Key",
            quantity: 1,
            showNotification: true,
          },
          {
            type: "add_score",
            points: 50,
            showPopup: true,
          },
          {
            type: "hide_object",
            targetObjectId: "obj_003",
            animate: true,
            animationDuration: 300,
          },
        ],
        maxTriggers: 1,
      },
    ],
  },
];

// ============================================
// MOCK GAME CONFIG
// ============================================

export const mockGameConfig: GameConfig = {
  id: "game_config_001",
  sceneId: "scene_demo_001",
  enabled: true,

  timing: {
    hasTimeLimit: true,
    timeLimit: 300, // 5 minutes
    showTimer: true,
    timerPosition: "top-right",
    warningThreshold: 60,
  },

  scoring: {
    enabled: true,
    showScore: true,
    scorePosition: "top-left",
    initialScore: 0,
    maxScore: 500,
  },

  lives: {
    enabled: false,
    initialLives: 3,
    maxLives: 5,
    showLives: true,
  },

  winConditions: [
    {
      id: "win_001",
      type: "collect_all",
      config: {
        itemIds: ["gold_coin", "brass_key"],
      },
      required: true,
    },
  ],

  failConditions: [
    {
      id: "fail_001",
      type: "time_expired",
      config: {},
    },
  ],

  objectives: [
    {
      id: "obj_001",
      title: "Find the Golden Chest",
      description: "Locate and open the golden chest",
      type: "collect",
      required: true,
      hidden: false,
      progress: {
        current: 0,
        target: 1,
      },
    },
    {
      id: "obj_002",
      title: "Collect the Key",
      description: "Find the brass key",
      type: "collect",
      required: true,
      hidden: false,
      progress: {
        current: 0,
        target: 1,
      },
    },
  ],

  rewards: {
    onWin: {
      message: "Congratulations! You found all the treasures!",
      showConfetti: true,
    },
    onFail: {
      message: "Time's up! Try again?",
      allowRetry: true,
    },
  },
};

// ============================================
// MOCK AUDIO CONFIG
// ============================================

export const mockAudioConfig: AudioConfig = {
  id: "audio_config_001",
  sceneId: "scene_demo_001",
  masterVolume: 1.0,

  ambient: [
    {
      id: "amb_001",
      name: "Gallery Ambience",
      url: "/audio/ambient/gallery.mp3",
      volume: 0.3,
      loop: true,
      autoplay: true,
      fadeIn: 2000,
      fadeOut: 1000,
    },
  ],

  zones: [
    {
      id: "zone_001",
      name: "Treasure Room Music",
      url: "/audio/music/treasure.mp3",
      volume: 0.5,
      loop: true,
      zone: {
        center: { x: 2, y: 0, z: -3 },
        radius: 5,
        falloff: 2,
      },
    },
  ],

  interactions: [],
};

// ============================================
// MOCK PORTALS & SPAWNS
// ============================================

export const mockPortals: PortalConfig[] = [
  {
    id: "portal_001",
    name: "To Main Hall",
    position: { x: 0, y: 1.5, z: -8 },
    rotation: { x: 0, y: 0, z: 0 },
    size: { width: 2, height: 3, depth: 0.5 },
    destinationSceneId: "scene_demo_002",
    destinationSpawnId: "spawn_entrance",
    triggerType: "enter",
    transitionEffect: "fade",
    transitionDuration: 500,
    transitionColor: "#000000",
    visuals: {
      style: "archway",
      color: "#4a9eff",
      emissiveIntensity: 0.5,
      particleEffect: true,
      pulseAnimation: true,
    },
    enabled: true,
    locked: false,
    oneWay: false,
    enterPrompt: "Enter Main Hall",
  },
];

export const mockSpawnPoints: SpawnPoint[] = [
  {
    id: "spawn_default",
    name: "Default Spawn",
    position: { x: 0, y: 1.6, z: 5 },
    rotation: { pitch: 0, yaw: 0 },
    isDefault: true,
  },
  {
    id: "spawn_entrance",
    name: "Entrance",
    position: { x: 0, y: 1.6, z: 8 },
    rotation: { pitch: 0, yaw: 180 },
    isDefault: false,
  },
];

// ============================================
// MOCK OBJECT LIBRARY
// ============================================

export const mockObjectLibrary = {
  categories: [
    { id: "furniture", name: "Furniture", icon: "sofa" },
    { id: "nature", name: "Nature", icon: "tree" },
    { id: "interactive", name: "Interactive", icon: "pointer" },
    { id: "decorative", name: "Decorative", icon: "sparkles" },
  ],
  objects: [
    {
      id: "lib_chest_gold",
      name: "Golden Chest",
      category: "interactive",
      thumbnail: "/objects/thumbnails/chest_gold.png",
      modelUrl: "/objects/models/chest_gold.glb",
      tags: ["treasure", "container", "gold"],
    },
    {
      id: "lib_sign_info",
      name: "Info Sign",
      category: "interactive",
      thumbnail: "/objects/thumbnails/sign_info.png",
      modelUrl: "/objects/models/sign_info.glb",
      tags: ["sign", "information"],
    },
    {
      id: "lib_key_brass",
      name: "Brass Key",
      category: "interactive",
      thumbnail: "/objects/thumbnails/key_brass.png",
      modelUrl: "/objects/models/key_brass.glb",
      tags: ["key", "collectible"],
    },
    {
      id: "lib_table_wood",
      name: "Wooden Table",
      category: "furniture",
      thumbnail: "/objects/thumbnails/table_wood.png",
      modelUrl: "/objects/models/table_wood.glb",
      tags: ["table", "furniture", "wood"],
    },
    {
      id: "lib_plant_pot",
      name: "Potted Plant",
      category: "nature",
      thumbnail: "/objects/thumbnails/plant_pot.png",
      modelUrl: "/objects/models/plant_pot.glb",
      tags: ["plant", "nature", "decoration"],
    },
  ],
};

// ============================================
// HELPER: Check if mock mode is enabled
// ============================================

export function isMockModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}

export function isAuthSkipped(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_SKIP_AUTH === "true";
}
