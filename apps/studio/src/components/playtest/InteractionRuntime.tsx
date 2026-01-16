"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePlaytestStore } from "@/stores/playtest-store";
import type { PlacedObject } from "@/lib/objects";
import type { ProximityTrigger, ZoneTrigger, LookTrigger } from "@/lib/interactions";
import { checkProximityTrigger, checkZoneTrigger, type PlayerPosition } from "@/lib/player-runtime";

interface InteractionRuntimeProps {
  enabled?: boolean;
}

export function InteractionRuntime({ enabled = true }: InteractionRuntimeProps) {
  const { camera } = useThree();
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

  // Track look duration for look triggers (key: objectId:interactionId)
  const lookDurationRef = useRef<Map<string, number>>(new Map());

  // Helper to check if player is looking at an object
  const isLookingAt = (objectPos: PlayerPosition, angleThreshold: number): boolean => {
    // Get camera direction
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Get direction from camera to object
    const toObject = new THREE.Vector3(
      objectPos.x - camera.position.x,
      objectPos.y - camera.position.y,
      objectPos.z - camera.position.z
    ).normalize();

    // Calculate angle between camera direction and object direction
    const angle = cameraDirection.angleTo(toObject) * (180 / Math.PI);

    return angle <= angleThreshold;
  };

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

          case "look": {
            const trigger = interaction.trigger as LookTrigger;
            const lookKey = `${object.instanceId}:${interaction.id}`;
            const looking = isLookingAt(objectPos, trigger.angle);

            if (looking) {
              inRange = true;
              // Track look duration
              const currentDuration = lookDurationRef.current.get(lookKey) || 0;
              const newDuration = currentDuration + 16.67; // Approximate ms per frame at 60fps

              if (newDuration >= trigger.duration && currentDuration < trigger.duration) {
                // Just crossed the threshold - trigger!
                shouldTrigger = true;
              }

              lookDurationRef.current.set(lookKey, newDuration);
            } else {
              // Reset look duration when not looking
              lookDurationRef.current.set(lookKey, 0);
            }
            break;
          }

          // Timer triggers are handled separately
          // Click triggers are handled by ClickInteractionHandler
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

            case "look": {
              // Show a cone pointing from the object to indicate look detection area
              const trigger = interaction.trigger as LookTrigger;
              const coneHeight = 2;
              const coneRadius = Math.tan((trigger.angle * Math.PI) / 180) * coneHeight;
              return (
                <mesh
                  key={`${object.instanceId}-${interaction.id}`}
                  position={[pos.x, pos.y + coneHeight / 2, pos.z]}
                  rotation={[Math.PI, 0, 0]}
                >
                  <coneGeometry args={[coneRadius, coneHeight, 16]} />
                  <meshBasicMaterial
                    color="#ff00ff"
                    transparent
                    opacity={0.15}
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
