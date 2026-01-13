import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@gameview/database";

/**
 * Create an experience from already-uploaded files
 * POST /api/import/create
 * Body: { title, plyUrl, camerasJson? }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, plyUrl, camerasJson } = body;

    if (!plyUrl) {
      return NextResponse.json({ error: "PLY URL is required" }, { status: 400 });
    }

    // Get or create the user
    let user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: "Could not get user info" }, { status: 401 });
      }

      user = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@temp.local`,
          displayName: clerkUser.firstName || "User",
        },
      });
    }

    // Get or create Creator
    let creator = await db.creator.findUnique({
      where: { userId: user.id },
    });

    if (!creator) {
      creator = await db.creator.create({
        data: {
          userId: user.id,
          username: `creator_${user.id.slice(-8)}`,
          displayName: user.displayName,
        },
      });
    }

    // Create Experience record
    const experience = await db.experience.create({
      data: {
        title: title || "Imported Experience",
        description: "Imported from GameViewer Desktop",
        status: "PUBLISHED",
        plyUrl,
        camerasJson: camerasJson || null,
        thumbnailUrl: null,
        creatorId: creator.id,
        category: "ENTERTAINMENT",
        subcategory: "General",
        tags: ["imported", "desktop"],
        duration: 0,
      },
    });

    console.log(`[Import] Created experience ${experience.id} from direct upload`);

    return NextResponse.json({
      success: true,
      experienceId: experience.id,
      plyUrl,
      camerasJson,
      viewerUrl: `/viewer/${experience.id}`,
      playerUrl: `https://gvdw-player.vercel.app/experience/${experience.id}/play`,
    });

  } catch (error) {
    console.error("Import create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create experience" },
      { status: 500 }
    );
  }
}
