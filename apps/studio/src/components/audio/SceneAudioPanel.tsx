"use client";

import { useState } from "react";
import {
  Volume2,
  Music,
  Wind,
  Radio,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Box,
  Circle,
} from "lucide-react";
import {
  type SceneAudioConfig,
  type AudioZone,
  type MusicTrack,
  type AudioZoneShape,
  type AudioZoneTrigger,
  createAudioZone,
  createMusicTrack,
  zoneTriggerLabels,
  zoneShapeLabels,
  defaultSceneAudioConfig,
} from "@/lib/audio";

interface SceneAudioPanelProps {
  config: SceneAudioConfig;
  onChange: (config: SceneAudioConfig) => void;
  className?: string;
}

type TabId = "ambient" | "music" | "zones";

export function SceneAudioPanel({
  config,
  onChange,
  className = "",
}: SceneAudioPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("ambient");

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "ambient", label: "Ambient", icon: <Wind className="h-4 w-4" /> },
    { id: "music", label: "Music", icon: <Music className="h-4 w-4" /> },
    { id: "zones", label: "Audio Zones", icon: <Radio className="h-4 w-4" /> },
  ];

  return (
    <div className={`bg-gv-neutral-900 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gv-neutral-800">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-gv-primary-400" />
          Scene Audio
        </h3>

        {/* Master Volume */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-gv-neutral-400">Master</span>
          <input
            type="range"
            value={config.masterVolume}
            onChange={(e) =>
              onChange({ ...config, masterVolume: parseFloat(e.target.value) })
            }
            min={0}
            max={1}
            step={0.05}
            className="flex-1"
          />
          <span className="text-xs text-white w-8">
            {Math.round(config.masterVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gv-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? "text-gv-primary-400 border-b-2 border-gv-primary-400 bg-gv-neutral-800/50"
                : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800/30"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "ambient" && (
          <AmbientTab config={config} onChange={onChange} />
        )}
        {activeTab === "music" && (
          <MusicTab config={config} onChange={onChange} />
        )}
        {activeTab === "zones" && (
          <AudioZonesTab config={config} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

// ============================================
// AMBIENT TAB
// ============================================

function AmbientTab({
  config,
  onChange,
}: {
  config: SceneAudioConfig;
  onChange: (config: SceneAudioConfig) => void;
}) {
  const { ambient } = config;

  const updateAmbient = (updates: Partial<typeof ambient>) => {
    onChange({
      ...config,
      ambient: { ...ambient, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Enable Ambient Audio</span>
        <button onClick={() => updateAmbient({ enabled: !ambient.enabled })}>
          {ambient.enabled ? (
            <ToggleRight className="h-5 w-5 text-green-500" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-gv-neutral-500" />
          )}
        </button>
      </div>

      {ambient.enabled && (
        <>
          {/* Audio URL */}
          <div>
            <label className="block text-xs text-gv-neutral-400 mb-1">
              Audio URL
            </label>
            <input
              type="text"
              value={ambient.audioUrl || ""}
              onChange={(e) => updateAmbient({ audioUrl: e.target.value })}
              placeholder="https://example.com/ambient.mp3"
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white text-sm"
            />
          </div>

          {/* Volume */}
          <div>
            <label className="block text-xs text-gv-neutral-400 mb-1">
              Volume
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                value={ambient.volume}
                onChange={(e) =>
                  updateAmbient({ volume: parseFloat(e.target.value) })
                }
                min={0}
                max={1}
                step={0.05}
                className="flex-1"
              />
              <span className="text-xs text-white w-10">
                {Math.round(ambient.volume * 100)}%
              </span>
            </div>
          </div>

          {/* Loop */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ambient.loop}
              onChange={(e) => updateAmbient({ loop: e.target.checked })}
              className="rounded border-gv-neutral-600"
            />
            <span className="text-sm text-gv-neutral-400">Loop audio</span>
          </label>

          {/* Spatial */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ambient.spatial}
              onChange={(e) => updateAmbient({ spatial: e.target.checked })}
              className="rounded border-gv-neutral-600"
            />
            <span className="text-sm text-gv-neutral-400">
              3D positioned audio
            </span>
          </label>

          {ambient.spatial && (
            <div className="pl-6 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gv-neutral-500">X</label>
                  <input
                    type="number"
                    value={ambient.position?.x || 0}
                    onChange={(e) =>
                      updateAmbient({
                        position: {
                          ...ambient.position,
                          x: parseFloat(e.target.value) || 0,
                          y: ambient.position?.y || 0,
                          z: ambient.position?.z || 0,
                        },
                      })
                    }
                    step={0.5}
                    className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gv-neutral-500">Y</label>
                  <input
                    type="number"
                    value={ambient.position?.y || 0}
                    onChange={(e) =>
                      updateAmbient({
                        position: {
                          ...ambient.position,
                          x: ambient.position?.x || 0,
                          y: parseFloat(e.target.value) || 0,
                          z: ambient.position?.z || 0,
                        },
                      })
                    }
                    step={0.5}
                    className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gv-neutral-500">Z</label>
                  <input
                    type="number"
                    value={ambient.position?.z || 0}
                    onChange={(e) =>
                      updateAmbient({
                        position: {
                          ...ambient.position,
                          x: ambient.position?.x || 0,
                          y: ambient.position?.y || 0,
                          z: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    step={0.5}
                    className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gv-neutral-500">
                  Radius (meters)
                </label>
                <input
                  type="number"
                  value={ambient.radius || 10}
                  onChange={(e) =>
                    updateAmbient({ radius: parseFloat(e.target.value) || 10 })
                  }
                  min={1}
                  step={1}
                  className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// MUSIC TAB
// ============================================

function MusicTab({
  config,
  onChange,
}: {
  config: SceneAudioConfig;
  onChange: (config: SceneAudioConfig) => void;
}) {
  const { music } = config;

  const updateMusic = (updates: Partial<typeof music>) => {
    onChange({
      ...config,
      music: { ...music, ...updates },
    });
  };

  const addTrack = () => {
    const track = createMusicTrack(
      `Track ${music.tracks.length + 1}`,
      ""
    );
    updateMusic({ tracks: [...music.tracks, track] });
  };

  const updateTrack = (id: string, updates: Partial<MusicTrack>) => {
    updateMusic({
      tracks: music.tracks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    });
  };

  const removeTrack = (id: string) => {
    updateMusic({
      tracks: music.tracks.filter((t) => t.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Enable Background Music</span>
        <button onClick={() => updateMusic({ enabled: !music.enabled })}>
          {music.enabled ? (
            <ToggleRight className="h-5 w-5 text-green-500" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-gv-neutral-500" />
          )}
        </button>
      </div>

      {music.enabled && (
        <>
          {/* Play mode */}
          <div>
            <label className="block text-xs text-gv-neutral-400 mb-1">
              Play Mode
            </label>
            <select
              value={music.playMode}
              onChange={(e) =>
                updateMusic({
                  playMode: e.target.value as typeof music.playMode,
                })
              }
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white text-sm"
            >
              <option value="sequential">Sequential</option>
              <option value="shuffle">Shuffle</option>
              <option value="single">Single Track (Loop)</option>
            </select>
          </div>

          {/* Crossfade */}
          <div>
            <label className="block text-xs text-gv-neutral-400 mb-1">
              Crossfade Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                value={music.crossfadeDuration}
                onChange={(e) =>
                  updateMusic({
                    crossfadeDuration: parseInt(e.target.value),
                  })
                }
                min={0}
                max={5000}
                step={100}
                className="flex-1"
              />
              <span className="text-xs text-white w-12">
                {(music.crossfadeDuration / 1000).toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Tracks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gv-neutral-400">Tracks</label>
              <button
                onClick={addTrack}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>

            {music.tracks.length === 0 ? (
              <div className="text-center py-4 text-gv-neutral-500 text-sm">
                <Music className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No tracks added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {music.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="p-3 bg-gv-neutral-800/50 rounded-gv space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gv-neutral-500 w-4">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={track.name}
                        onChange={(e) =>
                          updateTrack(track.id, { name: e.target.value })
                        }
                        className="flex-1 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                      />
                      <button
                        onClick={() => removeTrack(track.id)}
                        className="p-1 text-gv-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={track.audioUrl || ""}
                      onChange={(e) =>
                        updateTrack(track.id, { audioUrl: e.target.value })
                      }
                      placeholder="Audio URL..."
                      className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        value={track.volume}
                        onChange={(e) =>
                          updateTrack(track.id, {
                            volume: parseFloat(e.target.value),
                          })
                        }
                        min={0}
                        max={1}
                        step={0.05}
                        className="flex-1"
                      />
                      <span className="text-xs text-white w-8">
                        {Math.round(track.volume * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// AUDIO ZONES TAB
// ============================================

function AudioZonesTab({
  config,
  onChange,
}: {
  config: SceneAudioConfig;
  onChange: (config: SceneAudioConfig) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addZone = () => {
    const zone = createAudioZone(`Zone ${config.audioZones.length + 1}`);
    onChange({
      ...config,
      audioZones: [...config.audioZones, zone],
    });
    setExpandedId(zone.id);
  };

  const updateZone = (id: string, updates: Partial<AudioZone>) => {
    onChange({
      ...config,
      audioZones: config.audioZones.map((z) =>
        z.id === id ? { ...z, ...updates } : z
      ),
    });
  };

  const removeZone = (id: string) => {
    onChange({
      ...config,
      audioZones: config.audioZones.filter((z) => z.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gv-neutral-400">
          Create audio zones for directional and spatial audio
        </p>
        <button
          onClick={addZone}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Zone
        </button>
      </div>

      {config.audioZones.length === 0 ? (
        <div className="text-center py-6 text-gv-neutral-500 text-sm">
          <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No audio zones</p>
          <p className="text-xs mt-1">
            Add zones for directional audio (doorways, transitions)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {config.audioZones.map((zone) => (
            <AudioZoneCard
              key={zone.id}
              zone={zone}
              isExpanded={expandedId === zone.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === zone.id ? null : zone.id)
              }
              onUpdate={(updates) => updateZone(zone.id, updates)}
              onDelete={() => removeZone(zone.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Audio Zone Card
function AudioZoneCard({
  zone,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}: {
  zone: AudioZone;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<AudioZone>) => void;
  onDelete: () => void;
}) {
  const shapeIcons: Record<AudioZoneShape, React.ReactNode> = {
    sphere: <Circle className="h-3 w-3" />,
    box: <Box className="h-3 w-3" />,
    cylinder: <MapPin className="h-3 w-3" />,
  };

  return (
    <div
      className={`border rounded-gv ${
        zone.enabled
          ? "border-gv-neutral-700 bg-gv-neutral-800/50"
          : "border-gv-neutral-800 opacity-60"
      }`}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-2 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gv-neutral-400" />
          )}
          <span className="text-sm text-white">{zone.name}</span>
          <span className="text-xs text-gv-neutral-500 flex items-center gap-1">
            {shapeIcons[zone.shape]}
            {zoneShapeLabels[zone.shape]}
          </span>
        </button>

        <button
          onClick={() => onUpdate({ enabled: !zone.enabled })}
          className="p-1"
        >
          {zone.enabled ? (
            <ToggleRight className="h-4 w-4 text-green-500" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-gv-neutral-500" />
          )}
        </button>

        <button
          onClick={onDelete}
          className="p-1 text-gv-neutral-400 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-gv-neutral-700">
          {/* Name */}
          <input
            type="text"
            value={zone.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />

          {/* Shape */}
          <div className="grid grid-cols-3 gap-2">
            {(["sphere", "box", "cylinder"] as AudioZoneShape[]).map(
              (shape) => (
                <button
                  key={shape}
                  onClick={() => onUpdate({ shape })}
                  className={`flex items-center justify-center gap-1 py-1.5 text-xs rounded transition-colors ${
                    zone.shape === shape
                      ? "bg-gv-primary-500 text-white"
                      : "bg-gv-neutral-700 text-gv-neutral-400 hover:bg-gv-neutral-600"
                  }`}
                >
                  {shapeIcons[shape]}
                  {zoneShapeLabels[shape]}
                </button>
              )
            )}
          </div>

          {/* Position */}
          <div className="grid grid-cols-3 gap-2">
            {(["x", "y", "z"] as const).map((axis) => (
              <div key={axis}>
                <label className="block text-xs text-gv-neutral-500 uppercase">
                  {axis}
                </label>
                <input
                  type="number"
                  value={zone.position[axis]}
                  onChange={(e) =>
                    onUpdate({
                      position: {
                        ...zone.position,
                        [axis]: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  step={0.5}
                  className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                />
              </div>
            ))}
          </div>

          {/* Size / Radius */}
          {zone.shape === "sphere" ? (
            <div>
              <label className="block text-xs text-gv-neutral-500">
                Radius
              </label>
              <input
                type="number"
                value={zone.radius || 5}
                onChange={(e) =>
                  onUpdate({ radius: parseFloat(e.target.value) || 5 })
                }
                min={0.5}
                step={0.5}
                className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(["x", "y", "z"] as const).map((axis) => (
                <div key={axis}>
                  <label className="block text-xs text-gv-neutral-500">
                    Size {axis.toUpperCase()}
                  </label>
                  <input
                    type="number"
                    value={zone.size[axis]}
                    onChange={(e) =>
                      onUpdate({
                        size: {
                          ...zone.size,
                          [axis]: parseFloat(e.target.value) || 1,
                        },
                      })
                    }
                    min={0.5}
                    step={0.5}
                    className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Audio URL */}
          <div>
            <label className="block text-xs text-gv-neutral-500">
              Audio URL
            </label>
            <input
              type="text"
              value={zone.audioUrl || ""}
              onChange={(e) => onUpdate({ audioUrl: e.target.value })}
              placeholder="https://example.com/audio.mp3"
              className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-xs text-gv-neutral-500">Trigger</label>
            <select
              value={zone.trigger}
              onChange={(e) =>
                onUpdate({ trigger: e.target.value as AudioZoneTrigger })
              }
              className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
            >
              {Object.entries(zoneTriggerLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Volume */}
          <div>
            <label className="block text-xs text-gv-neutral-500">Volume</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                value={zone.volume}
                onChange={(e) =>
                  onUpdate({ volume: parseFloat(e.target.value) })
                }
                min={0}
                max={1}
                step={0.05}
                className="flex-1"
              />
              <span className="text-xs text-white w-8">
                {Math.round(zone.volume * 100)}%
              </span>
            </div>
          </div>

          {/* Directional */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={zone.isDirectional}
              onChange={(e) =>
                onUpdate({ isDirectional: e.target.checked })
              }
              className="rounded border-gv-neutral-600"
            />
            <span className="text-sm text-gv-neutral-400">
              Directional audio (for transitions)
            </span>
          </label>

          {zone.isDirectional && (
            <div className="pl-6 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {(["x", "y", "z"] as const).map((axis) => (
                  <div key={axis}>
                    <label className="block text-xs text-gv-neutral-500">
                      Dir {axis.toUpperCase()}
                    </label>
                    <input
                      type="number"
                      value={zone.direction?.[axis] || 0}
                      onChange={(e) =>
                        onUpdate({
                          direction: {
                            x: zone.direction?.x || 0,
                            y: zone.direction?.y || 0,
                            z: zone.direction?.z || 0,
                            [axis]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      step={0.1}
                      className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-gv-neutral-500">
                  Cone Angle (degrees)
                </label>
                <input
                  type="number"
                  value={zone.coneAngle || 90}
                  onChange={(e) =>
                    onUpdate({ coneAngle: parseInt(e.target.value) || 90 })
                  }
                  min={0}
                  max={360}
                  className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Linked Scene (for transitions) */}
          <div>
            <label className="block text-xs text-gv-neutral-500">
              Linked Scene ID (for transitions)
            </label>
            <input
              type="text"
              value={zone.linkedSceneId || ""}
              onChange={(e) => onUpdate({ linkedSceneId: e.target.value })}
              placeholder="scene-uuid (optional)"
              className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { defaultSceneAudioConfig };
