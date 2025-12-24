import { createServerClient } from "./supabase";
import type { ExtractedBrief } from "@/app/api/brief/extract/route";

export interface StoredBrief {
  id: string;
  userId: string;
  name: string | null;
  tagline: string | null;
  experienceType: string | null;
  concept: string | null;
  targetAudience: string | null;
  duration: string | null;
  difficulty: string | null;
  playerMode: string | null;
  setting: string | null;
  narrative: string | null;
  interactiveElements: string[];
  collectibles: string | null;
  winCondition: string | null;
  contentStatus: string | null;
  contentDescription: string | null;
  estimatedScenes: number | null;
  completeness: number;
  missingElements: string[];
  conversationHistory: { role: string; content: string; timestamp: string }[];
  status: "draft" | "in_progress" | "ready" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface CreateBriefInput {
  userId: string;
  brief: ExtractedBrief;
  conversationHistory: { role: string; content: string }[];
}

export interface UpdateBriefInput {
  brief?: Partial<ExtractedBrief>;
  conversationHistory?: { role: string; content: string }[];
  status?: StoredBrief["status"];
}

// Create a new brief
export async function createBrief(input: CreateBriefInput): Promise<StoredBrief> {
  const supabase = createServerClient();
  const { userId, brief, conversationHistory } = input;

  const { data, error } = await supabase
    .from("briefs")
    .insert({
      userId,
      name: brief.name,
      tagline: brief.tagline,
      experienceType: brief.experienceType,
      concept: brief.concept,
      targetAudience: brief.targetAudience,
      duration: brief.duration,
      difficulty: brief.difficulty,
      playerMode: brief.playerMode,
      setting: brief.setting,
      narrative: brief.narrative,
      interactiveElements: brief.interactiveElements,
      collectibles: brief.collectibles,
      winCondition: brief.winCondition,
      contentStatus: brief.contentStatus,
      contentDescription: brief.contentDescription,
      estimatedScenes: brief.estimatedScenes,
      completeness: brief.completeness,
      missingElements: brief.missingElements,
      conversationHistory: conversationHistory.map((msg) => ({
        ...msg,
        timestamp: new Date().toISOString(),
      })),
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create brief:", error);
    throw new Error("Failed to create brief");
  }

  return data as StoredBrief;
}

// Get a brief by ID
export async function getBriefById(id: string, userId: string): Promise<StoredBrief | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("briefs")
    .select("*")
    .eq("id", id)
    .eq("userId", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Failed to get brief:", error);
    throw new Error("Failed to get brief");
  }

  return data as StoredBrief;
}

// Get all briefs for a user
export async function getBriefsByUser(userId: string): Promise<StoredBrief[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("briefs")
    .select("*")
    .eq("userId", userId)
    .neq("status", "archived")
    .order("updatedAt", { ascending: false });

  if (error) {
    console.error("Failed to get briefs:", error);
    throw new Error("Failed to get briefs");
  }

  return (data || []) as StoredBrief[];
}

// Update a brief
export async function updateBrief(
  id: string,
  userId: string,
  input: UpdateBriefInput
): Promise<StoredBrief> {
  const supabase = createServerClient();

  const updates: Record<string, unknown> = {};

  if (input.brief) {
    const b = input.brief;
    if (b.name !== undefined) updates.name = b.name;
    if (b.tagline !== undefined) updates.tagline = b.tagline;
    if (b.experienceType !== undefined) updates.experienceType = b.experienceType;
    if (b.concept !== undefined) updates.concept = b.concept;
    if (b.targetAudience !== undefined) updates.targetAudience = b.targetAudience;
    if (b.duration !== undefined) updates.duration = b.duration;
    if (b.difficulty !== undefined) updates.difficulty = b.difficulty;
    if (b.playerMode !== undefined) updates.playerMode = b.playerMode;
    if (b.setting !== undefined) updates.setting = b.setting;
    if (b.narrative !== undefined) updates.narrative = b.narrative;
    if (b.interactiveElements !== undefined) updates.interactiveElements = b.interactiveElements;
    if (b.collectibles !== undefined) updates.collectibles = b.collectibles;
    if (b.winCondition !== undefined) updates.winCondition = b.winCondition;
    if (b.contentStatus !== undefined) updates.contentStatus = b.contentStatus;
    if (b.contentDescription !== undefined) updates.contentDescription = b.contentDescription;
    if (b.estimatedScenes !== undefined) updates.estimatedScenes = b.estimatedScenes;
    if (b.completeness !== undefined) updates.completeness = b.completeness;
    if (b.missingElements !== undefined) updates.missingElements = b.missingElements;
  }

  if (input.conversationHistory) {
    updates.conversationHistory = input.conversationHistory.map((msg) => ({
      ...msg,
      timestamp: new Date().toISOString(),
    }));
  }

  if (input.status) {
    updates.status = input.status;
  }

  const { data, error } = await supabase
    .from("briefs")
    .update(updates)
    .eq("id", id)
    .eq("userId", userId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update brief:", error);
    throw new Error("Failed to update brief");
  }

  return data as StoredBrief;
}

// Delete (archive) a brief
export async function archiveBrief(id: string, userId: string): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("briefs")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("userId", userId);

  if (error) {
    console.error("Failed to archive brief:", error);
    throw new Error("Failed to archive brief");
  }
}
