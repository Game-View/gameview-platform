/**
 * Audio System Types for Game View Studio
 *
 * This module defines the audio infrastructure:
 * - Audio assets (sounds, music, ambient)
 * - Scene-level audio configuration
 * - Spatial/3D positioned audio
 * - Directional audio zones
 * - Audio playback settings
 */

// ============================================
// AUDIO ASSET TYPES
// ============================================

export type AudioCategory =
  | "ambient"     // Background environmental sounds (birds, traffic, room tone)
  | "music"       // Background music tracks
  | "sfx"         // Sound effects (clicks, pickups, alerts)
  | "voice"       // Voice recordings, narration
  | "directional" // Zone-based directional audio

export interface AudioAsset {
  id: string;
  name: string;
  description?: string;
  category: AudioCategory;
  url: string;
  duration: number; // Duration in seconds
  fileSize: number; // Size in bytes
  format: "mp3" | "wav" | "ogg" | "m4a";
  waveformUrl?: string; // Preview waveform image
  thumbnailUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Creator info
  userId?: string;
  isBuiltIn: boolean; // Pre-loaded library asset
}

// ============================================
// SCENE-LEVEL AUDIO
// ============================================

export interface SceneAudioConfig {
  // Ambient audio (environmental sounds from video or uploaded)
  ambient: AmbientAudioConfig;

  // Background music
  music: MusicConfig;

  // Audio zones (areas with specific audio)
  audioZones: AudioZone[];

  // Global audio settings
  masterVolume: number; // 0-1
  fadeInDuration: number; // ms
  fadeOutDuration: number; // ms
}

export interface AmbientAudioConfig {
  enabled: boolean;
  audioId?: string; // Reference to AudioAsset
  audioUrl?: string; // Direct URL
  volume: number; // 0-1
  loop: boolean;
  // Spatial ambient (plays from specific position)
  spatial: boolean;
  position?: { x: number; y: number; z: number };
  radius?: number; // How far the sound travels
}

export interface MusicConfig {
  enabled: boolean;
  tracks: MusicTrack[];
  playMode: "sequential" | "shuffle" | "single";
  crossfadeDuration: number; // ms between tracks
}

export interface MusicTrack {
  id: string;
  audioId?: string; // Reference to AudioAsset
  audioUrl?: string; // Direct URL
  name: string;
  volume: number; // 0-1
  loop: boolean;
}

// ============================================
// AUDIO ZONES (Directional Audio)
// ============================================

export type AudioZoneShape = "sphere" | "box" | "cylinder";

export interface AudioZone {
  id: string;
  name: string;
  enabled: boolean;

  // Zone shape and position
  shape: AudioZoneShape;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number }; // For box/cylinder
  radius?: number; // For sphere

  // Audio configuration
  audioId?: string;
  audioUrl?: string;
  volume: number;

  // Behavior
  trigger: AudioZoneTrigger;
  fadeDistance: number; // Distance over which audio fades

  // Directional audio (for scene transitions)
  isDirectional: boolean;
  direction?: { x: number; y: number; z: number }; // Direction the sound comes from
  coneAngle?: number; // Spread angle for directional audio (degrees)

  // Entry/Exit behavior
  onEnter: AudioZoneAction;
  onExit: AudioZoneAction;

  // Linked scene (for scene transitions)
  linkedSceneId?: string;
}

export type AudioZoneTrigger =
  | "proximity"  // Plays when player is near
  | "enter"      // Plays once when entering
  | "stay"       // Loops while in zone
  | "exit"       // Plays once when leaving
  | "direction"; // Plays based on approach direction

export interface AudioZoneAction {
  type: "none" | "play" | "stop" | "fade_in" | "fade_out" | "crossfade";
  targetAudioId?: string; // For crossfade to another audio
  duration?: number; // Fade duration in ms
}

// ============================================
// SPATIAL AUDIO SETTINGS
// ============================================

export interface SpatialAudioSettings {
  enabled: boolean;
  model: "linear" | "inverse" | "exponential"; // Distance model
  refDistance: number; // Distance at which volume is 100%
  maxDistance: number; // Distance at which volume is 0
  rolloffFactor: number; // How quickly sound falls off
  coneInnerAngle: number; // Full volume cone (degrees)
  coneOuterAngle: number; // Reduced volume cone (degrees)
  coneOuterGain: number; // Volume outside cone (0-1)
}

export const defaultSpatialSettings: SpatialAudioSettings = {
  enabled: true,
  model: "inverse",
  refDistance: 1,
  maxDistance: 50,
  rolloffFactor: 1,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
};

// ============================================
// OBJECT AUDIO (For placed objects)
// ============================================

export interface ObjectAudioConfig {
  // Audio that plays from this object's position
  ambient?: {
    audioId?: string;
    audioUrl?: string;
    volume: number;
    loop: boolean;
    autoPlay: boolean;
    spatial: SpatialAudioSettings;
  };

  // Audio triggered by interactions
  interactionSounds: {
    onClick?: string; // audioId
    onHover?: string;
    onCollect?: string;
    onProximityEnter?: string;
    onProximityExit?: string;
  };
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

export const defaultSceneAudioConfig: SceneAudioConfig = {
  ambient: {
    enabled: false,
    volume: 0.5,
    loop: true,
    spatial: false,
  },
  music: {
    enabled: false,
    tracks: [],
    playMode: "sequential",
    crossfadeDuration: 2000,
  },
  audioZones: [],
  masterVolume: 1,
  fadeInDuration: 1000,
  fadeOutDuration: 1000,
};

export const defaultAudioZone: Omit<AudioZone, "id"> = {
  name: "New Audio Zone",
  enabled: true,
  shape: "sphere",
  position: { x: 0, y: 0, z: 0 },
  size: { x: 5, y: 5, z: 5 },
  radius: 5,
  volume: 1,
  trigger: "proximity",
  fadeDistance: 2,
  isDirectional: false,
  onEnter: { type: "fade_in", duration: 500 },
  onExit: { type: "fade_out", duration: 500 },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createAudioZone(name: string, position = { x: 0, y: 0, z: 0 }): AudioZone {
  return {
    id: crypto.randomUUID(),
    ...defaultAudioZone,
    name,
    position,
  };
}

export function createDirectionalAudioZone(
  name: string,
  linkedSceneId: string,
  position: { x: number; y: number; z: number },
  direction: { x: number; y: number; z: number }
): AudioZone {
  return {
    id: crypto.randomUUID(),
    name,
    enabled: true,
    shape: "box",
    position,
    size: { x: 3, y: 3, z: 1 }, // Doorway-sized
    volume: 1,
    trigger: "direction",
    fadeDistance: 2,
    isDirectional: true,
    direction,
    coneAngle: 90,
    onEnter: { type: "crossfade", duration: 1000 },
    onExit: { type: "fade_out", duration: 500 },
    linkedSceneId,
  };
}

export function createMusicTrack(name: string, audioUrl: string): MusicTrack {
  return {
    id: crypto.randomUUID(),
    name,
    audioUrl,
    volume: 1,
    loop: true,
  };
}

// Format duration for display
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Audio category labels
export const audioCategoryLabels: Record<AudioCategory, string> = {
  ambient: "Ambient",
  music: "Music",
  sfx: "Sound Effects",
  voice: "Voice/Narration",
  directional: "Directional",
};

// Zone trigger labels
export const zoneTriggerLabels: Record<AudioZoneTrigger, string> = {
  proximity: "When player is near",
  enter: "When player enters",
  stay: "While player is inside",
  exit: "When player exits",
  direction: "Based on approach direction",
};

// Zone shape labels
export const zoneShapeLabels: Record<AudioZoneShape, string> = {
  sphere: "Sphere",
  box: "Box",
  cylinder: "Cylinder",
};
