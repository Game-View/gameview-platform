"use client";

import { useRef, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, RotateCcw, FileText } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { ChatMessage, SparkTypingIndicator } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SparkWelcome } from "@/components/chat/SparkWelcome";
import type { CreatorType, CreationGoal } from "@gameview/types";

export default function SparkPage() {
  const { user, isLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isTyping,
    addMessage,
    setTyping,
    clearChat,
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

  const handleSendMessage = async (content: string) => {
    // Add user message
    addMessage("user", content);
    setTyping(true);

    // Simulate Spark response (will be replaced with Claude API in Sprint 3)
    setTimeout(() => {
      // For now, Spark gives contextual placeholder responses
      const sparkResponse = generateSparkResponse(content, metadata?.creatorType);
      addMessage("spark", sparkResponse);
      setTyping(false);
    }, 1500);
  };

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
      <header className="border-b border-gv-neutral-800 bg-gv-neutral-900 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
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
                  onClick={clearChat}
                  className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
                  title="Start over"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
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

      {/* Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
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
      </main>

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
    </div>
  );
}

// Temporary placeholder response generator (will be replaced by Claude API)
function generateSparkResponse(userMessage: string, creatorType?: CreatorType): string {
  const lowerMessage = userMessage.toLowerCase();

  // Context-aware intro
  const creatorContext = creatorType
    ? {
        musician: "your music and artistry",
        content_creator: "your content and audience",
        brand_agency: "your brand's story",
        sports_entertainment: "your fans and their energy",
        venue_events: "your venue's unique atmosphere",
        other: "your creative vision",
      }[creatorType]
    : "your creative vision";

  // Simple pattern matching for demo
  if (lowerMessage.includes("fan experience") || lowerMessage.includes("audience")) {
    return `I love that you want to create a deeper connection with your audience! Fan experiences are all about making people feel like they're part of something special.

Let me ask you a few questions to understand your vision better:

1. **Where will this experience take place?** Is there a specific venue, location, or setting you have in mind?

2. **What's the main emotion you want fans to feel?** Excitement, nostalgia, wonder, connection?

3. **Do you have any existing content** (photos, videos, music) that could be part of this experience?

Take your time - I'm here to help you shape ${creatorContext} into something unforgettable.`;
  }

  if (lowerMessage.includes("virtual tour") || lowerMessage.includes("tour")) {
    return `Virtual tours are a fantastic way to let people explore spaces from anywhere in the world!

To help you design the perfect tour, I'd like to know:

1. **What location do you want to feature?** A venue, studio, museum, or somewhere else?

2. **What story do you want to tell** as people move through the space?

3. **Are there any interactive elements** you'd like to include - like hidden items, audio guides, or clickable hotspots?

This is going to be a great way to showcase ${creatorContext}!`;
  }

  if (lowerMessage.includes("treasure hunt") || lowerMessage.includes("scavenger")) {
    return `Treasure hunts add such an exciting layer of interactivity! People love the thrill of discovery.

Let's figure out the basics:

1. **What's the setting?** Indoor, outdoor, or a hybrid experience?

2. **What are players searching for?** Physical items, digital collectibles, clues, or all of the above?

3. **Is there a narrative or theme** tying the hunt together?

We can make this tied to ${creatorContext} in really creative ways!`;
  }

  if (lowerMessage.includes("not sure") || lowerMessage.includes("explore") || lowerMessage.includes("help me")) {
    return `No problem at all - that's exactly what I'm here for! Sometimes the best ideas come from just talking things through.

Let me ask you a few open-ended questions:

1. **What excites you most** about creating interactive experiences?

2. **Is there something your audience has been asking for** that you haven't been able to deliver yet?

3. **Think of an experience you've had** (at a concert, museum, event) that really stuck with you. What made it memorable?

There's no wrong answer - we're just exploring possibilities together!`;
  }

  // Default response
  return `That sounds like an interesting direction! I want to make sure I fully understand ${creatorContext}.

Can you tell me more about:

1. **Who is this experience for?** Your existing fans, new audiences, or a specific group?

2. **What's the main goal?** Engagement, education, promotion, or something else?

3. **Do you have a rough idea of the scope?** Something quick and simple, or a more elaborate experience?

The more context you share, the better I can help you shape this into something amazing!`;
}
