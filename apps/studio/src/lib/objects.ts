import { createClient } from "@supabase/supabase-js";

// Object categories matching the database enum
export type ObjectCategory =
  | "collectibles"
  | "furniture"
  | "props"
  | "interactive"
  | "decorations"
  | "audio"
  | "effects"
  | "characters"
  | "vehicles"
  | "nature";

// Object source - pre-loaded or user-uploaded
export type ObjectSource = "preloaded" | "uploaded";

// Interaction types for game objects
export type InteractionType =
  | "collectible"
  | "trigger"
  | "physics"
  | "animation"
  | "audio"
  | "teleport"
  | "door"
  | "switch"
  | "pickup"
  | "checkpoint"
  | "spawn"
  | "none";

// 3D transform for placed objects
export interface ObjectTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// Object metadata (physics, audio, etc.)
export interface ObjectMetadata {
  hasPhysics?: boolean;
  mass?: number;
  isStatic?: boolean;
  audioUrl?: string;
  audioVolume?: number;
  audioLoop?: boolean;
  triggerRadius?: number;
  animationUrl?: string;
  customProperties?: Record<string, unknown>;
}

// Stored object from database
export interface StoredObject {
  id: string;
  name: string;
  description: string | null;
  category: ObjectCategory;
  source: ObjectSource;
  modelUrl: string;
  thumbnailUrl: string | null;
  previewGif: string | null;
  interactionType: InteractionType | null;
  defaultTransform: ObjectTransform;
  metadata: ObjectMetadata;
  tags: string[];
  userId: string | null;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Import interaction types
import type { Interaction } from "./interactions";

// Placed object instance in a scene
export interface PlacedObject {
  instanceId: string;
  objectId: string;
  name: string;
  modelUrl: string;
  transform: ObjectTransform;
  interactionType: InteractionType | null;
  metadata: ObjectMetadata;
  interactions?: Interaction[];
}

// Input for creating a new object
export interface CreateObjectInput {
  name: string;
  description?: string;
  category: ObjectCategory;
  modelUrl: string;
  thumbnailUrl?: string;
  previewGif?: string;
  interactionType?: InteractionType;
  defaultTransform?: ObjectTransform;
  metadata?: ObjectMetadata;
  tags?: string[];
  isPublic?: boolean;
}

// Input for updating an object
export interface UpdateObjectInput {
  name?: string;
  description?: string;
  category?: ObjectCategory;
  thumbnailUrl?: string;
  previewGif?: string;
  interactionType?: InteractionType;
  defaultTransform?: ObjectTransform;
  metadata?: ObjectMetadata;
  tags?: string[];
  isPublic?: boolean;
}

// Filter options for listing objects
export interface ObjectFilters {
  category?: ObjectCategory;
  source?: ObjectSource;
  interactionType?: InteractionType;
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  userId?: string;
  limit?: number;
  offset?: number;
}

// Helper to create Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Default transform for new objects
const defaultObjectTransform: ObjectTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * Get all objects with optional filters
 */
export async function getObjects(filters: ObjectFilters = {}): Promise<StoredObject[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("objects")
    .select("*")
    .order("usageCount", { ascending: false })
    .order("name", { ascending: true });

  // Apply filters
  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.interactionType) {
    query = query.eq("interactionType", filters.interactionType);
  }

  if (filters.isPublic !== undefined) {
    query = query.eq("isPublic", filters.isPublic);
  }

  if (filters.userId) {
    query = query.eq("userId", filters.userId);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to get objects:", error);
    throw new Error("Failed to get objects");
  }

  return (data || []).map(mapDbToObject);
}

/**
 * Get a single object by ID
 */
export async function getObjectById(id: string): Promise<StoredObject | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("objects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Failed to get object:", error);
    throw new Error("Failed to get object");
  }

  return mapDbToObject(data);
}

/**
 * Get objects by category
 */
export async function getObjectsByCategory(category: ObjectCategory): Promise<StoredObject[]> {
  return getObjects({ category });
}

/**
 * Get preloaded (starter) objects
 */
export async function getPreloadedObjects(): Promise<StoredObject[]> {
  return getObjects({ source: "preloaded" });
}

/**
 * Get user's uploaded objects
 */
export async function getUserObjects(userId: string): Promise<StoredObject[]> {
  return getObjects({ userId, source: "uploaded" });
}

/**
 * Search objects by name or description
 */
export async function searchObjects(query: string, filters: ObjectFilters = {}): Promise<StoredObject[]> {
  return getObjects({ ...filters, search: query });
}

/**
 * Create a new object (user upload)
 */
export async function createObject(
  input: CreateObjectInput,
  userId: string
): Promise<StoredObject> {
  const supabase = getSupabaseClient();

  const now = new Date().toISOString();

  const objectData = {
    name: input.name,
    description: input.description || null,
    category: input.category,
    source: "uploaded" as ObjectSource,
    modelUrl: input.modelUrl,
    thumbnailUrl: input.thumbnailUrl || null,
    previewGif: input.previewGif || null,
    interactionType: input.interactionType || null,
    defaultTransform: input.defaultTransform || defaultObjectTransform,
    metadata: input.metadata || {},
    tags: input.tags || [],
    userId,
    isPublic: input.isPublic ?? false,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const { data, error } = await supabase
    .from("objects")
    .insert(objectData)
    .select()
    .single();

  if (error) {
    console.error("Failed to create object:", error);
    throw new Error("Failed to create object");
  }

  return mapDbToObject(data);
}

/**
 * Update an object
 */
export async function updateObject(
  id: string,
  userId: string,
  input: UpdateObjectInput
): Promise<StoredObject> {
  const supabase = getSupabaseClient();

  // First check ownership (unless it's a preloaded object being updated by admin)
  const existing = await getObjectById(id);
  if (!existing) {
    throw new Error("Object not found");
  }

  if (existing.source === "uploaded" && existing.userId !== userId) {
    throw new Error("Not authorized to update this object");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl;
  if (input.previewGif !== undefined) updateData.previewGif = input.previewGif;
  if (input.interactionType !== undefined) updateData.interactionType = input.interactionType;
  if (input.defaultTransform !== undefined) updateData.defaultTransform = input.defaultTransform;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

  const { data, error } = await supabase
    .from("objects")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update object:", error);
    throw new Error("Failed to update object");
  }

  return mapDbToObject(data);
}

/**
 * Delete an object
 */
export async function deleteObject(id: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Check ownership
  const existing = await getObjectById(id);
  if (!existing) {
    throw new Error("Object not found");
  }

  if (existing.source === "preloaded") {
    throw new Error("Cannot delete preloaded objects");
  }

  if (existing.userId !== userId) {
    throw new Error("Not authorized to delete this object");
  }

  const { error } = await supabase
    .from("objects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete object:", error);
    throw new Error("Failed to delete object");
  }
}

/**
 * Increment usage count when object is placed in a scene
 */
export async function incrementUsageCount(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.rpc("increment_object_usage", { object_id: id });

  if (error) {
    // Fallback if RPC doesn't exist
    const { error: updateError } = await supabase
      .from("objects")
      .update({ usageCount: supabase.rpc("increment", { x: 1 }) })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to increment usage count:", updateError);
    }
  }
}

/**
 * Get all available categories with counts
 */
export async function getCategoryCounts(): Promise<Record<ObjectCategory, number>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("objects")
    .select("category");

  if (error) {
    console.error("Failed to get category counts:", error);
    throw new Error("Failed to get category counts");
  }

  const counts: Record<ObjectCategory, number> = {
    collectibles: 0,
    furniture: 0,
    props: 0,
    interactive: 0,
    decorations: 0,
    audio: 0,
    effects: 0,
    characters: 0,
    vehicles: 0,
    nature: 0,
  };

  for (const row of data || []) {
    const category = row.category as ObjectCategory;
    if (category in counts) {
      counts[category]++;
    }
  }

  return counts;
}

/**
 * Map database row to StoredObject
 */
function mapDbToObject(row: Record<string, unknown>): StoredObject {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as ObjectCategory,
    source: row.source as ObjectSource,
    modelUrl: row.modelUrl as string,
    thumbnailUrl: row.thumbnailUrl as string | null,
    previewGif: row.previewGif as string | null,
    interactionType: row.interactionType as InteractionType | null,
    defaultTransform: (row.defaultTransform as ObjectTransform) || defaultObjectTransform,
    metadata: (row.metadata as ObjectMetadata) || {},
    tags: (row.tags as string[]) || [],
    userId: row.userId as string | null,
    isPublic: row.isPublic as boolean,
    usageCount: row.usageCount as number,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

/**
 * Create a placed object instance from an object
 */
export function createPlacedObject(
  object: StoredObject,
  transform?: Partial<ObjectTransform>
): PlacedObject {
  const instanceId = crypto.randomUUID();

  return {
    instanceId,
    objectId: object.id,
    name: object.name,
    modelUrl: object.modelUrl,
    transform: {
      position: transform?.position || { ...object.defaultTransform.position },
      rotation: transform?.rotation || { ...object.defaultTransform.rotation },
      scale: transform?.scale || { ...object.defaultTransform.scale },
    },
    interactionType: object.interactionType,
    metadata: { ...object.metadata },
  };
}
