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
    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return null;
    }

    // Get Clerk user to check metadata
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const metadata = clerkUser.unsafeMetadata || {};

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      displayName: user.displayName,
      creatorType: metadata.creatorType as CreatorType | undefined,
      experienceLevel: metadata.experienceLevel as ExperienceLevel | undefined,
      creationGoals: metadata.creationGoals as CreationGoal[] | undefined,
      footageStatus: metadata.footageStatus as FootageStatus | undefined,
      profileCompleted: Boolean(metadata.profileCompleted),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}

// Create a new profile (saves onboarding data to Clerk metadata)
export async function createProfile(
  data: CreateProfileData
): Promise<UserProfile> {
  try {
    // Ensure user exists in database
    let user = await db.user.findUnique({
      where: { clerkId: data.clerkId },
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
      });
    } else {
      // Update user to CREATOR role
      user = await db.user.update({
        where: { clerkId: data.clerkId },
        data: {
          role: "CREATOR",
          displayName: data.displayName || user.displayName,
        },
      });
    }

    // Save onboarding data to Clerk metadata
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
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
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
