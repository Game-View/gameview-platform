"use client";

import { useRef, useEffect, useCallback, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Grid,
  useGLTF,
  Html,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import * as THREE from "three";
import { Loader2 } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import type { PlacedObject, ObjectTransform } from "@/lib/objects";
import { TriggerZoneVisualization } from "./TriggerZoneVisualization";
import { GaussianSplats } from "@/components/viewer/GaussianSplats";

interface SceneEditorProps {
  splatUrl?: string;
  onSave?: (objects: PlacedObject[]) => void;
}

export function SceneEditor({ splatUrl, onSave }: SceneEditorProps) {
  const { placedObjects, isDirty } = useEditorStore();

  // Auto-save when dirty
  useEffect(() => {
    if (!isDirty || !onSave) return;

    const timeout = setTimeout(() => {
      onSave(placedObjects);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isDirty, placedObjects, onSave]);

  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      onPointerMissed={() => {
        // Deselect when clicking empty space
        useEditorStore.getState().selectObject(null);
      }}
    >
      <Suspense fallback={<LoadingIndicator />}>
        <EditorScene splatUrl={splatUrl} />
      </Suspense>
    </Canvas>
  );
}

// Loading indicator
function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex flex-col items-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-gv-primary-500 mb-2" />
        <p className="text-sm text-gv-neutral-400">Loading scene...</p>
      </div>
    </Html>
  );
}

// Main editor scene
interface EditorSceneProps {
  splatUrl?: string;
}

function EditorScene({ splatUrl }: EditorSceneProps) {
  const [splatLoaded, setSplatLoaded] = useState(false);
  const [splatError, setSplatError] = useState<string | null>(null);
  const [splatProgress, setSplatProgress] = useState(0);

  const {
    placedObjects,
    selectedObjectId,
    transformMode,
    snapEnabled,
    snapTranslate,
    snapRotate,
    snapScale,
    showGrid,
    showGizmo,
    selectObject,
    setHoveredObject,
    updateObjectTransform,
    setIsTransforming,
  } = useEditorStore();

  const transformRef = useRef<THREE.Group>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orbitRef = useRef<any>(null);

  // Get selected object
  const selectedObject = placedObjects.find((o) => o.instanceId === selectedObjectId);

  // Handle transform change
  const handleTransformChange = useCallback(() => {
    if (!transformRef.current || !selectedObjectId) return;

    const position = transformRef.current.position;
    const rotation = transformRef.current.rotation;
    const scale = transformRef.current.scale;

    const newTransform: ObjectTransform = {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: {
        x: THREE.MathUtils.radToDeg(rotation.x),
        y: THREE.MathUtils.radToDeg(rotation.y),
        z: THREE.MathUtils.radToDeg(rotation.z),
      },
      scale: { x: scale.x, y: scale.y, z: scale.z },
    };

    updateObjectTransform(selectedObjectId, newTransform);
  }, [selectedObjectId, updateObjectTransform]);

  // Get snap value based on mode
  const getSnapValue = () => {
    if (!snapEnabled) return undefined;
    switch (transformMode) {
      case "translate":
        return snapTranslate;
      case "rotate":
        return THREE.MathUtils.degToRad(snapRotate);
      case "scale":
        return snapScale;
      default:
        return undefined;
    }
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />

      {/* Grid */}
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#4a4a4a"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#666666"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          position={[0, 0, 0]}
        />
      )}

      {/* Orbit Controls */}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={50}
      />

      {/* Gizmo Helper */}
      {showGizmo && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>
      )}

      {/* Placed Objects */}
      {placedObjects.map((obj) => (
        <PlacedObjectMesh
          key={obj.instanceId}
          object={obj}
          isSelected={obj.instanceId === selectedObjectId}
          isHovered={false}
          onSelect={() => selectObject(obj.instanceId)}
          onHover={(hovered) => setHoveredObject(hovered ? obj.instanceId : null)}
          ref={obj.instanceId === selectedObjectId ? transformRef : undefined}
        />
      ))}

      {/* Transform Controls */}
      {selectedObject && transformRef.current && (
        <TransformControls
          object={transformRef.current}
          mode={transformMode}
          translationSnap={getSnapValue()}
          rotationSnap={transformMode === "rotate" ? getSnapValue() : undefined}
          scaleSnap={transformMode === "scale" ? getSnapValue() : undefined}
          onMouseDown={() => {
            setIsTransforming(true);
            if (orbitRef.current) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (orbitRef.current as any).enabled = false;
            }
          }}
          onMouseUp={() => {
            setIsTransforming(false);
            handleTransformChange();
            if (orbitRef.current) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (orbitRef.current as any).enabled = true;
            }
          }}
        />
      )}

      {/* Drop zone plane (invisible) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
        onPointerDown={(e) => {
          e.stopPropagation();
          selectObject(null);
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Gaussian Splat 3D Scene Background */}
      {splatUrl && (
        <GaussianSplats
          url={splatUrl}
          onLoad={() => setSplatLoaded(true)}
          onError={(err) => {
            console.error("Failed to load Gaussian splats:", err);
            setSplatError(err.message);
          }}
          onProgress={(progress) => setSplatProgress(progress)}
        />
      )}

      {/* Splat loading indicator */}
      {splatUrl && !splatLoaded && !splatError && (
        <Html center position={[0, 2, 0]}>
          <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-gv text-center">
            <div className="text-sm text-white mb-1">Loading 3D scene...</div>
            <div className="w-32 h-1.5 bg-gv-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gv-primary-500 transition-all duration-300"
                style={{ width: `${splatProgress}%` }}
              />
            </div>
            <div className="text-xs text-gv-neutral-400 mt-1">{Math.round(splatProgress)}%</div>
          </div>
        </Html>
      )}

      {/* Splat error indicator */}
      {splatError && (
        <Html center position={[0, 2, 0]}>
          <div className="bg-red-900/80 backdrop-blur-sm px-4 py-2 rounded-gv text-center max-w-xs">
            <div className="text-sm text-red-200 font-medium">Failed to load 3D scene</div>
            <div className="text-xs text-red-300 mt-1">{splatError}</div>
          </div>
        </Html>
      )}
    </>
  );
}

// Placed object mesh component
interface PlacedObjectMeshProps {
  object: PlacedObject;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

const PlacedObjectMesh = ({ object, isSelected, onSelect, onHover, ref }: PlacedObjectMeshProps & { ref?: React.Ref<THREE.Group> }) => {
  const { transform, modelUrl } = object;

  // Check if it's a real model URL or placeholder
  const isGLTF = modelUrl.endsWith(".gltf") || modelUrl.endsWith(".glb");

  return (
    <group
      ref={ref}
      position={[transform.position.x, transform.position.y, transform.position.z]}
      rotation={[
        THREE.MathUtils.degToRad(transform.rotation.x),
        THREE.MathUtils.degToRad(transform.rotation.y),
        THREE.MathUtils.degToRad(transform.rotation.z),
      ]}
      scale={[transform.scale.x, transform.scale.y, transform.scale.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.cursor = "auto";
      }}
    >
      {isGLTF ? (
        <Suspense fallback={<PlaceholderMesh isSelected={isSelected} />}>
          <GLTFObject url={modelUrl} isSelected={isSelected} />
        </Suspense>
      ) : (
        <PlaceholderMesh isSelected={isSelected} />
      )}

      {/* Selection outline */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshBasicMaterial color="#4f46e5" wireframe transparent opacity={0.5} />
        </mesh>
      )}

      {/* Trigger zone visualization */}
      <TriggerZoneVisualization
        interactions={object.interactions || []}
        position={{ x: 0, y: 0, z: 0 }}
        isSelected={isSelected}
      />
    </group>
  );
};

// Placeholder mesh for objects without real models
function PlaceholderMesh({ isSelected }: { isSelected: boolean }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={isSelected ? "#6366f1" : "#4f46e5"}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

// GLTF model loader
function GLTFObject({ url, isSelected }: { url: string; isSelected: boolean }) {
  const { scene } = useGLTF(url);

  // Clone the scene to avoid sharing materials
  const clonedScene = scene.clone();

  // Apply selection highlight
  if (isSelected) {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.emissive) {
          material.emissive = new THREE.Color(0x4f46e5);
          material.emissiveIntensity = 0.2;
        }
      }
    });
  }

  return <primitive object={clonedScene} />;
}
