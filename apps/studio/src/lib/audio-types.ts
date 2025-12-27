/**
 * Audio Types for Mock Data
 *
 * This module defines the AudioConfig type used by mock data.
 */

export interface AmbientSound {
  id: string;
  name: string;
  url: string;
  volume: number;
  loop: boolean;
  autoplay: boolean;
  fadeIn: number;
  fadeOut: number;
}

export interface AudioZone {
  id: string;
  name: string;
  url: string;
  volume: number;
  loop: boolean;
  zone: {
    center: { x: number; y: number; z: number };
    radius: number;
    falloff: number;
  };
}

export interface AudioInteraction {
  id: string;
  objectId: string;
  audioUrl: string;
  trigger: "click" | "hover" | "proximity";
  volume: number;
}

export interface AudioConfig {
  id: string;
  sceneId: string;
  masterVolume: number;
  ambient: AmbientSound[];
  zones: AudioZone[];
  interactions: AudioInteraction[];
}
