"use client";

import {
  Move,
  RotateCw,
  Maximize2,
  Undo2,
  Redo2,
  Grid3X3,
  Magnet,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";

interface EditorToolbarProps {
  isSaving?: boolean;
  lastSaved?: number | null;
  onSave?: () => void;
}

export function EditorToolbar({ isSaving, lastSaved, onSave }: EditorToolbarProps) {
  const {
    transformMode,
    snapEnabled,
    showGrid,
    isDirty,
    setTransformMode,
    toggleSnap,
    toggleGrid,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore();

  const formatLastSaved = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
      {/* Transform Tools */}
      <div className="flex items-center bg-black/60 backdrop-blur-sm rounded-gv overflow-hidden">
        <ToolButton
          icon={<Move className="h-4 w-4" />}
          label="Move (W)"
          active={transformMode === "translate"}
          onClick={() => setTransformMode("translate")}
        />
        <ToolButton
          icon={<RotateCw className="h-4 w-4" />}
          label="Rotate (E)"
          active={transformMode === "rotate"}
          onClick={() => setTransformMode("rotate")}
        />
        <ToolButton
          icon={<Maximize2 className="h-4 w-4" />}
          label="Scale (R)"
          active={transformMode === "scale"}
          onClick={() => setTransformMode("scale")}
        />
      </div>

      {/* Snap & Grid */}
      <div className="flex items-center bg-black/60 backdrop-blur-sm rounded-gv overflow-hidden">
        <ToolButton
          icon={<Magnet className="h-4 w-4" />}
          label="Snap (S)"
          active={snapEnabled}
          onClick={toggleSnap}
        />
        <ToolButton
          icon={<Grid3X3 className="h-4 w-4" />}
          label="Grid (G)"
          active={showGrid}
          onClick={toggleGrid}
        />
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center bg-black/60 backdrop-blur-sm rounded-gv overflow-hidden">
        <ToolButton
          icon={<Undo2 className="h-4 w-4" />}
          label="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo()}
        />
        <ToolButton
          icon={<Redo2 className="h-4 w-4" />}
          label="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={!canRedo()}
        />
      </div>

      {/* Save Status */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-gv">
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 text-gv-primary-500 animate-spin" />
            <span className="text-xs text-gv-neutral-400">Saving...</span>
          </>
        ) : isDirty ? (
          <>
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-gv-neutral-400">Unsaved</span>
            {onSave && (
              <button
                onClick={onSave}
                className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
                title="Save now"
              >
                <Save className="h-3 w-3 text-white" />
              </button>
            )}
          </>
        ) : (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gv-neutral-400">Saved {formatLastSaved(lastSaved ?? null)}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Tool button component
interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, active, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2.5 transition-colors ${
        active
          ? "bg-gv-primary-500 text-white"
          : disabled
          ? "text-gv-neutral-600 cursor-not-allowed"
          : "text-gv-neutral-300 hover:text-white hover:bg-white/10"
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
