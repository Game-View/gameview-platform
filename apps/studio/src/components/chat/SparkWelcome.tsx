"use client";

import { Sparkles, Lightbulb, Map, Search, Palette, ArrowRight } from "lucide-react";
import type { CreatorType, CreationGoal } from "@gameview/types";

interface SparkWelcomeProps {
  firstName?: string;
  creatorType?: CreatorType;
  creationGoals?: CreationGoal[];
  onSuggestionClick: (suggestion: string) => void;
}

const CREATOR_CONTEXTS: Record<CreatorType, string> = {
  musician: "As a musician, you know how to create emotional connections through your art",
  content_creator: "As a content creator, you understand how to engage and captivate audiences",
  brand_agency: "Your brand expertise means you know how to create memorable experiences",
  sports_entertainment: "Sports and entertainment thrive on fan energy and engagement",
  venue_events: "Venues and events are all about creating unforgettable moments",
  other: "Every creative journey starts with an idea",
};

const GOAL_SUGGESTIONS: Record<CreationGoal, { icon: React.ReactNode; text: string; prompt: string }> = {
  fan_experiences: {
    icon: <Sparkles className="h-4 w-4" />,
    text: "Create a fan experience",
    prompt: "I want to create an immersive fan experience that brings my audience closer to my work",
  },
  virtual_tours: {
    icon: <Map className="h-4 w-4" />,
    text: "Build a virtual tour",
    prompt: "I'd like to create a virtual tour that lets people explore a location remotely",
  },
  treasure_hunts: {
    icon: <Search className="h-4 w-4" />,
    text: "Design a treasure hunt",
    prompt: "I'm thinking about creating an interactive treasure hunt experience",
  },
  branded_content: {
    icon: <Palette className="h-4 w-4" />,
    text: "Develop branded content",
    prompt: "I need to create branded content that tells a compelling story",
  },
  still_exploring: {
    icon: <Lightbulb className="h-4 w-4" />,
    text: "Explore possibilities",
    prompt: "I'm not sure what I want to create yet - can you help me explore the possibilities?",
  },
};

export function SparkWelcome({ firstName, creatorType, creationGoals, onSuggestionClick }: SparkWelcomeProps) {
  const contextMessage = creatorType ? CREATOR_CONTEXTS[creatorType] : CREATOR_CONTEXTS.other;
  const suggestions = creationGoals?.map((goal) => GOAL_SUGGESTIONS[goal]) || [];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Spark Avatar */}
      <div className="w-20 h-20 rounded-full bg-gv-primary-500/20 flex items-center justify-center mb-6 animate-pulse-glow">
        <Sparkles className="h-10 w-10 text-gv-primary-500" />
      </div>

      {/* Welcome Message */}
      <h1 className="text-2xl font-bold text-white mb-3 text-center">
        Hey{firstName ? ` ${firstName}` : ""}! I&apos;m Spark
      </h1>
      <p className="text-gv-neutral-400 text-center max-w-md mb-2">
        {contextMessage}. Let&apos;s turn your vision into an interactive 3D experience.
      </p>
      <p className="text-gv-neutral-500 text-sm text-center max-w-md mb-8">
        Tell me about what you want to create, or pick a starting point below.
      </p>

      {/* Quick Start Suggestions */}
      {suggestions.length > 0 && (
        <div className="w-full max-w-lg space-y-3">
          {suggestions.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion.text}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className="w-full flex items-center gap-3 p-4 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg hover:border-gv-primary-500/50 hover:bg-gv-neutral-800 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-gv bg-gv-primary-500/10 flex items-center justify-center text-gv-primary-500 group-hover:bg-gv-primary-500/20 transition-colors">
                {suggestion.icon}
              </div>
              <span className="flex-1 text-gv-neutral-200 group-hover:text-white transition-colors">
                {suggestion.text}
              </span>
              <ArrowRight className="h-4 w-4 text-gv-neutral-600 group-hover:text-gv-primary-500 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Fallback if no goals */}
      {suggestions.length === 0 && (
        <div className="w-full max-w-lg space-y-3">
          <button
            onClick={() => onSuggestionClick("I want to create an immersive 3D experience for my audience")}
            className="w-full flex items-center gap-3 p-4 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg hover:border-gv-primary-500/50 hover:bg-gv-neutral-800 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-gv bg-gv-primary-500/10 flex items-center justify-center text-gv-primary-500 group-hover:bg-gv-primary-500/20 transition-colors">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="flex-1 text-gv-neutral-200 group-hover:text-white transition-colors">
              Create an immersive experience
            </span>
            <ArrowRight className="h-4 w-4 text-gv-neutral-600 group-hover:text-gv-primary-500 transition-colors" />
          </button>
          <button
            onClick={() => onSuggestionClick("I'm not sure what I want to create yet - can you help me explore?")}
            className="w-full flex items-center gap-3 p-4 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg hover:border-gv-primary-500/50 hover:bg-gv-neutral-800 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-gv bg-gv-neutral-700 flex items-center justify-center text-gv-neutral-400 group-hover:bg-gv-neutral-600 transition-colors">
              <Lightbulb className="h-4 w-4" />
            </div>
            <span className="flex-1 text-gv-neutral-200 group-hover:text-white transition-colors">
              I need help exploring ideas
            </span>
            <ArrowRight className="h-4 w-4 text-gv-neutral-600 group-hover:text-gv-primary-500 transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
}
