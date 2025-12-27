"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PortalConfig } from "@/lib/scene-navigation";

interface PortalVisualsProps {
  portal: PortalConfig;
  isNearby?: boolean;
  isInteractable?: boolean;
}

/**
 * Renders a single portal in the 3D scene
 */
export function PortalMesh({ portal, isNearby = false }: PortalVisualsProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRef = useRef<any>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { visuals, size, position, rotation: rot } = portal;

  // Parse portal color
  const color = useMemo(() => new THREE.Color(visuals.color), [visuals.color]);

  // Create particle positions for swirling effect
  const particlePositions = useMemo(() => {
    if (!visuals.particleEffect) return null;
    const count = 50;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * size.height * 0.8;
      positions[i * 3 + 2] = Math.sin(angle) * 0.1;
    }
    return positions;
  }, [visuals.particleEffect, size.height]);

  // Animation frame
  useFrame((_, delta) => {
    timeRef.current += delta;

    // Pulse animation
    if (visuals.pulseAnimation && glowRef.current) {
      const pulse = 0.8 + Math.sin(timeRef.current * 2) * 0.2;
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = pulse * 0.5;
    }

    // Particle rotation
    if (particlesRef.current && visuals.particleEffect) {
      particlesRef.current.rotation.z = timeRef.current * 0.5;
    }

    // Nearby glow boost
    if (meshRef.current && isNearby) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = visuals.emissiveIntensity * 1.5;
    }
  });

  // Render based on portal style
  const renderPortalShape = () => {
    switch (visuals.style) {
      case "door":
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[size.width, size.height, 0.1]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={visuals.emissiveIntensity}
              transparent
              opacity={0.7}
            />
          </mesh>
        );

      case "archway":
        return (
          <group ref={meshRef}>
            {/* Left pillar */}
            <mesh position={[-size.width / 2 + 0.15, 0, 0]}>
              <boxGeometry args={[0.3, size.height, 0.3]} />
              <meshStandardMaterial color="#444444" />
            </mesh>
            {/* Right pillar */}
            <mesh position={[size.width / 2 - 0.15, 0, 0]}>
              <boxGeometry args={[0.3, size.height, 0.3]} />
              <meshStandardMaterial color="#444444" />
            </mesh>
            {/* Arch top */}
            <mesh position={[0, size.height / 2 - 0.15, 0]}>
              <boxGeometry args={[size.width, 0.3, 0.3]} />
              <meshStandardMaterial color="#444444" />
            </mesh>
            {/* Portal surface */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[size.width - 0.3, size.height - 0.3]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={visuals.emissiveIntensity}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );

      case "circular":
        return (
          <mesh ref={meshRef} rotation={[0, 0, 0]}>
            <circleGeometry args={[size.width / 2, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={visuals.emissiveIntensity}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        );

      case "invisible":
        // Only render in debug/edit mode - just show wireframe trigger zone
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[size.width, size.height, size.depth]} />
            <meshBasicMaterial
              color="#ffff00"
              wireframe
              transparent
              opacity={0.3}
            />
          </mesh>
        );

      default:
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[size.width, size.height, 0.1]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={visuals.emissiveIntensity}
              transparent
              opacity={0.7}
            />
          </mesh>
        );
    }
  };

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[
        (rot.x * Math.PI) / 180,
        (rot.y * Math.PI) / 180,
        (rot.z * Math.PI) / 180,
      ]}
    >
      {/* Main portal shape */}
      {renderPortalShape()}

      {/* Outer glow */}
      {visuals.style !== "invisible" && (
        <mesh ref={glowRef} scale={[1.1, 1.05, 1]}>
          <planeGeometry args={[size.width, size.height]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Particles */}
      {particlePositions && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particlePositions.length / 3}
              array={particlePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={color}
            size={0.05}
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}

      {/* Interaction prompt (when nearby) */}
      {isNearby && portal.triggerType === "interact" && (
        <sprite position={[0, size.height / 2 + 0.5, 0]} scale={[2, 0.5, 1]}>
          <spriteMaterial color="white" opacity={0.9} transparent />
        </sprite>
      )}
    </group>
  );
}

interface PortalsRendererProps {
  portals: PortalConfig[];
  playerPosition: { x: number; y: number; z: number };
  nearbyDistance?: number;
}

/**
 * Renders all portals in a scene
 */
export function PortalsRenderer({
  portals,
  playerPosition,
  nearbyDistance = 3,
}: PortalsRendererProps) {
  return (
    <group>
      {portals
        .filter((p) => p.enabled)
        .map((portal) => {
          const dx = playerPosition.x - portal.position.x;
          const dy = playerPosition.y - portal.position.y;
          const dz = playerPosition.z - portal.position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const isNearby = distance < nearbyDistance;

          return (
            <PortalMesh
              key={portal.id}
              portal={portal}
              isNearby={isNearby}
            />
          );
        })}
    </group>
  );
}

/**
 * Editor-mode portal preview (simpler rendering)
 */
export function PortalPreview({ portal }: { portal: PortalConfig }) {
  const color = useMemo(() => new THREE.Color(portal.visuals.color), [portal.visuals.color]);

  return (
    <group
      position={[portal.position.x, portal.position.y, portal.position.z]}
      rotation={[
        (portal.rotation.x * Math.PI) / 180,
        (portal.rotation.y * Math.PI) / 180,
        (portal.rotation.z * Math.PI) / 180,
      ]}
    >
      {/* Portal frame */}
      <mesh>
        <boxGeometry args={[portal.size.width, portal.size.height, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Direction indicator */}
      <arrowHelper
        args={[
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0.2),
          1,
          0x00ff00,
        ]}
      />
    </group>
  );
}

/**
 * Spawn point visual marker for editor
 */
export function SpawnPointMarker({
  position,
  rotation,
  isDefault,
  isSelected,
}: {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number };
  isDefault?: boolean;
  isSelected?: boolean;
}) {
  const color = isDefault ? "#00ff00" : "#ffaa00";
  const yawRad = (rotation.yaw * Math.PI) / 180;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Base circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.9 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Player silhouette */}
      <mesh position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
      </mesh>

      {/* Direction arrow */}
      <group rotation={[0, yawRad, 0]}>
        <mesh position={[0, 0.1, 0.6]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>

      {/* Height indicator */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, -position.y, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.5} />
      </line>
    </group>
  );
}
