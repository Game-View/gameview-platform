"use client";

import { useState, useCallback, useRef } from "react";
import {
  Maximize2,
  Minimize2,
  Camera,
  Eye,
  EyeOff,
  Settings,
  Crosshair,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

interface CameraPosition {
  x: number;
  y: number;
  z: number;
}

interface CameraRotation {
  pitch: number; // X rotation (up/down)
  yaw: number;   // Y rotation (left/right)
  roll: number;  // Z rotation (tilt)
}

export interface CameraConfig {
  position: CameraPosition;
  rotation: CameraRotation;
  fov: number;
  near: number;
  far: number;
}

interface CameraPreviewProps {
  previewUrl?: string;
  cameraConfig?: CameraConfig;
  isLive?: boolean;
  showGrid?: boolean;
  showCrosshair?: boolean;
  onCameraChange?: (config: CameraConfig) => void;
  onToggleFullscreen?: () => void;
  onResetCamera?: () => void;
  className?: string;
}

const defaultCamera: CameraConfig = {
  position: { x: 0, y: 1.6, z: 5 },
  rotation: { pitch: 0, yaw: 0, roll: 0 },
  fov: 75,
  near: 0.1,
  far: 1000,
};

const cameraPresets = [
  { name: "Default", position: { x: 0, y: 1.6, z: 5 }, rotation: { pitch: 0, yaw: 0, roll: 0 } },
  { name: "Top Down", position: { x: 0, y: 10, z: 0 }, rotation: { pitch: -90, yaw: 0, roll: 0 } },
  { name: "Front", position: { x: 0, y: 1.6, z: 10 }, rotation: { pitch: 0, yaw: 0, roll: 0 } },
  { name: "Side", position: { x: 10, y: 1.6, z: 0 }, rotation: { pitch: 0, yaw: -90, roll: 0 } },
  { name: "Corner", position: { x: 5, y: 3, z: 5 }, rotation: { pitch: -15, yaw: -45, roll: 0 } },
];

export function CameraPreview({
  previewUrl,
  cameraConfig = defaultCamera,
  isLive = true,
  showGrid: externalShowGrid,
  showCrosshair: externalShowCrosshair,
  onCameraChange,
  onToggleFullscreen,
  onResetCamera,
  className = "",
}: CameraPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [internalShowGrid, setInternalShowGrid] = useState(false);
  const [internalShowCrosshair, setInternalShowCrosshair] = useState(true);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const showGrid = externalShowGrid ?? internalShowGrid;
  const showCrosshair = externalShowCrosshair ?? internalShowCrosshair;

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (preset: typeof cameraPresets[0]) => {
      if (onCameraChange) {
        onCameraChange({
          ...cameraConfig,
          position: preset.position,
          rotation: preset.rotation,
        });
      }
      setShowPresets(false);
    },
    [cameraConfig, onCameraChange]
  );

  // Handle reset camera
  const handleResetCamera = useCallback(() => {
    if (onResetCamera) {
      onResetCamera();
    } else if (onCameraChange) {
      onCameraChange(defaultCamera);
    }
  }, [onCameraChange, onResetCamera]);

  // Handle fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setIsExpanded((prev) => !prev);
    }
  }, [onToggleFullscreen]);

  // Format camera position for display
  const formatPosition = (pos: CameraPosition) => {
    return `X: ${pos.x.toFixed(1)} Y: ${pos.y.toFixed(1)} Z: ${pos.z.toFixed(1)}`;
  };

  // Format camera rotation for display
  const formatRotation = (rot: CameraRotation) => {
    return `P: ${rot.pitch.toFixed(0)}° Y: ${rot.yaw.toFixed(0)}° R: ${rot.roll.toFixed(0)}°`;
  };

  return (
    <div
      ref={containerRef}
      className={`bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden flex flex-col ${
        isExpanded ? "fixed inset-4 z-50" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#232323] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-[#888]" />
          <span className="text-sm font-medium text-[#e0e0e0]">Camera Preview</span>

          {/* Live indicator */}
          {isLive && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-400 uppercase font-medium">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle visibility */}
          <button
            onClick={() => setIsPreviewVisible((prev) => !prev)}
            className="p-1.5 rounded hover:bg-[#333] transition-colors text-[#888] hover:text-white"
            title={isPreviewVisible ? "Hide preview" : "Show preview"}
          >
            {isPreviewVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className={`p-1.5 rounded hover:bg-[#333] transition-colors ${
                showSettings ? "bg-[#333] text-white" : "text-[#888] hover:text-white"
              }`}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Settings dropdown */}
            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-xl py-1">
                  <label className="flex items-center justify-between px-3 py-2 hover:bg-[#333] cursor-pointer">
                    <span className="text-sm text-[#ccc]">Show Grid</span>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setInternalShowGrid(e.target.checked)}
                      className="accent-gv-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between px-3 py-2 hover:bg-[#333] cursor-pointer">
                    <span className="text-sm text-[#ccc]">Show Crosshair</span>
                    <input
                      type="checkbox"
                      checked={showCrosshair}
                      onChange={(e) => setInternalShowCrosshair(e.target.checked)}
                      className="accent-gv-primary-500"
                    />
                  </label>
                  <div className="border-t border-[#444] my-1" />
                  <div className="px-3 py-2">
                    <label className="text-xs text-[#888] mb-1 block">FOV</label>
                    <input
                      type="range"
                      min="30"
                      max="120"
                      value={cameraConfig.fov}
                      onChange={(e) =>
                        onCameraChange?.({ ...cameraConfig, fov: parseInt(e.target.value) })
                      }
                      className="w-full accent-gv-primary-500"
                    />
                    <div className="text-xs text-[#888] text-right">{cameraConfig.fov}°</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded hover:bg-[#333] transition-colors text-[#888] hover:text-white"
            title={isExpanded ? "Exit fullscreen" : "Fullscreen"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      {isPreviewVisible && (
        <div className="relative flex-1 min-h-[200px] bg-black">
          {/* Preview content */}
          {previewUrl ? (
            <img src={previewUrl} alt="Camera preview" className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 text-[#444] mx-auto mb-2" />
                <p className="text-sm text-[#666]">3D Scene Preview</p>
                <p className="text-xs text-[#555] mt-1">Camera view will appear here</p>
              </div>
            </div>
          )}

          {/* Grid overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Rule of thirds */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-[#fff]/20" />
                ))}
              </div>
            </div>
          )}

          {/* Crosshair overlay */}
          {showCrosshair && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <Crosshair className="h-8 w-8 text-[#fff]/30" />
            </div>
          )}

          {/* Camera info overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
            {/* Position/rotation info */}
            <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1">
              <div className="text-[10px] text-[#888] font-mono">
                {formatPosition(cameraConfig.position)}
              </div>
              <div className="text-[10px] text-[#888] font-mono">
                {formatRotation(cameraConfig.rotation)}
              </div>
            </div>

            {/* Camera controls */}
            <div className="flex items-center gap-1">
              {/* Camera presets */}
              <div className="relative">
                <button
                  onClick={() => setShowPresets((prev) => !prev)}
                  className="flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-[#ccc] hover:text-white text-xs transition-colors"
                >
                  <Camera className="h-3 w-3" />
                  <span>Presets</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showPresets && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)} />
                    <div className="absolute right-0 bottom-full mb-1 z-50 w-36 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-xl py-1">
                      {cameraPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handlePresetSelect(preset)}
                          className="w-full px-3 py-2 text-left text-sm text-[#ccc] hover:text-white hover:bg-[#333] transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Reset camera */}
              <button
                onClick={handleResetCamera}
                className="p-1.5 bg-black/70 backdrop-blur-sm rounded text-[#ccc] hover:text-white transition-colors"
                title="Reset camera"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* FOV indicator */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-[10px] text-[#888] font-mono">FOV {cameraConfig.fov}°</span>
          </div>
        </div>
      )}

      {/* Collapsed state */}
      {!isPreviewVisible && (
        <div className="h-8 flex items-center justify-center text-[#666] text-xs">
          Preview hidden
        </div>
      )}
    </div>
  );
}

export default CameraPreview;
