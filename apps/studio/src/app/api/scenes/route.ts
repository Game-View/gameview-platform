import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { createScene, getScenesByBrief, getScenesByUser } from "@/lib/scenes";

// GET /api/scenes - Get all scenes (optionally filtered by briefId)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const briefId = searchParams.get("briefId");

    let scenes;
    if (briefId) {
      scenes = await getScenesByBrief(briefId, userId);
    } else {
      scenes = await getScenesByUser(userId);
    }

    return NextResponse.json(scenes);
  } catch (error) {
    console.error("Failed to get scenes:", error);
    return NextResponse.json(
      { error: "Failed to get scenes" },
      { status: 500 }
    );
  }
}

// POST /api/scenes - Create a new scene
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { briefId, name, description, orderIndex } = body;

    if (!briefId) {
      return NextResponse.json(
        { error: "briefId is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const scene = await createScene({
      briefId,
      userId,
      name,
      description,
      orderIndex,
    });

    return NextResponse.json(scene, { status: 201 });
  } catch (error) {
    console.error("Failed to create scene:", error);
    return NextResponse.json(
      { error: "Failed to create scene" },
      { status: 500 }
    );
  }
}
