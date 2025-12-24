import { auth } from "@clerk/nextjs/server";
import { createBrief, getBriefsByUser } from "@/lib/briefs";
import type { ExtractedBrief } from "@/app/api/brief/extract/route";

// GET /api/briefs - List all briefs for current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const briefs = await getBriefsByUser(userId);

    return new Response(JSON.stringify(briefs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/briefs error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch briefs" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/briefs - Create a new brief
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { brief, conversationHistory } = body as {
      brief: ExtractedBrief;
      conversationHistory: { role: string; content: string }[];
    };

    if (!brief || !conversationHistory) {
      return new Response(
        JSON.stringify({ error: "Brief and conversation history are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const savedBrief = await createBrief({
      userId,
      brief,
      conversationHistory,
    });

    return new Response(JSON.stringify(savedBrief), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/briefs error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create brief" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
