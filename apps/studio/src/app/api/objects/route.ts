import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import {
  getObjects,
  createObject,
  type ObjectFilters,
  type ObjectCategory,
  type ObjectSource,
  type InteractionType,
} from "@/lib/objects";

/**
 * GET /api/objects
 * List objects with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    const { searchParams } = new URL(request.url);

    // Build filters from query params
    const filters: ObjectFilters = {};

    const category = searchParams.get("category");
    if (category) {
      filters.category = category as ObjectCategory;
    }

    const source = searchParams.get("source");
    if (source) {
      filters.source = source as ObjectSource;
    }

    const interactionType = searchParams.get("interactionType");
    if (interactionType) {
      filters.interactionType = interactionType as InteractionType;
    }

    const search = searchParams.get("search") || searchParams.get("q");
    if (search) {
      filters.search = search;
    }

    const tags = searchParams.get("tags");
    if (tags) {
      filters.tags = tags.split(",").map((t) => t.trim());
    }

    const isPublic = searchParams.get("isPublic");
    if (isPublic !== null) {
      filters.isPublic = isPublic === "true";
    }

    // If user is logged in and requesting their own objects
    const mine = searchParams.get("mine");
    if (mine === "true" && userId) {
      filters.userId = userId;
    }

    const limit = searchParams.get("limit");
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get("offset");
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }

    // For non-authenticated users or general browsing, only show public objects
    if (!userId && filters.isPublic === undefined) {
      filters.isPublic = true;
    }

    const objects = await getObjects(filters);

    return NextResponse.json(objects);
  } catch (error) {
    console.error("Failed to get objects:", error);
    return NextResponse.json(
      { error: "Failed to get objects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/objects
 * Create a new object (user upload)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category || !body.modelUrl) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, modelUrl" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories: ObjectCategory[] = [
      "collectibles",
      "furniture",
      "props",
      "interactive",
      "decorations",
      "audio",
      "effects",
      "characters",
      "vehicles",
      "nature",
    ];

    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const object = await createObject(
      {
        name: body.name,
        description: body.description,
        category: body.category,
        modelUrl: body.modelUrl,
        thumbnailUrl: body.thumbnailUrl,
        previewGif: body.previewGif,
        interactionType: body.interactionType,
        defaultTransform: body.defaultTransform,
        metadata: body.metadata,
        tags: body.tags,
        isPublic: body.isPublic,
      },
      userId
    );

    return NextResponse.json(object, { status: 201 });
  } catch (error) {
    console.error("Failed to create object:", error);
    return NextResponse.json(
      { error: "Failed to create object" },
      { status: 500 }
    );
  }
}
