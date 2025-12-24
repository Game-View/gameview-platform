import { create } from "zustand";

export type MessageRole = "user" | "spark";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ProjectBriefDraft {
  projectName?: string;
  experienceType?: string;
  concept?: string;
  targetAudience?: string;
  setting?: string;
  interactiveElements?: string[];
  contentAssets?: {
    has360Content?: boolean;
    contentDescription?: string;
  };
  scope?: string;
  additionalNotes?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  briefDraft: ProjectBriefDraft;
  conversationPhase: "welcome" | "discovery" | "refinement" | "summary";
  streamingMessageId: string | null;

  // Actions
  addMessage: (role: MessageRole, content: string) => string;
  appendToMessage: (messageId: string, text: string) => void;
  finalizeMessage: (messageId: string) => void;
  setTyping: (typing: boolean) => void;
  updateBriefDraft: (updates: Partial<ProjectBriefDraft>) => void;
  setConversationPhase: (phase: ChatState["conversationPhase"]) => void;
  clearChat: () => void;
  getMessagesForAPI: () => { role: "user" | "assistant"; content: string }[];
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  briefDraft: {},
  conversationPhase: "welcome",
  streamingMessageId: null,

  addMessage: (role, content) => {
    const id = generateId();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id,
          role,
          content,
          timestamp: new Date(),
          isStreaming: role === "spark",
        },
      ],
      streamingMessageId: role === "spark" ? id : state.streamingMessageId,
    }));
    return id;
  },

  appendToMessage: (messageId, text) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content: msg.content + text } : msg
      ),
    })),

  finalizeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isStreaming: false } : msg
      ),
      streamingMessageId: null,
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
      streamingMessageId: null,
    }),

  // Format messages for the API (convert spark -> assistant)
  getMessagesForAPI: () => {
    const { messages } = get();
    return messages.map((msg) => ({
      role: msg.role === "spark" ? "assistant" as const : "user" as const,
      content: msg.content,
    }));
  },
}));
