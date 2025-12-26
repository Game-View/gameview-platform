import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";

/**
 * POST /api/productions/queue
 *
 * Adds a production job to the BullMQ queue.
 * Called by the tRPC production.create mutation.
 *
 * Note: BullMQ is imported dynamically to avoid bundling issues.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productionId, experienceId, creatorId, sourceVideos, preset } = body;

    if (!productionId || !experienceId || !sourceVideos || !preset) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Dynamic import to avoid bundling BullMQ in Next.js client bundle
    const { addProductionJob } = await import("@gameview/queue");

    const job = await addProductionJob({
      productionId,
      experienceId,
      creatorId,
      sourceVideos,
      preset,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      productionId,
    });
  } catch (error) {
    console.error("[API] Failed to queue production:", error);
    return NextResponse.json(
      { error: "Failed to queue production" },
      { status: 500 }
    );
  }
}
