"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Interaction, TriggerConfig } from "@/lib/interactions";

interface TriggerZoneVisualizationProps {
  interactions: Interaction[];
  position: { x: number; y: number; z: number };
  isSelected: boolean;
}

export function TriggerZoneVisualization({
  interactions,
  position,
  isSelected,
}: TriggerZoneVisualizationProps) {
  // Only show visualization for selected objects
  if (!isSelected || !interactions || interactions.length === 0) {
    return null;
  }

  return (
    <group position={[position.x, position.y, position.z]}>
      {interactions.map((interaction) => (
        <TriggerZone
          key={interaction.id}
          trigger={interaction.trigger}
          enabled={interaction.enabled}
        />
      ))}
    </group>
  );
}

interface TriggerZoneProps {
  trigger: TriggerConfig;
  enabled: boolean;
}

function TriggerZone({ trigger, enabled }: TriggerZoneProps) {
  const opacity = enabled ? 0.15 : 0.05;
  const color = enabled ? "#22c55e" : "#6b7280";
  const wireframeColor = enabled ? "#4ade80" : "#9ca3af";

  // Create geometries based on trigger type
  switch (trigger.type) {
    case "proximity":
      return (
        <ProximityZone
          radius={trigger.radius}
          opacity={opacity}
          color={color}
          wireframeColor={wireframeColor}
        />
      );

    case "enter_zone":
    case "exit_zone":
      return (
        <ZoneTrigger
          shape={trigger.zoneShape}
          size={trigger.zoneSize}
          opacity={opacity}
          color={trigger.type === "exit_zone" ? "#ef4444" : color}
          wireframeColor={trigger.type === "exit_zone" ? "#f87171" : wireframeColor}
        />
      );

    case "look":
      return (
        <LookZone
          angle={trigger.angle}
          opacity={opacity}
          color="#3b82f6"
          wireframeColor="#60a5fa"
        />
      );

    case "collision":
      return (
        <CollisionZone
          opacity={opacity}
          color="#f59e0b"
          wireframeColor="#fbbf24"
        />
      );

    default:
      return null;
  }
}

// Proximity trigger - sphere radius visualization
function ProximityZone({
  radius,
  opacity,
  color,
  wireframeColor,
}: {
  radius: number;
  opacity: number;
  color: string;
  wireframeColor: string;
}) {
  return (
    <group>
      {/* Solid sphere */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Wireframe sphere */}
      <mesh>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial
          color={wireframeColor}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      {/* Radius ring at ground level */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
        <meshBasicMaterial
          color={wireframeColor}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Zone trigger (enter/exit) - box or sphere visualization
function ZoneTrigger({
  shape,
  size,
  opacity,
  color,
  wireframeColor,
}: {
  shape: "sphere" | "box";
  size: { x: number; y: number; z: number };
  opacity: number;
  color: string;
  wireframeColor: string;
}) {
  if (shape === "sphere") {
    const radius = Math.max(size.x, size.y, size.z) / 2;
    return (
      <group>
        <mesh>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial
            color={wireframeColor}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Solid box */}
      <mesh>
        <boxGeometry args={[size.x, size.y, size.z]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Wireframe box */}
      <mesh>
        <boxGeometry args={[size.x, size.y, size.z]} />
        <meshBasicMaterial
          color={wireframeColor}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Corner indicators */}
      <ZoneCorners size={size} color={wireframeColor} />
    </group>
  );
}

// Look trigger - cone visualization for field of view
function LookZone({
  angle,
  opacity,
  color,
  wireframeColor,
}: {
  angle: number;
  opacity: number;
  color: string;
  wireframeColor: string;
}) {
  const coneHeight = 3;
  const coneRadius = useMemo(() => {
    return Math.tan(THREE.MathUtils.degToRad(angle)) * coneHeight;
  }, [angle]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1.5]}>
      {/* Cone representing look direction */}
      <mesh>
        <coneGeometry args={[coneRadius, coneHeight, 32, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <coneGeometry args={[coneRadius, coneHeight, 16, 1, true]} />
        <meshBasicMaterial
          color={wireframeColor}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

// Collision trigger - tight bounding box
function CollisionZone({
  opacity,
  color,
  wireframeColor,
}: {
  opacity: number;
  color: string;
  wireframeColor: string;
}) {
  return (
    <mesh>
      <boxGeometry args={[1.1, 1.1, 1.1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.1, 1.1, 1.1)]} />
        <lineBasicMaterial color={wireframeColor} transparent opacity={0.5} />
      </lineSegments>
    </mesh>
  );
}

// Corner indicators for box zones
function ZoneCorners({
  size,
  color,
}: {
  size: { x: number; y: number; z: number };
  color: string;
}) {
  const cornerSize = 0.1;
  const halfX = size.x / 2;
  const halfY = size.y / 2;
  const halfZ = size.z / 2;

  const corners = [
    [halfX, halfY, halfZ],
    [halfX, halfY, -halfZ],
    [halfX, -halfY, halfZ],
    [halfX, -halfY, -halfZ],
    [-halfX, halfY, halfZ],
    [-halfX, halfY, -halfZ],
    [-halfX, -halfY, halfZ],
    [-halfX, -halfY, -halfZ],
  ];

  return (
    <>
      {corners.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[cornerSize, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}
