"use client";

import { useState, useCallback } from "react";
import {
  DoorOpen,
  Plus,
  Trash2,
  MapPin,
  Link2,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Settings,
  Palette,
} from "lucide-react";
import type {
  PortalConfig,
  SpawnPoint,
  PortalStyle,
  TransitionEffect,
} from "@/lib/scene-navigation";
import { createDefaultPortal, createSpawnPoint } from "@/lib/scene-navigation";

// ============================================
// PORTAL EDITOR PANEL
// ============================================

interface PortalEditorProps {
  portals: PortalConfig[];
  spawnPoints: SpawnPoint[];
  availableScenes: Array<{ id: string; name: string }>;
  onPortalsChange: (portals: PortalConfig[]) => void;
  onSpawnPointsChange: (spawnPoints: SpawnPoint[]) => void;
  selectedPortalId?: string | null;
  selectedSpawnId?: string | null;
  onSelectPortal?: (portalId: string | null) => void;
  onSelectSpawn?: (spawnId: string | null) => void;
}

export function PortalEditor({
  portals,
  spawnPoints,
  availableScenes,
  onPortalsChange,
  onSpawnPointsChange,
  selectedPortalId,
  selectedSpawnId,
  onSelectPortal,
  onSelectSpawn,
}: PortalEditorProps) {
  const [expandedSection, setExpandedSection] = useState<"portals" | "spawns" | null>("portals");

  const handleAddPortal = useCallback(() => {
    const defaultScene = availableScenes[0];
    const newPortal = createDefaultPortal(
      `Portal ${portals.length + 1}`,
      { x: 0, y: 1.5, z: 0 },
      defaultScene?.id ?? ""
    );
    onPortalsChange([...portals, newPortal]);
    onSelectPortal?.(newPortal.id);
  }, [portals, availableScenes, onPortalsChange, onSelectPortal]);

  const handleAddSpawnPoint = useCallback(() => {
    const newSpawn = createSpawnPoint(
      `Spawn ${spawnPoints.length + 1}`,
      { x: 0, y: 1.6, z: 0 },
      { pitch: 0, yaw: 0 },
      spawnPoints.length === 0 // First spawn is default
    );
    onSpawnPointsChange([...spawnPoints, newSpawn]);
    onSelectSpawn?.(newSpawn.id);
  }, [spawnPoints, onSpawnPointsChange, onSelectSpawn]);

  const handleDeletePortal = useCallback(
    (portalId: string) => {
      onPortalsChange(portals.filter((p) => p.id !== portalId));
      if (selectedPortalId === portalId) {
        onSelectPortal?.(null);
      }
    },
    [portals, selectedPortalId, onPortalsChange, onSelectPortal]
  );

  const handleDeleteSpawn = useCallback(
    (spawnId: string) => {
      onSpawnPointsChange(spawnPoints.filter((s) => s.id !== spawnId));
      if (selectedSpawnId === spawnId) {
        onSelectSpawn?.(null);
      }
    },
    [spawnPoints, selectedSpawnId, onSpawnPointsChange, onSelectSpawn]
  );

  const handleUpdatePortal = useCallback(
    (portalId: string, updates: Partial<PortalConfig>) => {
      onPortalsChange(
        portals.map((p) => (p.id === portalId ? { ...p, ...updates } : p))
      );
    },
    [portals, onPortalsChange]
  );

  const handleUpdateSpawn = useCallback(
    (spawnId: string, updates: Partial<SpawnPoint>) => {
      // If setting as default, unset other defaults
      if (updates.isDefault) {
        onSpawnPointsChange(
          spawnPoints.map((s) => ({
            ...s,
            isDefault: s.id === spawnId,
            ...(s.id === spawnId ? updates : {}),
          }))
        );
      } else {
        onSpawnPointsChange(
          spawnPoints.map((s) => (s.id === spawnId ? { ...s, ...updates } : s))
        );
      }
    },
    [spawnPoints, onSpawnPointsChange]
  );

  const selectedPortal = portals.find((p) => p.id === selectedPortalId);
  const selectedSpawn = spawnPoints.find((s) => s.id === selectedSpawnId);

  return (
    <div className="h-full flex flex-col bg-gv-neutral-900">
      {/* Header */}
      <div className="p-3 border-b border-gv-neutral-700">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Link2 className="h-4 w-4 text-gv-primary-400" />
          Scene Navigation
        </h3>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Portals Section */}
        <div className="border-b border-gv-neutral-700">
          <button
            onClick={() => setExpandedSection(expandedSection === "portals" ? null : "portals")}
            className="w-full p-3 flex items-center justify-between text-sm font-medium text-white hover:bg-gv-neutral-800"
          >
            <span className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-blue-400" />
              Portals ({portals.length})
            </span>
            {expandedSection === "portals" ? (
              <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gv-neutral-400" />
            )}
          </button>

          {expandedSection === "portals" && (
            <div className="p-2 space-y-2">
              {/* Portal List */}
              {portals.map((portal) => (
                <PortalListItem
                  key={portal.id}
                  portal={portal}
                  isSelected={portal.id === selectedPortalId}
                  scenes={availableScenes}
                  onSelect={() => onSelectPortal?.(portal.id)}
                  onDelete={() => handleDeletePortal(portal.id)}
                  onUpdate={(updates) => handleUpdatePortal(portal.id, updates)}
                />
              ))}

              {/* Add Portal Button */}
              <button
                onClick={handleAddPortal}
                className="w-full p-2 flex items-center justify-center gap-2 text-sm text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800 rounded border border-dashed border-gv-neutral-600 hover:border-gv-primary-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Portal
              </button>
            </div>
          )}
        </div>

        {/* Spawn Points Section */}
        <div className="border-b border-gv-neutral-700">
          <button
            onClick={() => setExpandedSection(expandedSection === "spawns" ? null : "spawns")}
            className="w-full p-3 flex items-center justify-between text-sm font-medium text-white hover:bg-gv-neutral-800"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-400" />
              Spawn Points ({spawnPoints.length})
            </span>
            {expandedSection === "spawns" ? (
              <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gv-neutral-400" />
            )}
          </button>

          {expandedSection === "spawns" && (
            <div className="p-2 space-y-2">
              {/* Spawn List */}
              {spawnPoints.map((spawn) => (
                <SpawnListItem
                  key={spawn.id}
                  spawn={spawn}
                  isSelected={spawn.id === selectedSpawnId}
                  onSelect={() => onSelectSpawn?.(spawn.id)}
                  onDelete={() => handleDeleteSpawn(spawn.id)}
                  onUpdate={(updates) => handleUpdateSpawn(spawn.id, updates)}
                />
              ))}

              {/* Add Spawn Button */}
              <button
                onClick={handleAddSpawnPoint}
                className="w-full p-2 flex items-center justify-center gap-2 text-sm text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800 rounded border border-dashed border-gv-neutral-600 hover:border-gv-primary-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Spawn Point
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Item Details */}
      {selectedPortal && (
        <PortalDetails
          portal={selectedPortal}
          scenes={availableScenes}
          spawnPoints={spawnPoints}
          onUpdate={(updates) => handleUpdatePortal(selectedPortal.id, updates)}
        />
      )}

      {selectedSpawn && !selectedPortal && (
        <SpawnDetails
          spawn={selectedSpawn}
          onUpdate={(updates) => handleUpdateSpawn(selectedSpawn.id, updates)}
        />
      )}
    </div>
  );
}

// ============================================
// PORTAL LIST ITEM
// ============================================

function PortalListItem({
  portal,
  isSelected,
  scenes,
  onSelect,
  onDelete,
  onUpdate,
}: {
  portal: PortalConfig;
  isSelected: boolean;
  scenes: Array<{ id: string; name: string }>;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<PortalConfig>) => void;
}) {
  const destinationScene = scenes.find((s) => s.id === portal.destinationSceneId);

  return (
    <div
      onClick={onSelect}
      className={`p-2 rounded cursor-pointer transition-colors ${
        isSelected
          ? "bg-gv-primary-500/20 border border-gv-primary-500"
          : "bg-gv-neutral-800 hover:bg-gv-neutral-700 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-white truncate">{portal.name}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ enabled: !portal.enabled });
            }}
            className="p-1 hover:bg-gv-neutral-600 rounded"
            title={portal.enabled ? "Disable" : "Enable"}
          >
            {portal.enabled ? (
              <Eye className="h-3 w-3 text-green-400" />
            ) : (
              <EyeOff className="h-3 w-3 text-gv-neutral-500" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ locked: !portal.locked });
            }}
            className="p-1 hover:bg-gv-neutral-600 rounded"
            title={portal.locked ? "Unlock" : "Lock"}
          >
            {portal.locked ? (
              <Lock className="h-3 w-3 text-yellow-400" />
            ) : (
              <Unlock className="h-3 w-3 text-gv-neutral-400" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-500/20 rounded"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-red-400" />
          </button>
        </div>
      </div>
      <div className="text-xs text-gv-neutral-400 flex items-center gap-1">
        <span>→</span>
        <span className="truncate">{destinationScene?.name ?? "No destination"}</span>
      </div>
    </div>
  );
}

// ============================================
// SPAWN LIST ITEM
// ============================================

function SpawnListItem({
  spawn,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
}: {
  spawn: SpawnPoint;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<SpawnPoint>) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-2 rounded cursor-pointer transition-colors ${
        isSelected
          ? "bg-gv-primary-500/20 border border-gv-primary-500"
          : "bg-gv-neutral-800 hover:bg-gv-neutral-700 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white truncate flex items-center gap-2">
          {spawn.name}
          {spawn.isDefault && (
            <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
              Default
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {!spawn.isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ isDefault: true });
              }}
              className="p-1 hover:bg-gv-neutral-600 rounded text-xs text-gv-neutral-400"
              title="Set as default"
            >
              Set Default
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-500/20 rounded"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PORTAL DETAILS PANEL
// ============================================

const PORTAL_STYLES: { value: PortalStyle; label: string }[] = [
  { value: "door", label: "Door" },
  { value: "archway", label: "Archway" },
  { value: "circular", label: "Circular" },
  { value: "invisible", label: "Invisible (Trigger Zone)" },
];

const TRANSITION_EFFECTS: { value: TransitionEffect; label: string }[] = [
  { value: "fade", label: "Fade" },
  { value: "dissolve", label: "Dissolve" },
  { value: "slide_left", label: "Slide Left" },
  { value: "slide_right", label: "Slide Right" },
  { value: "slide_up", label: "Slide Up" },
  { value: "slide_down", label: "Slide Down" },
  { value: "zoom", label: "Zoom" },
  { value: "instant", label: "Instant" },
];

function PortalDetails({
  portal,
  scenes,
  spawnPoints,
  onUpdate,
}: {
  portal: PortalConfig;
  scenes: Array<{ id: string; name: string }>;
  spawnPoints: SpawnPoint[];
  onUpdate: (updates: Partial<PortalConfig>) => void;
}) {
  return (
    <div className="border-t border-gv-neutral-700 p-3 space-y-3 max-h-[50%] overflow-y-auto">
      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
        <Settings className="h-4 w-4 text-gv-primary-400" />
        Portal Settings
      </h4>

      {/* Name */}
      <div>
        <label className="text-xs text-gv-neutral-400 block mb-1">Name</label>
        <input
          type="text"
          value={portal.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
        />
      </div>

      {/* Destination */}
      <div>
        <label className="text-xs text-gv-neutral-400 block mb-1">Destination Scene</label>
        <select
          value={portal.destinationSceneId}
          onChange={(e) => onUpdate({ destinationSceneId: e.target.value })}
          className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
        >
          <option value="">Select scene...</option>
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
      </div>

      {/* Destination Spawn */}
      <div>
        <label className="text-xs text-gv-neutral-400 block mb-1">Spawn Point</label>
        <select
          value={portal.destinationSpawnId}
          onChange={(e) => onUpdate({ destinationSpawnId: e.target.value })}
          className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
        >
          <option value="default">Default Spawn</option>
          {spawnPoints.map((spawn) => (
            <option key={spawn.id} value={spawn.id}>
              {spawn.name}
            </option>
          ))}
        </select>
      </div>

      {/* Portal Style */}
      <div>
        <label className="text-xs text-gv-neutral-400 block mb-1">Style</label>
        <select
          value={portal.visuals.style}
          onChange={(e) =>
            onUpdate({
              visuals: { ...portal.visuals, style: e.target.value as PortalStyle },
            })
          }
          className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
        >
          {PORTAL_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {/* Trigger Type */}
      <div>
        <label className="text-xs text-gv-neutral-400 block mb-1">Trigger</label>
        <select
          value={portal.triggerType}
          onChange={(e) =>
            onUpdate({ triggerType: e.target.value as "enter" | "interact" | "key_required" })
          }
          className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
        >
          <option value="enter">Walk Through</option>
          <option value="interact">Press E to Enter</option>
          <option value="key_required">Key Required</option>
        </select>
      </div>

      {/* Transition Effect */}
      <div>
        <label className="text-xs text-gv-neutral-400 block mb-1">Transition Effect</label>
        <select
          value={portal.transitionEffect}
          onChange={(e) =>
            onUpdate({ transitionEffect: e.target.value as TransitionEffect })
          }
          className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
        >
          {TRANSITION_EFFECTS.map((effect) => (
            <option key={effect.value} value={effect.value}>
              {effect.label}
            </option>
          ))}
        </select>
      </div>

      {/* Portal Color */}
      <div>
        <label className="text-xs text-gv-neutral-400 block mb-1 flex items-center gap-1">
          <Palette className="h-3 w-3" />
          Portal Color
        </label>
        <input
          type="color"
          value={portal.visuals.color}
          onChange={(e) =>
            onUpdate({
              visuals: { ...portal.visuals, color: e.target.value },
            })
          }
          className="w-full h-8 bg-gv-neutral-800 border border-gv-neutral-600 rounded cursor-pointer"
        />
      </div>

      {/* Visual Effects */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={portal.visuals.particleEffect}
            onChange={(e) =>
              onUpdate({
                visuals: { ...portal.visuals, particleEffect: e.target.checked },
              })
            }
            className="rounded border-gv-neutral-600"
          />
          <Sparkles className="h-4 w-4 text-gv-primary-400" />
          Particles
        </label>
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={portal.visuals.pulseAnimation}
            onChange={(e) =>
              onUpdate({
                visuals: { ...portal.visuals, pulseAnimation: e.target.checked },
              })
            }
            className="rounded border-gv-neutral-600"
          />
          Pulse
        </label>
      </div>
    </div>
  );
}

// ============================================
// SPAWN DETAILS PANEL
// ============================================

function SpawnDetails({
  spawn,
  onUpdate,
}: {
  spawn: SpawnPoint;
  onUpdate: (updates: Partial<SpawnPoint>) => void;
}) {
  return (
    <div className="border-t border-gv-neutral-700 p-3 space-y-3">
      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
        <MapPin className="h-4 w-4 text-green-400" />
        Spawn Point Settings
      </h4>

      {/* Name */}
      <div>
        <label className="text-xs text-gv-neutral-400 block mb-1">Name</label>
        <input
          type="text"
          value={spawn.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
        />
      </div>

      {/* Position */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gv-neutral-400 block mb-1">X</label>
          <input
            type="number"
            step="0.1"
            value={spawn.position.x}
            onChange={(e) =>
              onUpdate({
                position: { ...spawn.position, x: parseFloat(e.target.value) || 0 },
              })
            }
            className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gv-neutral-400 block mb-1">Y</label>
          <input
            type="number"
            step="0.1"
            value={spawn.position.y}
            onChange={(e) =>
              onUpdate({
                position: { ...spawn.position, y: parseFloat(e.target.value) || 0 },
              })
            }
            className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gv-neutral-400 block mb-1">Z</label>
          <input
            type="number"
            step="0.1"
            value={spawn.position.z}
            onChange={(e) =>
              onUpdate({
                position: { ...spawn.position, z: parseFloat(e.target.value) || 0 },
              })
            }
            className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gv-neutral-400 block mb-1">Yaw (°)</label>
          <input
            type="number"
            step="15"
            value={spawn.rotation.yaw}
            onChange={(e) =>
              onUpdate({
                rotation: { ...spawn.rotation, yaw: parseFloat(e.target.value) || 0 },
              })
            }
            className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gv-neutral-400 block mb-1">Pitch (°)</label>
          <input
            type="number"
            step="5"
            value={spawn.rotation.pitch}
            onChange={(e) =>
              onUpdate({
                rotation: { ...spawn.rotation, pitch: parseFloat(e.target.value) || 0 },
              })
            }
            className="w-full px-2 py-1 text-sm bg-gv-neutral-800 border border-gv-neutral-600 rounded text-white"
          />
        </div>
      </div>

      {/* Default Toggle */}
      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
        <input
          type="checkbox"
          checked={spawn.isDefault}
          onChange={(e) => onUpdate({ isDefault: e.target.checked })}
          className="rounded border-gv-neutral-600"
        />
        Set as default spawn point
      </label>
    </div>
  );
}
