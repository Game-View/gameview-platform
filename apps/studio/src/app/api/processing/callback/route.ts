import { NextRequest, NextResponse } from "next/server";
import { db } from "@gameview/database";

/**
 * POST /api/processing/callback
 *
 * Webhook endpoint called by Modal when processing completes.
 * Updates the database with results or error status.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the request is from Modal (optional: add signature verification)
    const authHeader = req.headers.get("authorization");
    const webhookSecret = process.env.PROCESSING_WEBHOOK_SECRET;

    // If webhook secret is configured, verify it
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.warn("[Callback] Invalid webhook authorization");
      // Don't reject - Modal may not send auth header
    }

    const body = await req.json();
    const {
      success,
      production_id,
      experience_id,
      outputs,
      error,
    } = body;

    console.log(`[Callback] Received for production ${production_id}:`, {
      success,
      hasOutputs: !!outputs,
      error,
    });

    if (!production_id) {
      return NextResponse.json(
        { error: "production_id is required" },
        { status: 400 }
      );
    }

    // Get the job
    const job = await db.processingJob.findUnique({
      where: { id: production_id },
    });

    if (!job) {
      console.error(`[Callback] Job not found: ${production_id}`);
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check for valid outputs (must have at least plyUrl)
    const hasValidOutputs = success && outputs && outputs.plyUrl;

    if (hasValidOutputs) {
      // Processing succeeded with valid outputs - update job and experience
      const processingTime = job.startedAt
        ? Math.floor((Date.now() - job.startedAt.getTime()) / 1000)
        : null;

      // Update processing job
      await db.processingJob.update({
        where: { id: production_id },
        data: {
          status: "COMPLETED",
          stage: null,
          progress: 100,
          outputPlyUrl: outputs.plyUrl,
          outputCamerasUrl: outputs.camerasUrl,
          outputThumbnail: outputs.thumbnailUrl,
          outputPreview: outputs.previewUrl || null,
          completedAt: new Date(),
          processingTime,
        },
      });

      // Update experience with output URLs
      await db.experience.update({
        where: { id: experience_id },
        data: {
          plyUrl: outputs.plyUrl,
          camerasJson: outputs.camerasUrl,
          thumbnailUrl: outputs.thumbnailUrl,
          previewUrl: outputs.previewUrl || null,
          status: "PUBLISHED", // Auto-publish on completion (or keep DRAFT)
          publishedAt: new Date(),
        },
      });

      console.log(`[Callback] Production ${production_id} completed successfully`);

      // TODO: Send notification to user (email, push, etc.)

    } else {
      // Processing failed or no valid outputs
      const errorMessage = error ||
        (success && !outputs?.plyUrl ? "Processing completed but no output was generated" : "Unknown processing error");

      await db.processingJob.update({
        where: { id: production_id },
        data: {
          status: "FAILED",
          errorMessage,
          completedAt: new Date(),
          retryCount: {
            increment: 1,
          },
        },
      });

      console.error(`[Callback] Production ${production_id} failed:`, error);

      // TODO: Send failure notification to user
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[Callback] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for health check
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "processing-callback" });
}
