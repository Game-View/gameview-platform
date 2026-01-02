import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";

/**
 * POST /api/productions/queue
 *
 * Adds a production job to the BullMQ queue.
 * Called by the tRPC production.create mutation.
 *
 * Note: BullMQ is imported dynamically to avoid bundling issues.
 * If Redis is not configured, jobs are marked as queued for later processing.
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

    // Check if Redis is configured
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      // No Redis configured - return success so the production is created
      // Jobs will remain in QUEUED status until a worker picks them up
      console.log("[API] Redis not configured - production queued for manual processing:", productionId);
      return NextResponse.json({
        success: true,
        jobId: productionId,
        productionId,
        queued: "pending", // Indicates no active queue
        message: "Production created. Processing will begin when the processing service is available.",
      });
    }

    // Dynamic import to avoid bundling BullMQ in Next.js client bundle
    try {
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
    } catch (queueError) {
      // BullMQ/Redis connection failed - still mark as success
      // The production record exists, just not queued in Redis
      console.error("[API] Queue unavailable, production saved:", queueError);
      return NextResponse.json({
        success: true,
        jobId: productionId,
        productionId,
        queued: "pending",
        message: "Production created. Processing queue temporarily unavailable.",
      });
    }
  } catch (error) {
    console.error("[API] Failed to queue production:", error);
    return NextResponse.json(
      { error: "Failed to queue production" },
      { status: 500 }
    );
  }
}
