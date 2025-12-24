import { useEffect } from "react";
import { useEditorStore, EDITOR_SHORTCUTS } from "@/stores/editor-store";

export function useEditorKeyboard() {
  const {
    selectedObjectId,
    setTransformMode,
    toggleSnap,
    toggleGrid,
    selectObject,
    removeObject,
    duplicateObject,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Transform mode shortcuts
      if (key === EDITOR_SHORTCUTS.translate && !isCtrlOrCmd) {
        e.preventDefault();
        setTransformMode("translate");
        return;
      }

      if (key === EDITOR_SHORTCUTS.rotate && !isCtrlOrCmd) {
        e.preventDefault();
        setTransformMode("rotate");
        return;
      }

      if (key === EDITOR_SHORTCUTS.scale && !isCtrlOrCmd) {
        e.preventDefault();
        setTransformMode("scale");
        return;
      }

      // Snap toggle
      if (key === EDITOR_SHORTCUTS.snap && !isCtrlOrCmd) {
        e.preventDefault();
        toggleSnap();
        return;
      }

      // Grid toggle
      if (key === "g" && !isCtrlOrCmd) {
        e.preventDefault();
        toggleGrid();
        return;
      }

      // Delete selected object
      if (key === "delete" || key === "backspace") {
        if (selectedObjectId) {
          e.preventDefault();
          removeObject(selectedObjectId);
        }
        return;
      }

      // Duplicate selected object
      if (key === EDITOR_SHORTCUTS.duplicate && !isCtrlOrCmd) {
        if (selectedObjectId) {
          e.preventDefault();
          duplicateObject(selectedObjectId);
        }
        return;
      }

      // Deselect
      if (key === "escape") {
        e.preventDefault();
        selectObject(null);
        return;
      }

      // Undo (Ctrl+Z)
      if (key === EDITOR_SHORTCUTS.undo && isCtrlOrCmd && !e.shiftKey) {
        if (canUndo()) {
          e.preventDefault();
          undo();
        }
        return;
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (
        (key === EDITOR_SHORTCUTS.redo && isCtrlOrCmd) ||
        (key === "z" && isCtrlOrCmd && e.shiftKey)
      ) {
        if (canRedo()) {
          e.preventDefault();
          redo();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedObjectId,
    setTransformMode,
    toggleSnap,
    toggleGrid,
    selectObject,
    removeObject,
    duplicateObject,
    undo,
    redo,
    canUndo,
    canRedo,
  ]);
}
