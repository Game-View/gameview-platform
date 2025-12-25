import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { getSceneById, updateScene, deleteScene } from "@/lib/scenes";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/scenes/[id] - Get a specific scene
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scene = await getSceneById(id, userId);

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json(scene);
  } catch (error) {
    console.error("Failed to get scene:", error);
    return NextResponse.json(
      { error: "Failed to get scene" },
      { status: 500 }
    );
  }
}

// PATCH /api/scenes/[id] - Update a scene
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const scene = await updateScene(id, userId, body);

    return NextResponse.json(scene);
  } catch (error) {
    console.error("Failed to update scene:", error);
    return NextResponse.json(
      { error: "Failed to update scene" },
      { status: 500 }
    );
  }
}

// DELETE /api/scenes/[id] - Delete a scene
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteScene(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete scene:", error);
    return NextResponse.json(
      { error: "Failed to delete scene" },
      { status: 500 }
    );
  }
}
