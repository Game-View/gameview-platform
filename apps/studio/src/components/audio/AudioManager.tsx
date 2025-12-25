"use client";

import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type SceneAudioConfig, type AudioZone } from "@/lib/audio";

interface AudioManagerProps {
  config: SceneAudioConfig;
  playerPosition?: THREE.Vector3;
  enabled?: boolean;
}

// Audio context singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function AudioManager({
  config,
  playerPosition,
  enabled = true,
}: AudioManagerProps) {
  const { camera } = useThree();

  // Audio refs
  const listenerRef = useRef<THREE.AudioListener | null>(null);
  const ambientAudioRef = useRef<THREE.Audio | null>(null);
  const musicAudioRef = useRef<THREE.Audio | null>(null);
  const zoneAudiosRef = useRef<Map<string, THREE.PositionalAudio>>(new Map());

  // State refs
  const currentMusicIndexRef = useRef(0);
  const activeZonesRef = useRef<Set<string>>(new Set());

  // Initialize audio listener
  useEffect(() => {
    if (!enabled) return;

    const listener = new THREE.AudioListener();
    camera.add(listener);
    listenerRef.current = listener;

    // Set master volume
    listener.setMasterVolume(config.masterVolume);

    return () => {
      camera.remove(listener);
      listenerRef.current = null;
    };
  }, [camera, enabled, config.masterVolume]);

  // Handle ambient audio
  useEffect(() => {
    if (!enabled || !listenerRef.current || !config.ambient.enabled) {
      ambientAudioRef.current?.stop();
      return;
    }

    const { ambient } = config;
    if (!ambient.audioUrl) return;

    const listener = listenerRef.current;
    const audio = new THREE.Audio(listener);
    ambientAudioRef.current = audio;

    const loader = new THREE.AudioLoader();
    loader.load(
      ambient.audioUrl,
      (buffer) => {
        audio.setBuffer(buffer);
        audio.setLoop(ambient.loop);
        audio.setVolume(ambient.volume);
        audio.play();
      },
      undefined,
      (error) => {
        console.error("Failed to load ambient audio:", error);
      }
    );

    return () => {
      audio.stop();
      audio.disconnect();
    };
  }, [enabled, config.ambient]);

  // Handle background music
  useEffect(() => {
    if (!enabled || !listenerRef.current || !config.music.enabled) {
      musicAudioRef.current?.stop();
      return;
    }

    const { music } = config;
    if (music.tracks.length === 0) return;

    const listener = listenerRef.current;
    const audio = new THREE.Audio(listener);
    musicAudioRef.current = audio;

    const playTrack = (index: number) => {
      const track = music.tracks[index];
      if (!track?.audioUrl) return;

      const loader = new THREE.AudioLoader();
      loader.load(
        track.audioUrl,
        (buffer) => {
          if (audio.isPlaying) {
            audio.stop();
          }
          audio.setBuffer(buffer);
          audio.setLoop(music.playMode === "single");
          audio.setVolume(track.volume);
          audio.play();
        },
        undefined,
        (error) => {
          console.error("Failed to load music track:", error);
        }
      );
    };

    // Handle track end
    audio.onEnded = () => {
      if (music.playMode === "single") return;

      let nextIndex = currentMusicIndexRef.current + 1;
      if (music.playMode === "shuffle") {
        nextIndex = Math.floor(Math.random() * music.tracks.length);
      } else if (nextIndex >= music.tracks.length) {
        nextIndex = 0;
      }

      currentMusicIndexRef.current = nextIndex;

      // Crossfade delay
      setTimeout(() => {
        playTrack(nextIndex);
      }, music.crossfadeDuration);
    };

    // Start with first track
    playTrack(currentMusicIndexRef.current);

    return () => {
      audio.stop();
      audio.disconnect();
    };
  }, [enabled, config.music]);

  // Handle audio zones
  useEffect(() => {
    if (!enabled || !listenerRef.current) return;

    const listener = listenerRef.current;
    const loader = new THREE.AudioLoader();

    // Create positional audio for each zone
    config.audioZones.forEach((zone) => {
      if (!zone.enabled || !zone.audioUrl) return;

      const audio = new THREE.PositionalAudio(listener);

      // Configure spatial audio
      audio.setRefDistance(zone.fadeDistance);
      audio.setMaxDistance(zone.radius || 50);
      audio.setDistanceModel("inverse");
      audio.setVolume(zone.volume);

      // Set position
      audio.position.set(zone.position.x, zone.position.y, zone.position.z);

      // Configure directional audio
      if (zone.isDirectional && zone.direction) {
        audio.setDirectionalCone(
          zone.coneAngle || 90,
          (zone.coneAngle || 90) + 30,
          0.1
        );
        // Set direction (rotation)
        const dir = new THREE.Vector3(
          zone.direction.x,
          zone.direction.y,
          zone.direction.z
        ).normalize();
        audio.lookAt(audio.position.clone().add(dir));
      }

      // Load audio
      loader.load(
        zone.audioUrl,
        (buffer) => {
          audio.setBuffer(buffer);
          // Don't auto-play - handle in update loop based on trigger
          if (zone.trigger === "stay") {
            audio.setLoop(true);
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load zone audio (${zone.name}):`, error);
        }
      );

      zoneAudiosRef.current.set(zone.id, audio);
    });

    return () => {
      zoneAudiosRef.current.forEach((audio) => {
        audio.stop();
        audio.disconnect();
      });
      zoneAudiosRef.current.clear();
    };
  }, [enabled, config.audioZones]);

  // Check zone triggers on each frame
  useFrame(() => {
    if (!enabled || !playerPosition) return;

    config.audioZones.forEach((zone) => {
      if (!zone.enabled) return;

      const audio = zoneAudiosRef.current.get(zone.id);
      if (!audio || !audio.buffer) return;

      // Check if player is in zone
      const isInZone = isPositionInZone(playerPosition, zone);
      const wasInZone = activeZonesRef.current.has(zone.id);

      if (isInZone && !wasInZone) {
        // Entered zone
        activeZonesRef.current.add(zone.id);
        handleZoneEnter(zone, audio);
      } else if (!isInZone && wasInZone) {
        // Exited zone
        activeZonesRef.current.delete(zone.id);
        handleZoneExit(zone, audio);
      }
    });
  });

  return null; // This is a logic-only component
}

// Check if position is inside a zone
function isPositionInZone(position: THREE.Vector3, zone: AudioZone): boolean {
  const zonePos = new THREE.Vector3(
    zone.position.x,
    zone.position.y,
    zone.position.z
  );
  const distance = position.distanceTo(zonePos);

  switch (zone.shape) {
    case "sphere":
      return distance <= (zone.radius || 5);

    case "box":
      const halfSize = {
        x: zone.size.x / 2,
        y: zone.size.y / 2,
        z: zone.size.z / 2,
      };
      return (
        Math.abs(position.x - zone.position.x) <= halfSize.x &&
        Math.abs(position.y - zone.position.y) <= halfSize.y &&
        Math.abs(position.z - zone.position.z) <= halfSize.z
      );

    case "cylinder":
      const horizontalDistance = Math.sqrt(
        Math.pow(position.x - zone.position.x, 2) +
          Math.pow(position.z - zone.position.z, 2)
      );
      const verticalDistance = Math.abs(position.y - zone.position.y);
      return (
        horizontalDistance <= zone.size.x / 2 &&
        verticalDistance <= zone.size.y / 2
      );

    default:
      return false;
  }
}

// Handle zone enter
function handleZoneEnter(zone: AudioZone, audio: THREE.PositionalAudio) {
  const { onEnter } = zone;

  switch (onEnter.type) {
    case "play":
      if (!audio.isPlaying) {
        audio.play();
      }
      break;

    case "fade_in":
      audio.setVolume(0);
      if (!audio.isPlaying) {
        audio.play();
      }
      fadeAudio(audio, 0, zone.volume, onEnter.duration || 500);
      break;

    case "stop":
      audio.stop();
      break;

    case "fade_out":
      fadeAudio(audio, audio.getVolume(), 0, onEnter.duration || 500, () => {
        audio.stop();
      });
      break;
  }

  // For "stay" trigger, start playing if not already
  if (zone.trigger === "stay" && !audio.isPlaying) {
    audio.play();
  }
}

// Handle zone exit
function handleZoneExit(zone: AudioZone, audio: THREE.PositionalAudio) {
  const { onExit } = zone;

  switch (onExit.type) {
    case "stop":
      audio.stop();
      break;

    case "fade_out":
      fadeAudio(audio, audio.getVolume(), 0, onExit.duration || 500, () => {
        audio.stop();
      });
      break;

    case "play":
      if (!audio.isPlaying) {
        audio.play();
      }
      break;
  }
}

// Fade audio volume over time
function fadeAudio(
  audio: THREE.Audio | THREE.PositionalAudio,
  fromVolume: number,
  toVolume: number,
  duration: number,
  onComplete?: () => void
) {
  const startTime = performance.now();

  const animate = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentVolume = fromVolume + (toVolume - fromVolume) * progress;
    audio.setVolume(currentVolume);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  animate();
}

// Hook for using audio manager outside of R3F context
export function useAudioManager() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = getAudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playAudio = useCallback(
    async (url: string, options: { volume?: number; loop?: boolean } = {}) => {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();

        source.buffer = audioBuffer;
        source.loop = options.loop || false;
        gainNode.gain.value = options.volume || 1;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();

        const id = crypto.randomUUID();
        audioNodesRef.current.set(id, source);
        gainNodesRef.current.set(id, gainNode);

        source.onended = () => {
          audioNodesRef.current.delete(id);
          gainNodesRef.current.delete(id);
        };

        return id;
      } catch (error) {
        console.error("Failed to play audio:", error);
        return null;
      }
    },
    [initAudio]
  );

  const stopAudio = useCallback((id: string) => {
    const source = audioNodesRef.current.get(id);
    if (source) {
      source.stop();
      audioNodesRef.current.delete(id);
      gainNodesRef.current.delete(id);
    }
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    const gainNode = gainNodesRef.current.get(id);
    if (gainNode) {
      gainNode.gain.value = volume;
    }
  }, []);

  const cleanup = useCallback(() => {
    audioNodesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    });
    audioNodesRef.current.clear();
    gainNodesRef.current.clear();
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    playAudio,
    stopAudio,
    setVolume,
    cleanup,
  };
}
