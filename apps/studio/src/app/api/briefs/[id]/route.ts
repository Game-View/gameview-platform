import { auth } from "@/lib/auth-server";
import { getBriefById, updateBrief, archiveBrief } from "@/lib/briefs";
import type { ExtractedBrief } from "@/app/api/brief/extract/route";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/briefs/[id] - Get a specific brief
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;
    const brief = await getBriefById(id, userId);

    if (!brief) {
      return new Response(JSON.stringify({ error: "Brief not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(brief), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/briefs/[id] error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch brief" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PATCH /api/briefs/[id] - Update a brief
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;
    const body = await request.json();
    const { brief, conversationHistory, status } = body as {
      brief?: Partial<ExtractedBrief>;
      conversationHistory?: { role: string; content: string }[];
      status?: "draft" | "in_progress" | "ready" | "archived";
    };

    const updatedBrief = await updateBrief(id, userId, {
      brief,
      conversationHistory,
      status,
    });

    return new Response(JSON.stringify(updatedBrief), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PATCH /api/briefs/[id] error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update brief" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE /api/briefs/[id] - Archive a brief
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;
    await archiveBrief(id, userId);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/briefs/[id] error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to archive brief" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
