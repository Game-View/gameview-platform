"use client";

import { useState } from "react";
import {
  Bug,
  Eye,
  MapPin,
  Box,
  RefreshCw,
  Pause,
  Play,
  ChevronUp,
  ChevronDown,
  Shield,
  Infinity,
  Crosshair,
  Tag,
  Zap,
} from "lucide-react";
import { usePlaytestStore } from "@/stores/playtest-store";
import { formatTime } from "@/lib/player-runtime";

interface DebugToolbarProps {
  className?: string;
  onTeleport?: (position: { x: number; y: number; z: number }) => void;
}

export function DebugToolbar({ className = "", onTeleport }: DebugToolbarProps) {
  const {
    isPaused,
    playerState,
    debugState,
    eventLog,
    pausePlaytest,
    resumePlaytest,
    resetPlaytest,
    setDebugOption,
    toggleDebugOption,
    teleportPlayer,
  } = usePlaytestStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showTeleportInput, setShowTeleportInput] = useState(false);
  const [teleportPos, setTeleportPos] = useState({ x: 0, y: 1.6, z: 0 });

  const handleTeleport = () => {
    teleportPlayer(teleportPos);
    onTeleport?.(teleportPos);
    setShowTeleportInput(false);
  };

  return (
    <div className={`absolute bottom-4 left-4 z-40 pointer-events-auto ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-orange-500/90 hover:bg-orange-500 backdrop-blur-sm rounded-t-lg text-white font-medium transition-colors"
      >
        <Bug className="h-4 w-4" />
        Debug
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {/* Toolbar Panel */}
      {isExpanded && (
        <div className="bg-gv-neutral-900/95 backdrop-blur-sm rounded-b-lg rounded-tr-lg border border-orange-500/30 p-4 w-80">
          {/* Player Info */}
          <div className="mb-4 p-3 bg-gv-neutral-800 rounded-lg">
            <h4 className="text-xs font-semibold text-gv-neutral-400 uppercase mb-2">
              Player State
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gv-neutral-400">Position:</span>
                <span className="text-white ml-1">
                  ({playerState.position.x.toFixed(1)},{" "}
                  {playerState.position.y.toFixed(1)},{" "}
                  {playerState.position.z.toFixed(1)})
                </span>
              </div>
              <div>
                <span className="text-gv-neutral-400">Score:</span>
                <span className="text-white ml-1">{playerState.score}</span>
              </div>
              <div>
                <span className="text-gv-neutral-400">Time:</span>
                <span className="text-white ml-1">
                  {formatTime(playerState.elapsedTime)}
                </span>
              </div>
              <div>
                <span className="text-gv-neutral-400">Items:</span>
                <span className="text-white ml-1">{playerState.inventory.length}</span>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={isPaused ? resumePlaytest : pausePlaytest}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 rounded text-white transition-colors"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              )}
            </button>
            <button
              onClick={resetPlaytest}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 rounded text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {/* Time Scale */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gv-neutral-400 uppercase mb-2 block">
              Time Scale
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDebugOption("timeScale", 0.5)}
                className={`flex-1 py-1 rounded text-sm transition-colors ${
                  debugState.timeScale === 0.5
                    ? "bg-orange-500 text-white"
                    : "bg-gv-neutral-700 text-gv-neutral-300 hover:bg-gv-neutral-600"
                }`}
              >
                0.5x
              </button>
              <button
                onClick={() => setDebugOption("timeScale", 1)}
                className={`flex-1 py-1 rounded text-sm transition-colors ${
                  debugState.timeScale === 1
                    ? "bg-orange-500 text-white"
                    : "bg-gv-neutral-700 text-gv-neutral-300 hover:bg-gv-neutral-600"
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setDebugOption("timeScale", 2)}
                className={`flex-1 py-1 rounded text-sm transition-colors ${
                  debugState.timeScale === 2
                    ? "bg-orange-500 text-white"
                    : "bg-gv-neutral-700 text-gv-neutral-300 hover:bg-gv-neutral-600"
                }`}
              >
                2x
              </button>
              <button
                onClick={() => setDebugOption("timeScale", 4)}
                className={`flex-1 py-1 rounded text-sm transition-colors ${
                  debugState.timeScale === 4
                    ? "bg-orange-500 text-white"
                    : "bg-gv-neutral-700 text-gv-neutral-300 hover:bg-gv-neutral-600"
                }`}
              >
                4x
              </button>
            </div>
          </div>

          {/* Debug Toggles */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <DebugToggle
              label="Trigger Zones"
              icon={<Crosshair className="h-4 w-4" />}
              active={debugState.showTriggerZones}
              onClick={() => toggleDebugOption("showTriggerZones")}
            />
            <DebugToggle
              label="Collision"
              icon={<Box className="h-4 w-4" />}
              active={debugState.showCollisionBounds}
              onClick={() => toggleDebugOption("showCollisionBounds")}
            />
            <DebugToggle
              label="Player Info"
              icon={<Eye className="h-4 w-4" />}
              active={debugState.showPlayerInfo}
              onClick={() => toggleDebugOption("showPlayerInfo")}
            />
            <DebugToggle
              label="Object Labels"
              icon={<Tag className="h-4 w-4" />}
              active={debugState.showObjectLabels}
              onClick={() => toggleDebugOption("showObjectLabels")}
            />
            <DebugToggle
              label="Invincible"
              icon={<Shield className="h-4 w-4" />}
              active={debugState.invincible}
              onClick={() => toggleDebugOption("invincible")}
            />
            <DebugToggle
              label="Unlimited Inv."
              icon={<Infinity className="h-4 w-4" />}
              active={debugState.unlimitedInventory}
              onClick={() => toggleDebugOption("unlimitedInventory")}
            />
          </div>

          {/* Teleport */}
          <div className="mb-4">
            {showTeleportInput ? (
              <div className="p-3 bg-gv-neutral-800 rounded-lg">
                <h4 className="text-xs font-semibold text-gv-neutral-400 uppercase mb-2">
                  Teleport To
                </h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={teleportPos.x}
                    onChange={(e) =>
                      setTeleportPos({ ...teleportPos, x: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1 bg-gv-neutral-700 rounded text-white text-sm"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={teleportPos.y}
                    onChange={(e) =>
                      setTeleportPos({ ...teleportPos, y: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1 bg-gv-neutral-700 rounded text-white text-sm"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    value={teleportPos.z}
                    onChange={(e) =>
                      setTeleportPos({ ...teleportPos, z: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1 bg-gv-neutral-700 rounded text-white text-sm"
                    placeholder="Z"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTeleportInput(false)}
                    className="flex-1 py-1 bg-gv-neutral-700 hover:bg-gv-neutral-600 rounded text-sm text-gv-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTeleport}
                    className="flex-1 py-1 bg-orange-500 hover:bg-orange-600 rounded text-sm text-white"
                  >
                    Teleport
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowTeleportInput(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 rounded text-white transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Teleport
              </button>
            )}
          </div>

          {/* Recent Events */}
          <div>
            <h4 className="text-xs font-semibold text-gv-neutral-400 uppercase mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Recent Events
            </h4>
            <div className="max-h-24 overflow-y-auto bg-gv-neutral-800 rounded p-2">
              {eventLog.length === 0 ? (
                <p className="text-gv-neutral-500 text-xs">No events yet</p>
              ) : (
                <ul className="space-y-1">
                  {eventLog.slice(-5).reverse().map((event, i) => (
                    <li key={i} className="text-xs text-gv-neutral-300 font-mono">
                      {formatEvent(event)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Debug toggle button component
function DebugToggle({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
        active
          ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
          : "bg-gv-neutral-700 text-gv-neutral-400 hover:bg-gv-neutral-600"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

// Format event for display
function formatEvent(event: { type: string; [key: string]: unknown }): string {
  switch (event.type) {
    case "score_changed":
      return `Score: ${event.oldScore} → ${event.newScore}`;
    case "item_collected":
      return `Collected: ${(event.item as { name: string }).name}`;
    case "objective_completed":
      return `Objective: ${event.objectiveId}`;
    case "interaction_triggered":
      return `Interaction: ${event.interactionId}`;
    case "teleported":
      const dest = event.destination as { x: number; y: number; z: number };
      return `Teleported: (${dest.x.toFixed(1)}, ${dest.y.toFixed(1)}, ${dest.z.toFixed(1)})`;
    case "game_won":
      return "🏆 GAME WON!";
    case "game_failed":
      return "❌ GAME FAILED";
    default:
      return event.type;
  }
}
