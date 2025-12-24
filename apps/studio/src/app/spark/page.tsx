"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, RotateCcw, FileText } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { ChatMessage, SparkTypingIndicator } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SparkWelcome } from "@/components/chat/SparkWelcome";
import { BriefPanel } from "@/components/brief/BriefPanel";
import type { ExtractedBrief } from "@/app/api/brief/extract/route";
import type { CreatorType, CreationGoal } from "@gameview/types";

export default function SparkPage() {
  const { user, isLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Brief panel state
  const [showBriefPanel, setShowBriefPanel] = useState(false);
  const [extractedBrief, setExtractedBrief] = useState<ExtractedBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const {
    messages,
    isTyping,
    addMessage,
    appendToMessage,
    finalizeMessage,
    setTyping,
    clearChat,
    getMessagesForAPI,
  } = useChatStore();

  // Get user profile from Clerk metadata
  const metadata = user?.unsafeMetadata as {
    creatorType?: CreatorType;
    creationGoals?: CreationGoal[];
  } | undefined;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Extract brief from conversation
  const extractBrief = useCallback(async () => {
    const conversationMessages = getMessagesForAPI();
    if (conversationMessages.length === 0) return;

    setBriefLoading(true);
    setBriefError(null);

    try {
      const response = await fetch("/api/brief/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationMessages }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extract brief");
      }

      const brief: ExtractedBrief = await response.json();
      setExtractedBrief(brief);
    } catch (error) {
      console.error("Brief extraction error:", error);
      setBriefError(error instanceof Error ? error.message : "Failed to extract brief");
    } finally {
      setBriefLoading(false);
    }
  }, [getMessagesForAPI]);

  // Open brief panel and extract
  const handleOpenBrief = useCallback(() => {
    setShowBriefPanel(true);
    extractBrief();
  }, [extractBrief]);

  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    addMessage("user", content);
    setTyping(true);

    try {
      // Get conversation history for context
      const conversationMessages = getMessagesForAPI();

      // Add the new user message
      conversationMessages.push({ role: "user", content });

      // Call the streaming API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: conversationMessages }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      // Create a placeholder message for streaming
      const sparkMessageId = addMessage("spark", "");
      setTyping(false);

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              finalizeMessage(sparkMessageId);
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                appendToMessage(sparkMessageId, parsed.text);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      finalizeMessage(sparkMessageId);

      // Auto-refresh brief if panel is open
      if (showBriefPanel) {
        extractBrief();
      }
    } catch (error) {
      console.error("Chat error:", error);
      setTyping(false);
      // Add error message
      addMessage(
        "spark",
        "I apologize, but I encountered an issue. Please try again, or check that your connection is stable."
      );
    }
  }, [addMessage, appendToMessage, finalizeMessage, getMessagesForAPI, setTyping, showBriefPanel, extractBrief]);

  // Handle clear chat
  const handleClearChat = useCallback(() => {
    clearChat();
    setExtractedBrief(null);
    setShowBriefPanel(false);
  }, [clearChat]);

  const hasMessages = messages.length > 0;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gv-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gv-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gv-neutral-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gv-neutral-800 bg-gv-neutral-900 flex-shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 text-gv-neutral-400 hover:text-white transition-colors -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐰</span>
              <span className="font-bold text-white text-xl tracking-wide">GAME VIEW</span>
              <span className="text-gv-primary-500 font-semibold">Spark</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasMessages && (
              <>
                <button
                  onClick={handleClearChat}
                  className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
                  title="Start over"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  onClick={handleOpenBrief}
                  className={`p-2 transition-colors ${
                    showBriefPanel
                      ? "text-gv-primary-500"
                      : "text-gv-neutral-400 hover:text-white"
                  }`}
                  title="View brief draft"
                >
                  <FileText className="h-5 w-5" />
                </button>
              </>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content with Optional Brief Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <main className={`flex-1 flex flex-col overflow-hidden transition-all ${
          showBriefPanel ? "mr-0" : ""
        }`}>
          {!hasMessages ? (
            <SparkWelcome
              firstName={user?.firstName || undefined}
              creatorType={metadata?.creatorType}
              creationGoals={metadata?.creationGoals}
              onSuggestionClick={handleSendMessage}
            />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && <SparkTypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={isTyping}
            placeholder={
              hasMessages
                ? "Continue the conversation..."
                : "Tell Spark about your vision..."
            }
          />
        </main>

        {/* Brief Panel (Slide-in) */}
        <div
          className={`w-96 flex-shrink-0 transition-all duration-300 ease-in-out ${
            showBriefPanel ? "translate-x-0" : "translate-x-full w-0"
          }`}
        >
          {showBriefPanel && (
            <BriefPanel
              brief={extractedBrief}
              isLoading={briefLoading}
              error={briefError}
              onClose={() => setShowBriefPanel(false)}
              onRefresh={extractBrief}
            />
          )}
        </div>
      </div>
    </div>
  );
}
