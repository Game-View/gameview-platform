import { db } from "@gameview/database";
import { clerkClient } from "@clerk/nextjs/server";
import type {
  CreatorType,
  ExperienceLevel,
  CreationGoal,
  FootageStatus,
} from "@gameview/types";

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  displayName?: string;
  creatorType?: CreatorType;
  experienceLevel?: ExperienceLevel;
  creationGoals?: CreationGoal[];
  footageStatus?: FootageStatus;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

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
}

// Get profile by Clerk ID
export async function getProfileByClerkId(
  clerkId: string
): Promise<UserProfile | null> {
  try {
    // Get user from database with Creator record
    const user = await db.user.findUnique({
      where: { clerkId },
      include: { creator: true },
    });

    if (!user) {
      return null;
    }

    // Try to get Clerk metadata, but don't fail if unavailable
    let metadata: Record<string, unknown> = {};
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);
      metadata = clerkUser.unsafeMetadata || {};
    } catch (clerkError) {
      console.warn("[Profile] Could not fetch Clerk metadata (non-blocking):", clerkError);
      // Continue without Clerk metadata - database data is still valid
    }

    // Profile is completed if user has CREATOR role and Creator record
    const hasCreatorRole = user.role === "CREATOR";
    const hasCreatorRecord = Boolean(user.creator);
    const profileCompleted = Boolean(metadata.profileCompleted) || (hasCreatorRole && hasCreatorRecord);

    // Safely convert dates (fallback to current time if somehow undefined)
    const now = new Date().toISOString();

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      displayName: user.displayName,
      creatorType: metadata.creatorType as CreatorType | undefined,
      experienceLevel: metadata.experienceLevel as ExperienceLevel | undefined,
      creationGoals: metadata.creationGoals as CreationGoal[] | undefined,
      footageStatus: metadata.footageStatus as FootageStatus | undefined,
      profileCompleted,
      createdAt: user.createdAt?.toISOString?.() || now,
      updatedAt: user.updatedAt?.toISOString?.() || now,
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}

// Generate a unique username from display name or email
async function generateUniqueUsername(baseUsername: string): Promise<string> {
  // Sanitize: lowercase, alphanumeric and underscores only
  let username = baseUsername
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 20);

  // Ensure minimum length
  if (username.length < 3) {
    username = "creator";
  }

  // Check if username exists, if so add random suffix
  let finalUsername = username;
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.creator.findUnique({
      where: { username: finalUsername },
    });
    if (!existing) break;

    // Add random suffix
    const suffix = Math.random().toString(36).slice(2, 6);
    finalUsername = `${username}_${suffix}`;
    attempts++;
  }

  return finalUsername;
}

// Create a new profile (saves onboarding data to Clerk metadata)
export async function createProfile(
  data: CreateProfileData
): Promise<UserProfile> {
  try {
    // Ensure user exists in database
    let user = await db.user.findUnique({
      where: { clerkId: data.clerkId },
      include: { creator: true },
    });

    if (!user) {
      // Create user if they don't exist
      user = await db.user.create({
        data: {
          clerkId: data.clerkId,
          email: data.email,
          displayName: data.displayName || "Creator",
          role: "CREATOR",
        },
        include: { creator: true },
      });
    } else {
      // Update user to CREATOR role
      user = await db.user.update({
        where: { clerkId: data.clerkId },
        data: {
          role: "CREATOR",
          displayName: data.displayName || user.displayName,
        },
        include: { creator: true },
      });
    }

    // Create Creator record if it doesn't exist
    // This is required for production creation and other creator features
    // If this fails, onboarding still completes - Creator will be created on first tRPC call
    if (!user.creator) {
      try {
        const displayName = data.displayName || "Creator";
        const usernameBase = data.email.split("@")[0] || displayName;
        const username = await generateUniqueUsername(usernameBase);

        await db.creator.create({
          data: {
            userId: user.id,
            username,
            displayName,
          },
        });
        console.log("[Profile] Created Creator record for user:", user.id);
      } catch (creatorError) {
        // Log but don't fail - Creator will be created via tRPC fallback
        console.error("[Profile] Failed to create Creator record (will retry later):", creatorError);
      }
    }

    // Save onboarding data to Clerk metadata
    // If this fails, profile is still created - user can still use the service
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(data.clerkId, {
        unsafeMetadata: {
          profileCompleted: true,
          creatorType: data.creatorType,
          experienceLevel: data.experienceLevel,
          creationGoals: data.creationGoals,
          footageStatus: data.footageStatus,
        },
      });
      console.log("[Profile] Updated Clerk metadata for user:", data.clerkId);
    } catch (clerkError) {
      // Log but don't fail - user can still use the service without Clerk metadata
      console.error("[Profile] Failed to update Clerk metadata (non-blocking):", clerkError);
    }

    // Safely convert dates (fallback to current time if somehow undefined)
    const now = new Date().toISOString();

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      displayName: user.displayName,
      creatorType: data.creatorType,
      experienceLevel: data.experienceLevel,
      creationGoals: data.creationGoals,
      footageStatus: data.footageStatus,
      profileCompleted: true,
      createdAt: user.createdAt?.toISOString?.() || now,
      updatedAt: user.updatedAt?.toISOString?.() || now,
    };
  } catch (error) {
    console.error("Error creating profile:", error);
    throw error;
  }
}

// Update an existing profile
export async function updateProfile(
  clerkId: string,
  data: UpdateProfileData
): Promise<UserProfile> {
  try {
    // Update user in database if displayName changed
    if (data.displayName) {
      await db.user.update({
        where: { clerkId },
        data: { displayName: data.displayName },
      });
    }

    // Get current metadata
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const currentMetadata = clerkUser.unsafeMetadata || {};

    // Update Clerk metadata
    await client.users.updateUserMetadata(clerkId, {
      unsafeMetadata: {
        ...currentMetadata,
        ...(data.creatorType && { creatorType: data.creatorType }),
        ...(data.experienceLevel && { experienceLevel: data.experienceLevel }),
        ...(data.creationGoals && { creationGoals: data.creationGoals }),
        ...(data.footageStatus && { footageStatus: data.footageStatus }),
      },
    });

    // Return updated profile
    return (await getProfileByClerkId(clerkId))!;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// Check if profile exists and is completed
export async function isProfileCompleted(clerkId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    return Boolean(clerkUser.unsafeMetadata?.profileCompleted);
  } catch (error) {
    console.error("Error checking profile completion:", error);
    return false;
  }
}
