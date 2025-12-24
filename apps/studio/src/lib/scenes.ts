import { createServerClient } from "./supabase";

// Processing status enum matching database
export type ProcessingStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "frame_extraction"
  | "colmap"
  | "brush"
  | "metadata"
  | "completed"
  | "failed";

export interface VideoFile {
  filename: string;
  url: string;
  size: number;
  duration?: number;
  uploadedAt: string;
}

export interface CameraPosition {
  x: number;
  y: number;
  z: number;
}

export interface PlacedObject {
  id: string;
  objectId: string;
  name: string;
  position: CameraPosition;
  rotation: CameraPosition;
  scale: CameraPosition;
  interactions?: Interaction[];
}

export interface Interaction {
  id: string;
  trigger: "proximity" | "click" | "collision" | "collect" | "conditional";
  action: "play_sound" | "show_message" | "add_inventory" | "increment_score" | "unlock" | "show_hide" | "teleport" | "animate";
  params: Record<string, unknown>;
}

export interface StoredScene {
  id: string;
  briefId: string;
  userId: string;
  name: string;
  description: string | null;
  orderIndex: number;
  videoFiles: VideoFile[];
  totalVideoSize: number;
  processingStatus: ProcessingStatus;
  processingProgress: number;
  processingMessage: string | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  processingError: string | null;
  splatUrl: string | null;
  thumbnailUrl: string | null;
  metadataUrl: string | null;
  outputSize: number | null;
  cameraPosition: CameraPosition | null;
  cameraTarget: CameraPosition | null;
  lightingPreset: string;
  placedObjects: PlacedObject[];
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSceneInput {
  briefId: string;
  userId: string;
  name: string;
  description?: string;
  orderIndex?: number;
}

export interface UpdateSceneInput {
  name?: string;
  description?: string;
  orderIndex?: number;
  videoFiles?: VideoFile[];
  totalVideoSize?: number;
  processingStatus?: ProcessingStatus;
  processingProgress?: number;
  processingMessage?: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  processingError?: string;
  splatUrl?: string;
  thumbnailUrl?: string;
  metadataUrl?: string;
  outputSize?: number;
  cameraPosition?: CameraPosition;
  cameraTarget?: CameraPosition;
  lightingPreset?: string;
  placedObjects?: PlacedObject[];
  interactions?: Interaction[];
}

// Create a new scene
export async function createScene(input: CreateSceneInput): Promise<StoredScene> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("scenes")
    .insert({
      briefId: input.briefId,
      userId: input.userId,
      name: input.name,
      description: input.description || null,
      orderIndex: input.orderIndex || 0,
      videoFiles: [],
      totalVideoSize: 0,
      processingStatus: "pending",
      processingProgress: 0,
      placedObjects: [],
      interactions: [],
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create scene:", error);
    throw new Error("Failed to create scene");
  }

  return data as StoredScene;
}

// Get a scene by ID
export async function getSceneById(id: string, userId: string): Promise<StoredScene | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Failed to get scene:", error);
    throw new Error("Failed to get scene");
  }

  return data as StoredScene;
}

// Get all scenes for a brief
export async function getScenesByBrief(briefId: string, userId: string): Promise<StoredScene[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("briefId", briefId)
    .eq("userId", userId)
    .order("orderIndex", { ascending: true });

  if (error) {
    console.error("Failed to get scenes:", error);
    throw new Error("Failed to get scenes");
  }

  return (data || []) as StoredScene[];
}

// Get all scenes for a user
export async function getScenesByUser(userId: string): Promise<StoredScene[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Failed to get scenes:", error);
    throw new Error("Failed to get scenes");
  }

  return (data || []) as StoredScene[];
}

// Update a scene
export async function updateScene(
  id: string,
  userId: string,
  input: UpdateSceneInput
): Promise<StoredScene> {
  const supabase = createServerClient();

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.orderIndex !== undefined) updates.orderIndex = input.orderIndex;
  if (input.videoFiles !== undefined) updates.videoFiles = input.videoFiles;
  if (input.totalVideoSize !== undefined) updates.totalVideoSize = input.totalVideoSize;
  if (input.processingStatus !== undefined) updates.processingStatus = input.processingStatus;
  if (input.processingProgress !== undefined) updates.processingProgress = input.processingProgress;
  if (input.processingMessage !== undefined) updates.processingMessage = input.processingMessage;
  if (input.processingStartedAt !== undefined) updates.processingStartedAt = input.processingStartedAt;
  if (input.processingCompletedAt !== undefined) updates.processingCompletedAt = input.processingCompletedAt;
  if (input.processingError !== undefined) updates.processingError = input.processingError;
  if (input.splatUrl !== undefined) updates.splatUrl = input.splatUrl;
  if (input.thumbnailUrl !== undefined) updates.thumbnailUrl = input.thumbnailUrl;
  if (input.metadataUrl !== undefined) updates.metadataUrl = input.metadataUrl;
  if (input.outputSize !== undefined) updates.outputSize = input.outputSize;
  if (input.cameraPosition !== undefined) updates.cameraPosition = input.cameraPosition;
  if (input.cameraTarget !== undefined) updates.cameraTarget = input.cameraTarget;
  if (input.lightingPreset !== undefined) updates.lightingPreset = input.lightingPreset;
  if (input.placedObjects !== undefined) updates.placedObjects = input.placedObjects;
  if (input.interactions !== undefined) updates.interactions = input.interactions;

  const { data, error } = await supabase
    .from("scenes")
    .update(updates)
    .eq("id", id)
    .eq("userId", userId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update scene:", error);
    throw new Error("Failed to update scene");
  }

  return data as StoredScene;
}

// Delete a scene
export async function deleteScene(id: string, userId: string): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("scenes")
    .delete()
    .eq("id", id)
    .eq("userId", userId);

  if (error) {
    console.error("Failed to delete scene:", error);
    throw new Error("Failed to delete scene");
  }
}

// Add video files to a scene
export async function addVideoToScene(
  id: string,
  userId: string,
  videoFile: VideoFile
): Promise<StoredScene> {
  // Get current scene
  const scene = await getSceneById(id, userId);
  if (!scene) {
    throw new Error("Scene not found");
  }

  const updatedVideos = [...scene.videoFiles, videoFile];
  const totalSize = updatedVideos.reduce((sum, v) => sum + v.size, 0);

  return updateScene(id, userId, {
    videoFiles: updatedVideos,
    totalVideoSize: totalSize,
  });
}

// Update processing status
export async function updateProcessingStatus(
  id: string,
  userId: string,
  status: ProcessingStatus,
  progress: number,
  message?: string,
  error?: string
): Promise<StoredScene> {
  const updates: UpdateSceneInput = {
    processingStatus: status,
    processingProgress: progress,
    processingMessage: message,
  };

  if (status === "processing" || status === "frame_extraction") {
    updates.processingStartedAt = new Date().toISOString();
  }

  if (status === "completed") {
    updates.processingCompletedAt = new Date().toISOString();
  }

  if (status === "failed" && error) {
    updates.processingError = error;
  }

  return updateScene(id, userId, updates);
}

// Get processing progress label
export function getProcessingLabel(status: ProcessingStatus): string {
  const labels: Record<ProcessingStatus, string> = {
    pending: "Waiting to process",
    uploading: "Uploading videos",
    processing: "Initializing",
    frame_extraction: "Extracting frames",
    colmap: "Building 3D structure",
    brush: "Training Gaussian Splat",
    metadata: "Generating preview",
    completed: "Ready",
    failed: "Processing failed",
  };
  return labels[status];
}

// Estimate time remaining based on status and progress
export function estimateTimeRemaining(
  status: ProcessingStatus,
  progress: number,
  startedAt: string | null
): string | null {
  if (!startedAt || status === "pending" || status === "completed" || status === "failed") {
    return null;
  }

  // Rough estimates per stage (in minutes)
  const stageEstimates: Record<ProcessingStatus, number> = {
    pending: 0,
    uploading: 2,
    processing: 1,
    frame_extraction: 5,
    colmap: 30,
    brush: 60,
    metadata: 2,
    completed: 0,
    failed: 0,
  };

  const totalEstimate = Object.values(stageEstimates).reduce((a, b) => a + b, 0);
  const remainingMinutes = Math.round(totalEstimate * (1 - progress / 100));

  if (remainingMinutes < 1) return "Less than a minute";
  if (remainingMinutes < 60) return `~${remainingMinutes} minutes`;
  const hours = Math.round(remainingMinutes / 60);
  return `~${hours} hour${hours > 1 ? "s" : ""}`;
}
