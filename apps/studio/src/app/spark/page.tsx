"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useUser, UserButton } from "@/lib/auth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, FileText, FolderOpen, Command } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { toast } from "@/stores/toast-store";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { ChatMessage, SparkTypingIndicator } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SparkWelcome } from "@/components/chat/SparkWelcome";
import { BriefPanel } from "@/components/brief/BriefPanel";
import type { ExtractedBrief } from "@/app/api/brief/extract/route";
import type { CreatorType, CreationGoal } from "@gameview/types";

export default function SparkPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Brief panel state
  const [showBriefPanel, setShowBriefPanel] = useState(false);
  const [extractedBrief, setExtractedBrief] = useState<ExtractedBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedBriefId, setSavedBriefId] = useState<string | null>(null);

  // Loaded project state
  const [loadedProjectName, setLoadedProjectName] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const {
    messages,
    isTyping,
    addMessage,
    appendToMessage,
    finalizeMessage,
    setTyping,
    clearChat,
    loadMessages,
    getMessagesForAPI,
  } = useChatStore();

  // Get user profile from Clerk metadata
  const metadata = user?.unsafeMetadata as {
    creatorType?: CreatorType;
    creationGoals?: CreationGoal[];
  } | undefined;

  // Escape key to close brief panel
  useKeyboardShortcut({
    key: "Escape",
    callback: () => {
      if (showBriefPanel) {
        setShowBriefPanel(false);
      }
    },
    disabled: !showBriefPanel,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load brief from URL parameter
  useEffect(() => {
    const briefId = searchParams.get("brief");
    if (!briefId || messages.length > 0) return;

    async function loadBrief() {
      setIsLoadingProject(true);
      try {
        const response = await fetch(`/api/briefs/${briefId}`);
        if (!response.ok) {
          console.error("Failed to load brief");
          toast.error("Load failed", "Could not load the project. It may have been deleted.");
          return;
        }

        const brief = await response.json();

        // Set the saved brief ID so updates go to this brief
        setSavedBriefId(brief.id);
        setLoadedProjectName(brief.name || "Untitled Project");

        // Load conversation history if available
        if (brief.conversationHistory && brief.conversationHistory.length > 0) {
          loadMessages(brief.conversationHistory);
        }

        // Set the extracted brief for the panel
        setExtractedBrief({
          name: brief.name,
          tagline: brief.tagline,
          experienceType: brief.experienceType,
          concept: brief.concept,
          targetAudience: brief.targetAudience,
          setting: brief.setting,
          narrative: brief.narrative,
          interactiveElements: brief.interactiveElements || [],
          collectibles: brief.collectibles,
          winCondition: brief.winCondition,
          duration: brief.duration,
          difficulty: brief.difficulty,
          playerMode: brief.playerMode,
          contentStatus: brief.contentStatus,
          contentDescription: brief.contentDescription,
          estimatedScenes: brief.estimatedScenes,
          completeness: brief.completeness,
          missingElements: brief.missingElements || [],
          suggestedNextQuestions: brief.suggestedNextQuestions || [],
        });
      } catch (error) {
        console.error("Error loading brief:", error);
      } finally {
        setIsLoadingProject(false);
      }
    }

    loadBrief();
  }, [searchParams, messages.length, loadMessages]);

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
      const message = error instanceof Error ? error.message : "Failed to extract brief";
      setBriefError(message);
      toast.error("Extraction failed", message);
    } finally {
      setBriefLoading(false);
    }
  }, [getMessagesForAPI]);

  // Save brief to database (create or update)
  const saveBrief = useCallback(async (silent = false) => {
    if (!extractedBrief) return;

    if (!silent) setIsSaving(true);
    try {
      const conversationHistory = getMessagesForAPI();

      // Update existing brief or create new one
      const url = savedBriefId ? `/api/briefs/${savedBriefId}` : "/api/briefs";
      const method = savedBriefId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: extractedBrief,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save brief");
      }

      const saved = await response.json();
      if (!savedBriefId) {
        setSavedBriefId(saved.id);
        setLoadedProjectName(saved.name || "Untitled Project");
        if (!silent) {
          toast.success("Brief saved!", "Your project has been saved to your dashboard.");
        }
      } else if (!silent) {
        toast.success("Brief updated", "Changes saved successfully.");
      }

      if (!silent) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (error) {
      console.error("Save brief error:", error);
      if (!silent) {
        const message = error instanceof Error ? error.message : "Failed to save brief";
        toast.error("Save failed", message);
        setBriefError(message);
      }
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, [extractedBrief, getMessagesForAPI, savedBriefId]);

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

      // Auto-save conversation to existing brief
      if (savedBriefId) {
        // Small delay to ensure message is finalized
        setTimeout(async () => {
          try {
            const history = getMessagesForAPI();
            await fetch(`/api/briefs/${savedBriefId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationHistory: history }),
            });
          } catch (err) {
            console.error("Auto-save failed:", err);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setTyping(false);
      toast.error("Connection issue", "Please try again or check your connection.");
      // Add error message in chat
      addMessage(
        "spark",
        "I apologize, but I encountered an issue. Please try again, or check that your connection is stable."
      );
    }
  }, [addMessage, appendToMessage, finalizeMessage, getMessagesForAPI, setTyping, showBriefPanel, extractBrief, savedBriefId]);

  // Handle clear chat
  const handleClearChat = useCallback(() => {
    clearChat();
    setExtractedBrief(null);
    setShowBriefPanel(false);
    setSavedBriefId(null);
    setIsSaved(false);
    setLoadedProjectName(null);
    // Clear the URL parameter
    window.history.replaceState({}, "", "/spark");
  }, [clearChat]);

  // Handle brief field updates from edit mode
  const handleBriefUpdate = useCallback(
    async (updates: Partial<ExtractedBrief>) => {
      if (!extractedBrief) return;

      // Update local state immediately
      const updatedBrief = { ...extractedBrief, ...updates };
      setExtractedBrief(updatedBrief);

      // Update the loaded project name if name was changed
      if (updates.name) {
        setLoadedProjectName(updates.name);
      }

      // Auto-save to database if we have a saved brief
      if (savedBriefId) {
        try {
          await fetch(`/api/briefs/${savedBriefId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brief: updates }),
          });
        } catch (err) {
          console.error("Auto-save brief update failed:", err);
        }
      }
    },
    [extractedBrief, savedBriefId]
  );

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
            {/* Project indicator */}
            {loadedProjectName && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gv-neutral-800/80 border border-gv-neutral-700 rounded-full">
                <FolderOpen className="h-3.5 w-3.5 text-gv-primary-500" />
                <span className="text-sm text-gv-neutral-300 max-w-[200px] truncate">
                  {loadedProjectName}
                </span>
              </div>
            )}
            {isLoadingProject && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gv-neutral-800/50 rounded-full">
                <div className="w-3 h-3 border-2 border-gv-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gv-neutral-400">Loading...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Keyboard shortcut hint */}
            <button
              className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-gv-neutral-500 hover:text-gv-neutral-300 transition-colors"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              title="Quick actions (⌘K)"
            >
              <Command className="h-3 w-3" />
              <span>K</span>
            </button>
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
              onSave={saveBrief}
              onBriefUpdate={handleBriefUpdate}
              isSaving={isSaving}
              isSaved={isSaved}
              savedBriefId={savedBriefId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
