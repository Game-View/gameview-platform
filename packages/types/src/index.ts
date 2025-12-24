/**
 * @gameview/types
 * Shared TypeScript types for the Game View platform
 */

// ===== Processing Types =====

export type ProcessingStage =
  | 'idle'
  | 'extracting_frames'
  | 'detecting_cameras'  // colmap
  | 'training_splats'    // brush
  | 'exporting'          // metadata
  | 'complete'
  | 'failed';

export type QualityPreset = 'fast' | 'balanced' | 'high' | 'maximum';

export interface ProcessingProgress {
  stage: ProcessingStage;
  progress: number; // 0-100
  message?: string;
  currentStep?: number;
  totalSteps?: number;
}

export interface ProcessingOptions {
  preset: QualityPreset;
  outputDir: string;
  videos: VideoFile[];
  colmapPath?: string;
  brushPath?: string;
}

export interface ProcessingResult {
  success: boolean;
  outputPath?: string;
  plyFile?: string;
  error?: string;
  duration?: number; // milliseconds
}

// ===== CLI Output Types (matches metadata.json from CLI) =====

export interface OutputMetadata {
  version: string;
  processingTime: number; // milliseconds
  framesProcessed: number;
  inputVideos: string[];
  outputFiles: {
    splat: string;    // e.g., "splats/scene.ply"
    thumbnail: string; // e.g., "thumbnail.jpg"
  };
  settings: {
    preset: string;
    totalSteps: number;
    maxSplats: number;
  };
}

// ===== Video Types =====

export interface VideoFile {
  id: string;
  path: string;
  name: string;
  duration?: number; // seconds
  width?: number;
  height?: number;
  fps?: number;
  thumbnailPath?: string;
  syncOffset?: number; // milliseconds
}

// ===== Production Config Types (matches production.json from CLI) =====

export interface ProductionConfig {
  productionName: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  totalSteps: number;        // Brush training steps (default: 15000)
  maxSplats: number;         // Max gaussian splats (default: 7500000)
  sizePercentage: number;    // Image resize % (default: 75)
  splatFps: number;          // Frame extraction FPS (default: 20)
  splatVideoLengthSeconds: number; // Max video duration (default: 10)
  videoFiles: string[];      // Relative paths to video files
}

// Default production config values
export const DEFAULT_PRODUCTION_CONFIG: Omit<ProductionConfig, 'productionName' | 'createdAt' | 'updatedAt' | 'videoFiles'> = {
  totalSteps: 15000,
  maxSplats: 7500000,
  sizePercentage: 75,
  splatFps: 20,
  splatVideoLengthSeconds: 10,
};

// ===== Production Types =====

export interface Production {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO date string
  updatedAt: string;
  videos: VideoFile[];
  settings: ProductionSettings;
  status: ProductionStatus;
  outputPath?: string;
  // Path to .gvproj file or production directory
  projectPath?: string;
}

export interface ProductionSettings {
  preset: QualityPreset;
  totalSteps: number;
  maxSplats: number;
  sizePercentage: number;
  splatFps: number;
  splatVideoLengthSeconds: number;
  autoSync: boolean;
  colmapPath?: string;
  brushPath?: string;
}

// Default production settings (using preset values)
export const PRESET_SETTINGS: Record<QualityPreset, Partial<ProductionSettings>> = {
  fast: {
    totalSteps: 7000,
    maxSplats: 2000000,
    sizePercentage: 50,
    splatFps: 10,
    splatVideoLengthSeconds: 5,
  },
  balanced: {
    totalSteps: 15000,
    maxSplats: 7500000,
    sizePercentage: 75,
    splatFps: 20,
    splatVideoLengthSeconds: 10,
  },
  high: {
    totalSteps: 30000,
    maxSplats: 15000000,
    sizePercentage: 100,
    splatFps: 30,
    splatVideoLengthSeconds: 15,
  },
  maximum: {
    totalSteps: 50000,
    maxSplats: 30000000,
    sizePercentage: 100,
    splatFps: 60,
    splatVideoLengthSeconds: 30,
  },
};

export type ProductionStatus = 'draft' | 'processing' | 'completed' | 'failed';

// ===== Project File Types (.gvproj) =====

export interface GVProject {
  version: '1.0';
  type: 'gameview-project';
  metadata: {
    name: string;
    description?: string;
    created: string; // ISO 8601
    modified: string; // ISO 8601
    author?: string;
  };
  production: {
    videoFiles: string[]; // Relative paths
    outputDir: string;    // Relative path to output
    settings: ProductionSettings;
    status: ProductionStatus;
  };
  output?: {
    splatFile?: string;   // Relative path to PLY
    thumbnail?: string;   // Relative path to thumbnail
    processingTime?: number;
    framesProcessed?: number;
  };
}

// ===== GVVS Format Types (proposed container format) =====

export interface GVVSFile {
  version: '1.0';
  type: 'gaussian-splat';
  metadata: {
    name: string;
    created: string; // ISO 8601
    source: {
      videos: string[];
      frames: number;
    };
  };
  splat: {
    file: string;      // Path to PLY file
    points: number;    // Number of gaussian splats
    format: 'ply-gaussian';
  };
  camera?: {
    path: string;      // Path to COLMAP data
    format: 'colmap-binary';
  };
}

// ===== Settings Types =====

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultOutputDir: string;
  defaultPreset: QualityPreset;
  colmapPath?: string;
  brushPath?: string;
  recentProductions: RecentProduction[];
}

export interface RecentProduction {
  id: string;
  name: string;
  path: string;
  lastOpened: string; // ISO date string
  thumbnail?: string;
}

// ===== API Types =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ===== Splat Viewer Types =====

export interface SplatViewerOptions {
  quality: 'low' | 'medium' | 'high';
  backgroundColor?: string;
  showGrid?: boolean;
  initialCamera?: CameraPosition;
}

export interface CameraPosition {
  position: [number, number, number];
  target: [number, number, number];
  up?: [number, number, number];
}

export interface SplatMetadata {
  pointCount: number;
  boundingBox: BoundingBox;
  center: [number, number, number];
}

export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
}

// ===== User Profile Types (for onboarding) =====

export type CreatorType =
  | 'musician'
  | 'content_creator'
  | 'brand_agency'
  | 'sports_entertainment'
  | 'venue_events'
  | 'other';

export type ExperienceLevel = 'new' | 'some_experience' | 'professional';

export type CreationGoal =
  | 'fan_experiences'
  | 'virtual_tours'
  | 'treasure_hunts'
  | 'branded_content'
  | 'still_exploring';

export type FootageStatus = 'have_footage' | 'no_footage' | 'need_guidance';

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  displayName?: string;

  // Required onboarding fields
  creatorType: CreatorType;
  experienceLevel: ExperienceLevel;
  creationGoals: CreationGoal[];
  footageStatus: FootageStatus;

  // Optional fields
  socialLinks?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  teamSize?: 'solo' | 'small_team' | 'agency';
  referralSource?: string;

  // Metadata
  profileCompleted: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Creator type display labels
export const CREATOR_TYPE_LABELS: Record<CreatorType, string> = {
  musician: 'Musician / Artist',
  content_creator: 'Content Creator',
  brand_agency: 'Brand / Agency',
  sports_entertainment: 'Sports / Entertainment',
  venue_events: 'Venue / Events',
  other: 'Other',
};

// Experience level display labels
export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  new: 'New to this',
  some_experience: 'Some experience',
  professional: 'Professional',
};

// Creation goals display labels
export const CREATION_GOAL_LABELS: Record<CreationGoal, string> = {
  fan_experiences: 'Fan experiences',
  virtual_tours: 'Virtual tours',
  treasure_hunts: 'Treasure hunts',
  branded_content: 'Branded content',
  still_exploring: 'Still exploring',
};

// Footage status display labels
export const FOOTAGE_STATUS_LABELS: Record<FootageStatus, string> = {
  have_footage: 'Yes, I have footage',
  no_footage: 'No, not yet',
  need_guidance: 'I need guidance on capture',
};

// ===== Project Brief Types (for Spark AI) =====

export type ExperienceType =
  | 'treasure_hunt'
  | 'virtual_tour'
  | 'interactive_story'
  | 'competition'
  | 'brand_experience';

export type BriefStatus = 'draft' | 'in_progress' | 'approved' | 'archived';

export interface ProjectBrief {
  id: string;
  userId: string;

  // Basic info
  name: string;
  tagline?: string;
  experienceType?: ExperienceType;

  // Overview
  duration?: string; // e.g., "1-3 hours"
  difficulty?: 'easy' | 'medium' | 'hard' | 'progressive';
  playerMode?: 'single' | 'multiplayer' | 'competitive';

  // Story
  narrative?: string;

  // Gameplay
  gameplayPhases?: {
    phase: number;
    description: string;
  }[];

  // Venues
  venues?: {
    name: string;
    location?: string;
    difficulty?: string;
    content?: string;
  }[];

  // Interactive elements
  collectibles?: {
    type: string;
    count?: number;
    hidingSpots?: string;
  };

  // Win condition
  winCondition?: string;

  // Rewards
  rewards?: {
    completion?: string;
    grandPrize?: string;
    social?: string;
  };

  // Technical requirements
  technicalRequirements?: {
    videoCapture?: string;
    scenes?: number;
    customObjects?: string;
    integrations?: string[];
  };

  // Metadata
  status: BriefStatus;
  conversationId?: string; // Link to Spark chat
  createdAt: string;
  updatedAt: string;
}

