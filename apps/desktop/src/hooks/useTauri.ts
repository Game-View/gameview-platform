/**
 * Tauri API wrapper hooks
 * Provides React hooks for interacting with Tauri backend commands
 */

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';
import type { ProcessingProgress, AppSettings, QualityPreset } from '@gameview/types';

// ===== File Dialogs =====

/**
 * Open file dialog to pick video files
 */
export async function pickVideos(): Promise<string[]> {
  const selected = await open({
    multiple: true,
    filters: [
      {
        name: 'Video Files',
        extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mts', 'm2ts'],
      },
    ],
    title: 'Select Video Files',
  });

  if (!selected) return [];
  return Array.isArray(selected) ? selected : [selected];
}

/**
 * Open directory dialog to pick output folder
 */
export async function pickOutputDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select Output Directory',
  });

  return selected as string | null;
}

// ===== Settings =====

interface UseSettingsResult {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing app settings
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<AppSettings>('get_settings');
      setSettings(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    try {
      await invoke('save_settings', { settings: newSettings });
      setSettings(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}

// ===== Processing =====

interface ProcessArgs {
  videos: string[];
  outputDir: string;
  preset: QualityPreset;
  colmapPath?: string;
  brushPath?: string;
}

interface UseProcessingResult {
  isProcessing: boolean;
  progress: ProcessingProgress;
  error: string | null;
  startProcessing: (args: ProcessArgs) => Promise<string>;
  cancelProcessing: () => Promise<void>;
}

/**
 * Hook for managing video processing
 */
export function useProcessing(): UseProcessingResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'idle',
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Listen for progress events from Rust backend
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<ProcessingProgress>('processing-progress', (event) => {
        setProgress(event.payload);

        if (event.payload.stage === 'completed') {
          setIsProcessing(false);
        } else if (event.payload.stage === 'failed') {
          setIsProcessing(false);
          setError(event.payload.message || 'Processing failed');
        }
      });
    };

    setupListener();

    return () => {
      unlisten?.();
    };
  }, []);

  const startProcessing = useCallback(async (args: ProcessArgs): Promise<string> => {
    setIsProcessing(true);
    setError(null);
    setProgress({ stage: 'extracting_frames', progress: 0 });

    try {
      const result = await invoke<string>('process_videos', { args });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsProcessing(false);
      setProgress({ stage: 'failed', progress: 0, message: errorMessage });
      throw err;
    }
  }, []);

  const cancelProcessing = useCallback(async () => {
    try {
      await invoke('cancel_processing');
      setIsProcessing(false);
      setProgress({ stage: 'idle', progress: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  return {
    isProcessing,
    progress,
    error,
    startProcessing,
    cancelProcessing,
  };
}

// ===== CLI Path =====

/**
 * Get the path to the bundled gvcore-cli executable
 */
export async function getCliPath(): Promise<string> {
  return invoke<string>('get_cli_path');
}

// ===== Video Metadata =====

export interface VideoMetadata {
  path: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
}

/**
 * Get metadata for a video file (placeholder - would need ffprobe)
 */
export async function getVideoMetadata(path: string): Promise<VideoMetadata> {
  // In a real implementation, this would call a Tauri command that runs ffprobe
  // For now, return placeholder data
  const name = path.split(/[/\\]/).pop() || 'Unknown';
  return {
    path,
    name,
    duration: 0,
    width: 1920,
    height: 1080,
    fps: 30,
  };
}
