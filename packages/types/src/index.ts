/**
 * @gameview/types
 * Shared TypeScript types for the Game View platform
 */

// ===== Processing Types =====

export type ProcessingStage =
  | 'idle'
  | 'extracting_frames'
  | 'running_colmap'
  | 'running_brush'
  | 'exporting'
  | 'completed'
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
}

export interface ProductionSettings {
  preset: QualityPreset;
  customSettings?: CustomProcessingSettings;
  autoSync: boolean;
}

export interface CustomProcessingSettings {
  maxFrames?: number;
  colmapQuality?: 'low' | 'medium' | 'high' | 'extreme';
  brushIterations?: number;
}

export type ProductionStatus = 'draft' | 'processing' | 'completed' | 'failed';

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
