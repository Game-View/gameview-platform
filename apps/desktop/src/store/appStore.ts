import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Production,
  VideoFile,
  ProcessingProgress,
  AppSettings,
  RecentProduction,
  ProductionSettings,
  GVProject,
} from '@gameview/types';
import { PRESET_SETTINGS } from '@gameview/types';

interface AppState {
  // Current production
  currentProduction: Production | null;
  setCurrentProduction: (production: Production | null) => void;

  // Project management
  projectPath: string | null;
  isProjectDirty: boolean;
  setProjectPath: (path: string | null) => void;
  setProjectDirty: (dirty: boolean) => void;
  createNewProject: (name: string, outputDir: string) => void;
  loadProject: (project: GVProject, path: string) => void;
  getProjectData: () => GVProject | null;

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
  theme: 'dark',
  defaultOutputDir: '',
  defaultPreset: 'balanced',
  recentProductions: [],
};

const defaultProgress: ProcessingProgress = {
  stage: 'idle',
  progress: 0,
};

// Create default production settings from preset
const createDefaultProductionSettings = (preset: 'fast' | 'balanced' | 'high' | 'maximum' = 'balanced'): ProductionSettings => ({
  preset,
  totalSteps: PRESET_SETTINGS[preset].totalSteps ?? 15000,
  maxSplats: PRESET_SETTINGS[preset].maxSplats ?? 7500000,
  sizePercentage: PRESET_SETTINGS[preset].sizePercentage ?? 75,
  splatFps: PRESET_SETTINGS[preset].splatFps ?? 20,
  splatVideoLengthSeconds: PRESET_SETTINGS[preset].splatVideoLengthSeconds ?? 10,
  autoSync: true,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Current production
      currentProduction: null,
      setCurrentProduction: (production) => set({ currentProduction: production }),

      // Project management
      projectPath: null,
      isProjectDirty: false,
      setProjectPath: (path) => set({ projectPath: path }),
      setProjectDirty: (dirty) => set({ isProjectDirty: dirty }),

      createNewProject: (name, outputDir) => {
        const now = new Date().toISOString();
        const id = `prod-${Date.now()}`;
        const production: Production = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          videos: [],
          settings: createDefaultProductionSettings(get().settings.defaultPreset),
          status: 'draft',
          outputPath: outputDir,
        };
        set({
          currentProduction: production,
          projectPath: null,
          isProjectDirty: true,
        });
      },

      loadProject: (project, path) => {
        const now = new Date().toISOString();
        const production: Production = {
          id: `prod-${Date.now()}`,
          name: project.metadata.name,
          description: project.metadata.description,
          createdAt: project.metadata.created,
          updatedAt: now,
          videos: project.production.videoFiles.map((filePath, idx) => ({
            id: `video-${idx}`,
            path: filePath,
            name: filePath.split('/').pop() || filePath,
          })),
          settings: project.production.settings,
          status: project.production.status,
          outputPath: project.production.outputDir,
          projectPath: path,
        };
        set({
          currentProduction: production,
          projectPath: path,
          isProjectDirty: false,
        });
      },

      getProjectData: () => {
        const production = get().currentProduction;
        if (!production) return null;

        const project: GVProject = {
          version: '1.0',
          type: 'gameview-project',
          metadata: {
            name: production.name,
            description: production.description,
            created: production.createdAt,
            modified: new Date().toISOString(),
          },
          production: {
            videoFiles: production.videos.map(v => v.path),
            outputDir: production.outputPath || './output',
            settings: production.settings,
            status: production.status,
          },
        };
        return project;
      },

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
            isProjectDirty: true,
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
            isProjectDirty: true,
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
            isProjectDirty: true,
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
            isProjectDirty: true,
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
