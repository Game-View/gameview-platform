import { auth } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { db } from "@gameview/database";
import { getBriefById } from "@/lib/briefs";
import { getScenesByBrief } from "@/lib/scenes";
import { getProfileByClerkId } from "@/lib/profile";
import { defaultGameConfig, type GameConfig } from "@/lib/game-logic";

/**
 * POST /api/publish - Publish a brief as a playable experience
 *
 * Creates or updates an Experience in the Prisma database from the Brief + completed Scenes
 * Includes full scene data (placedObjects, interactions) and game config for interactive playback
 * Returns the experience ID and shareable URL
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { briefId } = body;

    if (!briefId) {
      return NextResponse.json(
        { error: "briefId is required" },
        { status: 400 }
      );
    }

    // Get the brief
    const brief = await getBriefById(briefId, userId);
    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    // Get all scenes for this brief
    const scenes = await getScenesByBrief(briefId, userId);

    // Check if at least one scene is completed
    const completedScenes = scenes.filter(s => s.processingStatus === "completed");
    if (completedScenes.length === 0) {
      return NextResponse.json(
        { error: "No completed scenes. Please wait for at least one scene to finish processing." },
        { status: 400 }
      );
    }

    // Get or create Creator record
    let creator = await db.creator.findFirst({
      where: {
        user: { clerkId: userId }
      }
    });

    if (!creator) {
      // Get user profile to create Creator
      const profile = await getProfileByClerkId(userId);
      if (!profile) {
        return NextResponse.json(
          { error: "Profile not found. Please complete onboarding." },
          { status: 400 }
        );
      }

      // Get or create User in Prisma
      let user = await db.user.findUnique({
        where: { clerkId: userId }
      });

      if (!user) {
        user = await db.user.create({
          data: {
            clerkId: userId,
            email: profile.email,
            displayName: profile.displayName || "Creator",
            role: "CREATOR",
          }
        });
      }

      // Create Creator
      const username = profile.email.split("@")[0]?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "creator";
      creator = await db.creator.create({
        data: {
          userId: user.id,
          username: username + "_" + Date.now().toString(36),
          displayName: profile.displayName || "Creator",
        }
      });
    }

    // Use first completed scene for the experience data
    const primaryScene = completedScenes[0];

    // Map experience type to Category
    let category: "ENTERTAINMENT" | "EDUCATION" | "EXPLORATION" = "ENTERTAINMENT";
    if (brief.experienceType?.toLowerCase().includes("education")) {
      category = "EDUCATION";
    } else if (brief.experienceType?.toLowerCase().includes("explor")) {
      category = "EXPLORATION";
    }

    // Parse duration from brief (e.g., "5-10 minutes" -> 300 seconds)
    let duration = 300; // Default 5 minutes
    if (brief.duration) {
      const match = brief.duration.match(/(\d+)/);
      if (match) {
        duration = parseInt(match[1]) * 60;
      }
    }

    // Build scenes data for interactive playback (Sprint 18)
    const scenesData = completedScenes.map(scene => ({
      id: scene.id,
      name: scene.name,
      splatUrl: scene.splatUrl,
      thumbnailUrl: scene.thumbnailUrl,
      placedObjects: scene.placedObjects || [],
      interactions: scene.interactions || [],
      cameraPosition: scene.cameraPosition,
      cameraTarget: scene.cameraTarget,
      audioConfig: scene.audioConfig,
    }));

    // Get game config from brief or use defaults
    const gameConfig: GameConfig = brief.gameConfig || defaultGameConfig;

    // Check if experience already exists for this brief
    const existingExperience = await db.experience.findFirst({
      where: {
        briefId: briefId,
      }
    });

    let experience;
    if (existingExperience) {
      // Update existing experience
      experience = await db.experience.update({
        where: { id: existingExperience.id },
        data: {
          title: brief.name || "Untitled Experience",
          description: brief.tagline || brief.concept || "An immersive experience",
          thumbnailUrl: primaryScene.thumbnailUrl,
          plyUrl: primaryScene.splatUrl,
          category,
          subcategory: brief.experienceType || "Interactive",
          tags: brief.interactiveElements || [],
          duration,
          status: "PUBLISHED",
          publishedAt: new Date(),
          // Include game data for interactive playback
          scenesData: scenesData,
          gameConfig: gameConfig,
        }
      });
    } else {
      // Create new experience
      experience = await db.experience.create({
        data: {
          creatorId: creator.id,
          title: brief.name || "Untitled Experience",
          description: brief.tagline || brief.concept || "An immersive experience",
          thumbnailUrl: primaryScene.thumbnailUrl,
          plyUrl: primaryScene.splatUrl,
          category,
          subcategory: brief.experienceType || "Interactive",
          tags: brief.interactiveElements || [],
          duration,
          price: 0, // Free for beta
          status: "PUBLISHED",
          publishedAt: new Date(),
          briefId: briefId,
          // Include game data for interactive playback
          scenesData: scenesData,
          gameConfig: gameConfig,
        }
      });
    }

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_PLAYER_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://play.gameview.io";
    const shareUrl = `${baseUrl}/experience/${experience.id}`;

    console.log(`[Publish] Experience ${experience.id} published for brief ${briefId}`);
    console.log(`[Publish] Included ${scenesData.length} scene(s) with ${scenesData.reduce((sum, s) => sum + s.placedObjects.length, 0)} total placed objects`);

    return NextResponse.json({
      success: true,
      experienceId: experience.id,
      shareUrl,
      title: experience.title,
      status: experience.status,
    });

  } catch (error) {
    console.error("[Publish] Error:", error);
    return NextResponse.json(
      { error: "Failed to publish experience" },
      { status: 500 }
    );
  }
}
