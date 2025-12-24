"use client";

import { Sparkles, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/stores/chat-store";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 animate-slide-up ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-gv-neutral-700"
            : "bg-gv-primary-500/20"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-gv-neutral-300" />
        ) : (
          <Sparkles className="h-4 w-4 text-gv-primary-500" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-gv-lg ${
          isUser
            ? "bg-gv-neutral-700 text-white"
            : "bg-gv-neutral-800 border border-gv-neutral-700 text-gv-neutral-100"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export function SparkTypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gv-primary-500/20 flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-gv-primary-500 animate-pulse" />
      </div>

      {/* Typing Dots */}
      <div className="px-4 py-3 rounded-gv-lg bg-gv-neutral-800 border border-gv-neutral-700">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gv-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-gv-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-gv-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
