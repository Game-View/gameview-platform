"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Home,
  Settings,
  Plus,
  FolderOpen,
  MessageSquare,
  User,
  Command,
} from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  category: "navigation" | "actions" | "recent";
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define commands
  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "spark",
        label: "Start with Spark",
        description: "Begin a new conversation with AI",
        icon: <Sparkles className="h-4 w-4" />,
        action: () => router.push("/spark"),
        shortcut: "S",
        category: "actions",
      },
      {
        id: "dashboard",
        label: "Go to Dashboard",
        description: "View your projects",
        icon: <Home className="h-4 w-4" />,
        action: () => router.push("/dashboard"),
        shortcut: "D",
        category: "navigation",
      },
      {
        id: "settings",
        label: "Settings",
        description: "Manage your account",
        icon: <Settings className="h-4 w-4" />,
        action: () => router.push("/settings"),
        category: "navigation",
      },
      {
        id: "new-project",
        label: "New Project",
        description: "Create a blank project",
        icon: <Plus className="h-4 w-4" />,
        action: () => router.push("/spark"),
        shortcut: "N",
        category: "actions",
      },
      {
        id: "projects",
        label: "View All Projects",
        description: "Browse your saved projects",
        icon: <FolderOpen className="h-4 w-4" />,
        action: () => router.push("/dashboard"),
        category: "navigation",
      },
      {
        id: "profile",
        label: "Edit Profile",
        description: "Update your creator profile",
        icon: <User className="h-4 w-4" />,
        action: () => router.push("/onboarding"),
        category: "navigation",
      },
    ],
    [router]
  );

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const executeCommand = (command: CommandItem) => {
    command.action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative bg-gv-neutral-900 border border-gv-neutral-700 rounded-gv-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gv-neutral-800">
          <Search className="h-5 w-5 text-gv-neutral-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder:text-gv-neutral-500 focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gv-neutral-800 rounded text-xs text-gv-neutral-400">
            <span>esc</span>
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gv-neutral-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={() => executeCommand(command)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-gv-primary-500/20 text-white"
                    : "text-gv-neutral-300 hover:bg-gv-neutral-800"
                }`}
              >
                <span
                  className={`p-2 rounded-gv ${
                    index === selectedIndex
                      ? "bg-gv-primary-500/20 text-gv-primary-400"
                      : "bg-gv-neutral-800 text-gv-neutral-400"
                  }`}
                >
                  {command.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{command.label}</p>
                  {command.description && (
                    <p className="text-sm text-gv-neutral-500 truncate">
                      {command.description}
                    </p>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="hidden sm:block px-2 py-1 bg-gv-neutral-800 rounded text-xs text-gv-neutral-400">
                    {command.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gv-neutral-800 flex items-center justify-between text-xs text-gv-neutral-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gv-neutral-800 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gv-neutral-800 rounded">↓</kbd>
              <span className="ml-1">to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gv-neutral-800 rounded">↵</kbd>
              <span className="ml-1">to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />K to open
          </span>
        </div>
      </div>
    </div>
  );
}

// Global command palette provider hook
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useKeyboardShortcut({
    key: "k",
    modifiers: ["meta"],
    callback: () => setIsOpen(true),
  });

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
