"use client";

import { useState } from "react";
import {
  Move,
  RotateCw,
  Maximize2,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  X,
  Settings2,
} from "lucide-react";
import { useEditorStore, type TransformMode } from "@/stores/editor-store";
import { InteractionPanel } from "./InteractionPanel";
import type { ObjectTransform } from "@/lib/objects";
import type { Interaction } from "@/lib/interactions";

interface PropertiesPanelProps {
  className?: string;
  onClose?: () => void;
}

export function PropertiesPanel({ className = "", onClose }: PropertiesPanelProps) {
  const {
    transformMode,
    snapEnabled,
    snapTranslate,
    snapRotate,
    snapScale,
    setTransformMode,
    toggleSnap,
    updateObjectTransform,
    updateObject,
    removeObject,
    duplicateObject,
    getSelectedObject,
  } = useEditorStore();

  const [expandedSections, setExpandedSections] = useState({
    transform: true,
    interactions: true,
    snap: false,
  });

  const selectedObject = getSelectedObject();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!selectedObject) {
    return (
      <div className={`bg-gv-neutral-900 border-l border-gv-neutral-800 ${className}`}>
        <div className="p-4 border-b border-gv-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gv-neutral-400 uppercase tracking-wider">
            Properties
          </h2>
          {onClose && (
            <button onClick={onClose} className="p-1 text-gv-neutral-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="p-6 text-center">
          <Settings2 className="h-12 w-12 mx-auto text-gv-neutral-700 mb-3" />
          <p className="text-gv-neutral-500 text-sm">Select an object to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleTransformChange = (
    axis: "x" | "y" | "z",
    type: "position" | "rotation" | "scale",
    value: number
  ) => {
    const newTransform: ObjectTransform = {
      ...selectedObject.transform,
      [type]: {
        ...selectedObject.transform[type],
        [axis]: value,
      },
    };
    updateObjectTransform(selectedObject.instanceId, newTransform);
  };

  const handleNameChange = (name: string) => {
    updateObject(selectedObject.instanceId, { name });
  };

  const handleInteractionsChange = (interactions: Interaction[]) => {
    updateObject(selectedObject.instanceId, { interactions });
  };

  return (
    <div className={`bg-gv-neutral-900 border-l border-gv-neutral-800 overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gv-neutral-800 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gv-neutral-400 uppercase tracking-wider">
          Properties
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gv-neutral-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Object Info */}
      <div className="p-4 border-b border-gv-neutral-800">
        <input
          type="text"
          value={selectedObject.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white font-medium focus:outline-none focus:ring-2 focus:ring-gv-primary-500"
        />
        <p className="text-xs text-gv-neutral-500 mt-2">ID: {selectedObject.instanceId.slice(0, 8)}...</p>
      </div>

      {/* Transform Mode Buttons */}
      <div className="p-4 border-b border-gv-neutral-800">
        <div className="flex gap-1">
          <TransformModeButton
            mode="translate"
            current={transformMode}
            onClick={() => setTransformMode("translate")}
            icon={<Move className="h-4 w-4" />}
            label="Move (W)"
          />
          <TransformModeButton
            mode="rotate"
            current={transformMode}
            onClick={() => setTransformMode("rotate")}
            icon={<RotateCw className="h-4 w-4" />}
            label="Rotate (E)"
          />
          <TransformModeButton
            mode="scale"
            current={transformMode}
            onClick={() => setTransformMode("scale")}
            icon={<Maximize2 className="h-4 w-4" />}
            label="Scale (R)"
          />
        </div>
      </div>

      {/* Transform Section */}
      <div className="border-b border-gv-neutral-800">
        <button
          onClick={() => toggleSection("transform")}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-white hover:bg-gv-neutral-800/50"
        >
          <span>Transform</span>
          {expandedSections.transform ? (
            <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gv-neutral-400" />
          )}
        </button>
        {expandedSections.transform && (
          <div className="px-4 pb-4 space-y-4">
            {/* Position */}
            <div>
              <label className="text-xs text-gv-neutral-400 uppercase tracking-wider block mb-2">
                Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                <VectorInput
                  label="X"
                  value={selectedObject.transform.position.x}
                  onChange={(v) => handleTransformChange("x", "position", v)}
                  color="red"
                />
                <VectorInput
                  label="Y"
                  value={selectedObject.transform.position.y}
                  onChange={(v) => handleTransformChange("y", "position", v)}
                  color="green"
                />
                <VectorInput
                  label="Z"
                  value={selectedObject.transform.position.z}
                  onChange={(v) => handleTransformChange("z", "position", v)}
                  color="blue"
                />
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="text-xs text-gv-neutral-400 uppercase tracking-wider block mb-2">
                Rotation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <VectorInput
                  label="X"
                  value={selectedObject.transform.rotation.x}
                  onChange={(v) => handleTransformChange("x", "rotation", v)}
                  color="red"
                  step={1}
                />
                <VectorInput
                  label="Y"
                  value={selectedObject.transform.rotation.y}
                  onChange={(v) => handleTransformChange("y", "rotation", v)}
                  color="green"
                  step={1}
                />
                <VectorInput
                  label="Z"
                  value={selectedObject.transform.rotation.z}
                  onChange={(v) => handleTransformChange("z", "rotation", v)}
                  color="blue"
                  step={1}
                />
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="text-xs text-gv-neutral-400 uppercase tracking-wider block mb-2">
                Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                <VectorInput
                  label="X"
                  value={selectedObject.transform.scale.x}
                  onChange={(v) => handleTransformChange("x", "scale", v)}
                  color="red"
                  step={0.1}
                  min={0.01}
                />
                <VectorInput
                  label="Y"
                  value={selectedObject.transform.scale.y}
                  onChange={(v) => handleTransformChange("y", "scale", v)}
                  color="green"
                  step={0.1}
                  min={0.01}
                />
                <VectorInput
                  label="Z"
                  value={selectedObject.transform.scale.z}
                  onChange={(v) => handleTransformChange("z", "scale", v)}
                  color="blue"
                  step={0.1}
                  min={0.01}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactions Section */}
      <div className="border-b border-gv-neutral-800">
        <button
          onClick={() => toggleSection("interactions")}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-white hover:bg-gv-neutral-800/50"
        >
          <span className="flex items-center gap-2">
            Interactions
            {selectedObject.interactions && selectedObject.interactions.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-gv-primary-500/20 text-gv-primary-400 rounded">
                {selectedObject.interactions.length}
              </span>
            )}
          </span>
          {expandedSections.interactions ? (
            <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gv-neutral-400" />
          )}
        </button>
        {expandedSections.interactions && (
          <InteractionPanel
            interactions={selectedObject.interactions || []}
            onChange={handleInteractionsChange}
          />
        )}
      </div>

      {/* Snap Settings */}
      <div className="border-b border-gv-neutral-800">
        <button
          onClick={() => toggleSection("snap")}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-white hover:bg-gv-neutral-800/50"
        >
          <span className="flex items-center gap-2">
            Snap Settings
            {snapEnabled && (
              <span className="text-xs px-1.5 py-0.5 bg-gv-primary-500/20 text-gv-primary-400 rounded">
                ON
              </span>
            )}
          </span>
          {expandedSections.snap ? (
            <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gv-neutral-400" />
          )}
        </button>
        {expandedSections.snap && (
          <div className="px-4 pb-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={toggleSnap}
                className="w-4 h-4 rounded border-gv-neutral-600 bg-gv-neutral-800 text-gv-primary-500 focus:ring-gv-primary-500"
              />
              <span className="text-sm text-gv-neutral-300">Enable snapping (S)</span>
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-gv-neutral-500 block mb-1">Move</label>
                <span className="text-white">{snapTranslate}m</span>
              </div>
              <div>
                <label className="text-gv-neutral-500 block mb-1">Rotate</label>
                <span className="text-white">{snapRotate}°</span>
              </div>
              <div>
                <label className="text-gv-neutral-500 block mb-1">Scale</label>
                <span className="text-white">{snapScale}x</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        <button
          onClick={() => duplicateObject(selectedObject.instanceId)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gv-neutral-800 hover:bg-gv-neutral-700 border border-gv-neutral-700 rounded-gv text-white text-sm transition-colors"
        >
          <Copy className="h-4 w-4" />
          Duplicate (D)
        </button>
        <button
          onClick={() => removeObject(selectedObject.instanceId)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-gv text-red-400 text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete (Del)
        </button>
      </div>
    </div>
  );
}

// Transform mode button
interface TransformModeButtonProps {
  mode: TransformMode;
  current: TransformMode;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TransformModeButton({ mode, current, onClick, icon, label }: TransformModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-gv text-sm transition-colors ${
        mode === current
          ? "bg-gv-primary-500 text-white"
          : "bg-gv-neutral-800 text-gv-neutral-400 hover:bg-gv-neutral-700 hover:text-white"
      }`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
    </button>
  );
}

// Vector input component
interface VectorInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: "red" | "green" | "blue";
  step?: number;
  min?: number;
}

function VectorInput({ label, value, onChange, color, step = 0.1, min }: VectorInputProps) {
  const colorClasses = {
    red: "border-l-red-500",
    green: "border-l-green-500",
    blue: "border-l-blue-500",
  };

  return (
    <div className={`relative border-l-2 ${colorClasses[color]}`}>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gv-neutral-500">
        {label}
      </span>
      <input
        type="number"
        value={Number(value.toFixed(2))}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        min={min}
        className="w-full pl-6 pr-2 py-1.5 bg-gv-neutral-800 border border-gv-neutral-700 rounded-r text-white text-sm focus:outline-none focus:ring-1 focus:ring-gv-primary-500"
      />
    </div>
  );
}
