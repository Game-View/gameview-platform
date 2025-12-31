import { auth } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import {
  getProfileByClerkId,
  createProfile,
  updateProfile,
  type CreateProfileData,
  type UpdateProfileData,
} from "@/lib/profile";

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileByClerkId(userId);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/profile - Create a new profile
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields: (keyof CreateProfileData)[] = [
      "email",
      "creatorType",
      "experienceLevel",
      "creationGoals",
      "footageStatus",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if profile already exists
    const existingProfile = await getProfileByClerkId(userId);
    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists" },
        { status: 409 }
      );
    }

    const profile = await createProfile({
      clerkId: userId,
      email: body.email,
      displayName: body.displayName,
      creatorType: body.creatorType,
      experienceLevel: body.experienceLevel,
      creationGoals: body.creationGoals,
      footageStatus: body.footageStatus,
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/profile:", error);
    // Return more detailed error in development/preview
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
        // Include stack trace for debugging (remove in production)
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateProfileData = await request.json();

    // Check if profile exists
    const existingProfile = await getProfileByClerkId(userId);
    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const profile = await updateProfile(userId, body);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error in PATCH /api/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
