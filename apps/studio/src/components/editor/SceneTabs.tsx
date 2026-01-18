"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  X,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit3,
  ChevronDown,
} from "lucide-react";

export interface Scene {
  id: string;
  name: string;
  thumbnail?: string;
  order: number;
}

interface SceneTabsProps {
  scenes: Scene[];
  activeSceneId: string;
  onSceneChange: (sceneId: string) => void;
  onAddScene?: () => void;
  onDeleteScene?: (sceneId: string) => void;
  onRenameScene?: (sceneId: string, newName: string) => void;
  onDuplicateScene?: (sceneId: string) => void;
  onReorderScenes?: (scenes: Scene[]) => void;
  className?: string;
}

export function SceneTabs({
  scenes,
  activeSceneId,
  onSceneChange,
  onAddScene,
  onDeleteScene,
  onRenameScene,
  onDuplicateScene,
  className = "",
}: SceneTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Handle double-click to edit
  const handleDoubleClick = useCallback(
    (scene: Scene) => {
      if (!onRenameScene) return;
      setEditingId(scene.id);
      setEditValue(scene.name);
    },
    [onRenameScene]
  );

  // Handle save edit
  const handleSaveEdit = useCallback(
    (sceneId: string) => {
      if (editValue.trim() && onRenameScene) {
        onRenameScene(sceneId, editValue.trim());
      }
      setEditingId(null);
      setEditValue("");
    },
    [editValue, onRenameScene]
  );

  // Handle key press in edit input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, sceneId: string) => {
      if (e.key === "Enter") {
        handleSaveEdit(sceneId);
      } else if (e.key === "Escape") {
        setEditingId(null);
        setEditValue("");
      }
    },
    [handleSaveEdit]
  );

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, sceneId: string) => {
    setDraggedId(sceneId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sceneId);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetId) return;

      // Find indices
      const draggedIndex = scenes.findIndex((s) => s.id === draggedId);
      const targetIndex = scenes.findIndex((s) => s.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder scenes
      const newScenes = [...scenes];
      const [removed] = newScenes.splice(draggedIndex, 1);
      newScenes.splice(targetIndex, 0, removed!);

      // Update order values
      const reorderedScenes = newScenes.map((scene, index) => ({
        ...scene,
        order: index,
      }));

      // Notify parent
      // onReorderScenes?.(reorderedScenes);
      console.log("Reordered scenes:", reorderedScenes);
    },
    [draggedId, scenes]
  );

  // Handle delete with confirmation
  const handleDelete = useCallback(
    (sceneId: string) => {
      if (scenes.length <= 1) {
        alert("Cannot delete the last scene");
        return;
      }
      if (confirm("Are you sure you want to delete this scene?")) {
        onDeleteScene?.(sceneId);
      }
      setMenuOpenId(null);
    },
    [scenes.length, onDeleteScene]
  );

  // Close menu when clicking outside
  const handleBackdropClick = useCallback(() => {
    setMenuOpenId(null);
  }, []);

  return (
    <div className={`flex items-center bg-gv-neutral-900 border-b border-gv-neutral-700 ${className}`}>
      {/* Scene Tabs */}
      <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gv-neutral-700 scrollbar-track-transparent">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className={`relative flex items-center group ${
              draggedId === scene.id ? "opacity-50" : ""
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, scene.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, scene.id)}
          >
            <button
              onClick={() => onSceneChange(scene.id)}
              onDoubleClick={() => handleDoubleClick(scene)}
              className={`flex items-center gap-2 px-4 py-2.5 min-w-[120px] max-w-[200px] border-r border-gv-neutral-700 transition-colors ${
                activeSceneId === scene.id
                  ? "bg-gv-neutral-800 text-white border-b-2 border-b-gv-primary-500"
                  : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800/50"
              }`}
            >
              {/* Thumbnail */}
              {scene.thumbnail ? (
                <img
                  src={scene.thumbnail}
                  alt=""
                  className="w-6 h-6 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-gv-neutral-700 flex-shrink-0" />
              )}

              {/* Name or Edit Input */}
              {editingId === scene.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveEdit(scene.id)}
                  onKeyDown={(e) => handleKeyDown(e, scene.id)}
                  className="flex-1 min-w-0 bg-transparent border-b border-gv-primary-500 text-white text-sm outline-none"
                  autoFocus
                />
              ) : (
                <span className="truncate text-sm">{scene.name}</span>
              )}
            </button>

            {/* Context Menu Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === scene.id ? null : scene.id);
                }}
                className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  menuOpenId === scene.id ? "opacity-100" : ""
                } hover:bg-gv-neutral-600`}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-gv-neutral-400" />
              </button>

              {/* Dropdown Menu */}
              {menuOpenId === scene.id && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={handleBackdropClick}
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-gv-neutral-800 border border-gv-neutral-700 rounded-lg shadow-xl py-1">
                    {onRenameScene && (
                      <button
                        onClick={() => {
                          handleDoubleClick(scene);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gv-neutral-300 hover:text-white hover:bg-gv-neutral-700 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        Rename
                      </button>
                    )}
                    {onDuplicateScene && (
                      <button
                        onClick={() => {
                          onDuplicateScene(scene.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gv-neutral-300 hover:text-white hover:bg-gv-neutral-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </button>
                    )}
                    {onDeleteScene && (
                      <>
                        <div className="my-1 border-t border-gv-neutral-700" />
                        <button
                          onClick={() => handleDelete(scene.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gv-neutral-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Scene Button */}
      {onAddScene && (
        <button
          onClick={onAddScene}
          className="flex items-center gap-1.5 px-3 py-2.5 text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800 transition-colors"
          title="Add new scene"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add Scene</span>
        </button>
      )}

      {/* Scene Count */}
      <div className="ml-auto px-3 flex items-center gap-2 text-xs text-gv-neutral-500">
        <span>{scenes.length} scene{scenes.length !== 1 ? "s" : ""}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

export default SceneTabs;
