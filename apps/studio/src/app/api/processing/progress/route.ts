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

    // Map Modal stages to DB stages
    const stageMap: Record<string, string> = {
      'downloading': 'queued',
      'frame_extraction': 'frame_extraction',
      'colmap_features': 'colmap',
      'colmap_matching': 'colmap',
      'glomap': 'colmap',
      'training': 'brush_processing',
      'uploading': 'metadata_generation',
      'completed': 'completed',
      'failed': 'failed',
    };

    const dbStage = stageMap[stage] || stage;

    // Update processing job in database
    await db.processingJob.update({
      where: { id: production_id },
      data: {
        stage: dbStage,
        progress: Math.min(100, Math.max(0, progress)),
        ...(stage === 'failed' ? { status: 'FAILED', errorMessage: message } : {}),
      },
    });

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
