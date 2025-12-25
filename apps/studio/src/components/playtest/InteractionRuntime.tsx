"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { usePlaytestStore } from "@/stores/playtest-store";
import type { PlacedObject } from "@/lib/objects";
import type { ProximityTrigger, ZoneTrigger } from "@/lib/interactions";
import { checkProximityTrigger, checkZoneTrigger, type PlayerPosition } from "@/lib/player-runtime";

interface InteractionRuntimeProps {
  enabled?: boolean;
}

export function InteractionRuntime({ enabled = true }: InteractionRuntimeProps) {
  const {
    isPlaytestMode,
    isPaused,
    playerState,
    placedObjects,
    triggerInteraction,
    updateInteractionState,
  } = usePlaytestStore();

  // Track which objects were in range last frame (for enter/exit detection)
  const previousInRangeRef = useRef<Map<string, Set<string>>>(new Map());

  // Frame update for proximity-based triggers
  useFrame(() => {
    if (!enabled || !isPlaytestMode || isPaused) return;

    const playerPos = playerState.position;
    const currentInRange = new Map<string, Set<string>>();

    // Check each placed object
    for (const object of placedObjects) {
      if (!object.interactions || object.interactions.length === 0) continue;

      const objectPos: PlayerPosition = {
        x: object.transform.position.x,
        y: object.transform.position.y,
        z: object.transform.position.z,
      };

      // Check each interaction on this object
      for (const interaction of object.interactions) {
        if (!interaction.enabled) continue;

        const prevInRange = previousInRangeRef.current.get(object.instanceId)?.has(interaction.id) ?? false;

        let inRange = false;
        let shouldTrigger = false;

        // Check trigger type
        switch (interaction.trigger.type) {
          case "proximity": {
            const trigger = interaction.trigger as ProximityTrigger;
            inRange = checkProximityTrigger(playerPos, objectPos, trigger.radius);

            // Check enter/exit conditions
            if (inRange && !prevInRange && trigger.onEnter) {
              shouldTrigger = true;
            }
            if (!inRange && prevInRange && trigger.onExit) {
              shouldTrigger = true;
            }
            break;
          }

          case "enter_zone":
          case "exit_zone": {
            const trigger = interaction.trigger as ZoneTrigger;
            inRange = checkZoneTrigger(
              playerPos,
              objectPos,
              trigger.zoneShape,
              trigger.zoneSize
            );

            // Enter zone trigger
            if (trigger.type === "enter_zone" && inRange && !prevInRange) {
              shouldTrigger = true;
            }
            // Exit zone trigger
            if (trigger.type === "exit_zone" && !inRange && prevInRange) {
              shouldTrigger = true;
            }
            break;
          }

          case "collision": {
            // Simple collision check (same as proximity with small radius)
            inRange = checkProximityTrigger(playerPos, objectPos, 0.5);

            if (inRange && !prevInRange) {
              shouldTrigger = true;
            }
            // For continuous collision, trigger every frame
            if (inRange && interaction.trigger.continuous) {
              shouldTrigger = true;
            }
            break;
          }

          // Timer triggers are handled separately
          // Click/look triggers are handled by event system
        }

        // Update in-range tracking
        if (inRange) {
          if (!currentInRange.has(object.instanceId)) {
            currentInRange.set(object.instanceId, new Set());
          }
          currentInRange.get(object.instanceId)!.add(interaction.id);
        }

        // Update interaction state
        updateInteractionState(interaction.id, object.instanceId, { isInRange: inRange });

        // Trigger if conditions met
        if (shouldTrigger) {
          triggerInteraction(interaction.id, object.instanceId);
        }
      }
    }

    // Update previous in-range state
    previousInRangeRef.current = currentInRange;
  });

  // Handle timer triggers
  useEffect(() => {
    if (!enabled || !isPlaytestMode) return;

    const timers: NodeJS.Timeout[] = [];

    for (const object of placedObjects) {
      if (!object.interactions) continue;

      for (const interaction of object.interactions) {
        if (!interaction.enabled || interaction.trigger.type !== "timer") continue;

        const trigger = interaction.trigger;
        const delay = trigger.delay;

        if (trigger.repeat) {
          // Repeating timer
          let count = 0;
          const maxCount = trigger.repeatCount ?? Infinity;

          const interval = setInterval(() => {
            if (count >= maxCount) {
              clearInterval(interval);
              return;
            }
            triggerInteraction(interaction.id, object.instanceId);
            count++;
          }, delay);

          timers.push(interval as unknown as NodeJS.Timeout);
        } else {
          // One-shot timer
          const timeout = setTimeout(() => {
            triggerInteraction(interaction.id, object.instanceId);
          }, delay);

          timers.push(timeout);
        }
      }
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [enabled, isPlaytestMode, placedObjects, triggerInteraction]);

  return null;
}

// Visual debug component for trigger zones
interface TriggerZoneVisualsProps {
  objects: PlacedObject[];
  visible?: boolean;
}

export function TriggerZoneVisuals({ objects, visible = false }: TriggerZoneVisualsProps) {
  if (!visible) return null;

  return (
    <group>
      {objects.map((object) => {
        if (!object.interactions) return null;

        return object.interactions.map((interaction) => {
          if (!interaction.enabled) return null;

          const pos = object.transform.position;

          switch (interaction.trigger.type) {
            case "proximity": {
              const trigger = interaction.trigger as ProximityTrigger;
              return (
                <mesh
                  key={`${object.instanceId}-${interaction.id}`}
                  position={[pos.x, pos.y, pos.z]}
                >
                  <sphereGeometry args={[trigger.radius, 16, 16]} />
                  <meshBasicMaterial
                    color="#00ff00"
                    transparent
                    opacity={0.15}
                    wireframe
                  />
                </mesh>
              );
            }

            case "enter_zone":
            case "exit_zone": {
              const trigger = interaction.trigger as ZoneTrigger;
              if (trigger.zoneShape === "sphere") {
                return (
                  <mesh
                    key={`${object.instanceId}-${interaction.id}`}
                    position={[pos.x, pos.y, pos.z]}
                  >
                    <sphereGeometry args={[trigger.zoneSize.x / 2, 16, 16]} />
                    <meshBasicMaterial
                      color="#0088ff"
                      transparent
                      opacity={0.15}
                      wireframe
                    />
                  </mesh>
                );
              } else {
                return (
                  <mesh
                    key={`${object.instanceId}-${interaction.id}`}
                    position={[pos.x, pos.y, pos.z]}
                  >
                    <boxGeometry args={[trigger.zoneSize.x, trigger.zoneSize.y, trigger.zoneSize.z]} />
                    <meshBasicMaterial
                      color="#0088ff"
                      transparent
                      opacity={0.15}
                      wireframe
                    />
                  </mesh>
                );
              }
            }

            case "collision": {
              return (
                <mesh
                  key={`${object.instanceId}-${interaction.id}`}
                  position={[pos.x, pos.y, pos.z]}
                >
                  <sphereGeometry args={[0.5, 8, 8]} />
                  <meshBasicMaterial
                    color="#ff8800"
                    transparent
                    opacity={0.2}
                    wireframe
                  />
                </mesh>
              );
            }

            default:
              return null;
          }
        });
      })}
    </group>
  );
}
