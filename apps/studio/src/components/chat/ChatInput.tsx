"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gv-neutral-800 bg-gv-neutral-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-3 items-end bg-gv-neutral-800 rounded-gv-lg border border-gv-neutral-700 focus-within:border-gv-primary-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Tell Spark about your vision..."}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gv-neutral-500 px-4 py-3 resize-none focus:outline-none text-sm leading-relaxed"
            style={{ maxHeight: "150px" }}
          />
          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className={`flex-shrink-0 p-3 m-1 rounded-gv transition-all ${
              disabled || !value.trim()
                ? "text-gv-neutral-600 cursor-not-allowed"
                : "text-gv-primary-500 hover:bg-gv-primary-500/10"
            }`}
          >
            {disabled ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gv-neutral-600 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
