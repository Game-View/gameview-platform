import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Production,
  VideoFile,
  ProcessingProgress,
  AppSettings,
  RecentProduction,
} from '@gameview/types';

interface AppState {
  // Current production
  currentProduction: Production | null;
  setCurrentProduction: (production: Production | null) => void;

  // Processing state
  isProcessing: boolean;
  processingProgress: ProcessingProgress;
  setProcessing: (isProcessing: boolean) => void;
  setProcessingProgress: (progress: ProcessingProgress) => void;

  // Videos
  addVideos: (videos: VideoFile[]) => void;
  removeVideo: (videoId: string) => void;
  updateVideo: (videoId: string, updates: Partial<VideoFile>) => void;

  // Production settings
  updateProductionSettings: (settings: Partial<Production['settings']>) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Recent productions
  addRecentProduction: (production: RecentProduction) => void;
  clearRecentProductions: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  defaultOutputDir: '',
  defaultPreset: 'balanced',
  recentProductions: [],
};

const defaultProgress: ProcessingProgress = {
  stage: 'idle',
  progress: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Current production
      currentProduction: null,
      setCurrentProduction: (production) => set({ currentProduction: production }),

      // Processing state
      isProcessing: false,
      processingProgress: defaultProgress,
      setProcessing: (isProcessing) => set({ isProcessing }),
      setProcessingProgress: (progress) => set({ processingProgress: progress }),

      // Videos
      addVideos: (videos) => {
        const production = get().currentProduction;
        if (production) {
          set({
            currentProduction: {
              ...production,
              videos: [...production.videos, ...videos],
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },
      removeVideo: (videoId) => {
        const production = get().currentProduction;
        if (production) {
          set({
            currentProduction: {
              ...production,
              videos: production.videos.filter((v) => v.id !== videoId),
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },
      updateVideo: (videoId, updates) => {
        const production = get().currentProduction;
        if (production) {
          set({
            currentProduction: {
              ...production,
              videos: production.videos.map((v) =>
                v.id === videoId ? { ...v, ...updates } : v
              ),
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      // Production settings
      updateProductionSettings: (settingsUpdates) => {
        const production = get().currentProduction;
        if (production) {
          set({
            currentProduction: {
              ...production,
              settings: { ...production.settings, ...settingsUpdates },
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      // Settings
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      // Recent productions
      addRecentProduction: (production) =>
        set((state) => ({
          settings: {
            ...state.settings,
            recentProductions: [
              production,
              ...state.settings.recentProductions.filter((p) => p.id !== production.id),
            ].slice(0, 10), // Keep only last 10
          },
        })),
      clearRecentProductions: () =>
        set((state) => ({
          settings: { ...state.settings, recentProductions: [] },
        })),
    }),
    {
      name: 'gameview-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
