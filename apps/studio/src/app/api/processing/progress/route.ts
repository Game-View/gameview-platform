import { NextRequest, NextResponse } from "next/server";
import { db } from "@gameview/database";

/**
 * POST /api/processing/progress
 *
 * Webhook endpoint called by Modal to report processing progress.
 * Updates the database with current stage and progress percentage.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { production_id, stage, progress, message } = body;

    console.log(`[Progress] ${production_id}: ${stage} - ${progress}% - ${message || ''}`);

    if (!production_id) {
      return NextResponse.json(
        { error: "production_id is required" },
        { status: 400 }
      );
    }

    // Map Modal stages to display-friendly DB stages
    // Keep stages meaningful for dashboard display
    const stageMap: Record<string, string> = {
      'downloading': 'downloading',      // Was 'queued' - now shows actual stage
      'frame_extraction': 'frame_extraction',
      'colmap_features': 'colmap',
      'colmap_matching': 'colmap',
      'glomap': 'reconstruction',        // More descriptive than 'colmap'
      'training': 'training',            // Was 'brush_processing'
      'uploading': 'uploading',          // Was 'metadata_generation'
      'completed': 'completed',
      'failed': 'failed',
    };

    const dbStage = stageMap[stage] || stage;

    // Determine the status based on stage
    const statusForStage = stage === 'failed' ? 'FAILED'
                         : stage === 'completed' ? 'COMPLETED'
                         : 'PROCESSING';

    // Update processing job in database
    await db.processingJob.update({
      where: { id: production_id },
      data: {
        status: statusForStage,
        stage: dbStage,
        progress: Math.min(100, Math.max(0, progress)),
        lastHeartbeat: new Date(),
        ...(stage === 'failed' ? { errorMessage: message } : {}),
        ...(stage === 'completed' ? { completedAt: new Date() } : {}),
      },
    });

    // Publish to Redis for SSE subscribers (if Redis is available)
    try {
      const { getRedisConnection } = await import("@gameview/queue");
      const redis = getRedisConnection();
      const progressData = JSON.stringify({
        productionId: production_id,
        stage: dbStage,
        progress,
        message,
      });
      // Store current progress
      await redis.set(`production:progress:${production_id}`, progressData, 'EX', 3600);
      // Publish to channel for SSE subscribers
      await redis.publish('production:progress', progressData);
    } catch (redisError) {
      // Redis not available - SSE won't work but DB is updated
      console.log(`[Progress] Redis unavailable, skipping pub/sub:`, redisError);
    }

    return NextResponse.json({ received: true, stage: dbStage, progress });

  } catch (error) {
    console.error("[Progress] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "processing-progress" });
}
