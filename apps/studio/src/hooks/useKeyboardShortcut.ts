import { useEffect, useCallback } from "react";

type ModifierKey = "ctrl" | "meta" | "alt" | "shift";

interface ShortcutOptions {
  key: string;
  modifiers?: ModifierKey[];
  callback: () => void;
  preventDefault?: boolean;
  disabled?: boolean;
}

export function useKeyboardShortcut({
  key,
  modifiers = [],
  callback,
  preventDefault = true,
  disabled = false,
}: ShortcutOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Check if the key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      // Check modifiers
      const ctrlRequired = modifiers.includes("ctrl");
      const metaRequired = modifiers.includes("meta");
      const altRequired = modifiers.includes("alt");
      const shiftRequired = modifiers.includes("shift");

      // For cross-platform support, treat Cmd (meta) and Ctrl as interchangeable
      const cmdOrCtrl = ctrlRequired || metaRequired;
      const hasCmdOrCtrl = event.ctrlKey || event.metaKey;

      if (cmdOrCtrl && !hasCmdOrCtrl) return;
      if (!cmdOrCtrl && hasCmdOrCtrl) return;
      if (altRequired && !event.altKey) return;
      if (!altRequired && event.altKey) return;
      if (shiftRequired && !event.shiftKey) return;
      if (!shiftRequired && event.shiftKey) return;

      // Don't trigger if user is typing in an input
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow Escape even in inputs
      if (isInput && key.toLowerCase() !== "escape") return;

      if (preventDefault) {
        event.preventDefault();
      }

      callback();
    },
    [key, modifiers, callback, preventDefault, disabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for multiple shortcuts
export function useKeyboardShortcuts(shortcuts: ShortcutOptions[]) {
  useEffect(() => {
    const handlers = shortcuts.map((shortcut) => {
      return (event: KeyboardEvent) => {
        if (shortcut.disabled) return;

        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) return;

        const modifiers = shortcut.modifiers || [];
        const ctrlRequired = modifiers.includes("ctrl");
        const metaRequired = modifiers.includes("meta");
        const cmdOrCtrl = ctrlRequired || metaRequired;
        const hasCmdOrCtrl = event.ctrlKey || event.metaKey;

        if (cmdOrCtrl && !hasCmdOrCtrl) return;
        if (!cmdOrCtrl && hasCmdOrCtrl) return;
        if (modifiers.includes("alt") && !event.altKey) return;
        if (!modifiers.includes("alt") && event.altKey) return;
        if (modifiers.includes("shift") && !event.shiftKey) return;
        if (!modifiers.includes("shift") && event.shiftKey) return;

        const target = event.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (isInput && shortcut.key.toLowerCase() !== "escape") return;

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        shortcut.callback();
      };
    });

    handlers.forEach((handler) => window.addEventListener("keydown", handler));
    return () => {
      handlers.forEach((handler) => window.removeEventListener("keydown", handler));
    };
  }, [shortcuts]);
}
