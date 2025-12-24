import { createServerClient } from "./supabase";
import type {
  UserProfile,
  CreatorType,
  ExperienceLevel,
  CreationGoal,
  FootageStatus,
} from "@gameview/types";

export interface CreateProfileData {
  clerkId: string;
  email: string;
  displayName?: string;
  creatorType: CreatorType;
  experienceLevel: ExperienceLevel;
  creationGoals: CreationGoal[];
  footageStatus: FootageStatus;
}

export interface UpdateProfileData {
  displayName?: string;
  creatorType?: CreatorType;
  experienceLevel?: ExperienceLevel;
  creationGoals?: CreationGoal[];
  footageStatus?: FootageStatus;
  socialLinks?: UserProfile["socialLinks"];
  teamSize?: UserProfile["teamSize"];
  referralSource?: string;
}

// Get profile by Clerk ID
export async function getProfileByClerkId(
  clerkId: string
): Promise<UserProfile | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerkId", clerkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Error fetching profile:", error);
    throw error;
  }

  return data;
}

// Create a new profile
export async function createProfile(
  data: CreateProfileData
): Promise<UserProfile> {
  const supabase = createServerClient();

  const now = new Date().toISOString();

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      clerkId: data.clerkId,
      email: data.email,
      displayName: data.displayName,
      creatorType: data.creatorType,
      experienceLevel: data.experienceLevel,
      creationGoals: data.creationGoals,
      footageStatus: data.footageStatus,
      profileCompleted: true,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    throw error;
  }

  return profile;
}

// Update an existing profile
export async function updateProfile(
  clerkId: string,
  data: UpdateProfileData
): Promise<UserProfile> {
  const supabase = createServerClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .eq("clerkId", clerkId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return profile;
}

// Check if profile exists and is completed
export async function isProfileCompleted(clerkId: string): Promise<boolean> {
  const profile = await getProfileByClerkId(clerkId);
  return profile?.profileCompleted ?? false;
}
