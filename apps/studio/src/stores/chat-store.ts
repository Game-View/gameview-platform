import { create } from "zustand";

export type MessageRole = "user" | "spark";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface ProjectBriefDraft {
  projectName?: string;
  experienceType?: string;
  targetAudience?: string;
  venueDescription?: string;
  interactiveElements?: string[];
  estimatedDuration?: string;
  specialRequirements?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  briefDraft: ProjectBriefDraft;
  conversationPhase: "welcome" | "discovery" | "refinement" | "summary";

  // Actions
  addMessage: (role: MessageRole, content: string) => void;
  setTyping: (typing: boolean) => void;
  updateBriefDraft: (updates: Partial<ProjectBriefDraft>) => void;
  setConversationPhase: (phase: ChatState["conversationPhase"]) => void;
  clearChat: () => void;
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  briefDraft: {},
  conversationPhase: "welcome",

  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role,
          content,
          timestamp: new Date(),
        },
      ],
    })),

  setTyping: (typing) => set({ isTyping: typing }),

  updateBriefDraft: (updates) =>
    set((state) => ({
      briefDraft: { ...state.briefDraft, ...updates },
    })),

  setConversationPhase: (phase) => set({ conversationPhase: phase }),

  clearChat: () =>
    set({
      messages: [],
      isTyping: false,
      briefDraft: {},
      conversationPhase: "welcome",
    }),
}));
