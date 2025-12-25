import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import {
  getObjectById,
  updateObject,
  deleteObject,
  incrementUsageCount,
} from "@/lib/objects";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/objects/[id]
 * Get a single object by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const object = await getObjectById(id);

    if (!object) {
      return NextResponse.json(
        { error: "Object not found" },
        { status: 404 }
      );
    }

    // Check if object should be accessible
    const { userId } = await auth();
    if (!object.isPublic && object.source === "uploaded" && object.userId !== userId) {
      return NextResponse.json(
        { error: "Object not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(object);
  } catch (error) {
    console.error("Failed to get object:", error);
    return NextResponse.json(
      { error: "Failed to get object" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/objects/[id]
 * Update an object
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const object = await updateObject(id, userId, body);

    return NextResponse.json(object);
  } catch (error) {
    console.error("Failed to update object:", error);

    if (error instanceof Error) {
      if (error.message === "Object not found") {
        return NextResponse.json(
          { error: "Object not found" },
          { status: 404 }
        );
      }
      if (error.message === "Not authorized to update this object") {
        return NextResponse.json(
          { error: "Not authorized to update this object" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update object" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/objects/[id]
 * Partial update or increment usage count
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Special action: increment usage count
    if (body.action === "increment_usage") {
      await incrementUsageCount(id);
      return NextResponse.json({ success: true });
    }

    // Otherwise, treat as partial update
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const object = await updateObject(id, userId, body);

    return NextResponse.json(object);
  } catch (error) {
    console.error("Failed to patch object:", error);

    if (error instanceof Error) {
      if (error.message === "Object not found") {
        return NextResponse.json(
          { error: "Object not found" },
          { status: 404 }
        );
      }
      if (error.message === "Not authorized to update this object") {
        return NextResponse.json(
          { error: "Not authorized to update this object" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update object" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/objects/[id]
 * Delete an object
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await deleteObject(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete object:", error);

    if (error instanceof Error) {
      if (error.message === "Object not found") {
        return NextResponse.json(
          { error: "Object not found" },
          { status: 404 }
        );
      }
      if (error.message === "Cannot delete preloaded objects") {
        return NextResponse.json(
          { error: "Cannot delete preloaded objects" },
          { status: 403 }
        );
      }
      if (error.message === "Not authorized to delete this object") {
        return NextResponse.json(
          { error: "Not authorized to delete this object" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete object" },
      { status: 500 }
    );
  }
}
