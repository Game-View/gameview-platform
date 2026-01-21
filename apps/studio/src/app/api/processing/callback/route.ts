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

    // Check for valid outputs (must have at least plyUrl for static, or motionMetadataUrl for 4D)
    const isMotionOutput = outputs?.motionMetadataUrl && outputs?.motionFrameCount;
    const hasValidOutputs = success && outputs && (outputs.plyUrl || isMotionOutput);

    if (hasValidOutputs) {
      // Processing succeeded with valid outputs - update job and experience
      const processingTime = job.startedAt
        ? Math.floor((Date.now() - job.startedAt.getTime()) / 1000)
        : null;

      // Build update data for processing job
      const jobUpdateData: Record<string, unknown> = {
        status: "COMPLETED",
        stage: null,
        progress: 100,
        outputPlyUrl: outputs.plyUrl || null,
        outputCamerasUrl: outputs.camerasUrl || null,
        outputThumbnail: outputs.thumbnailUrl || null,
        outputPreview: outputs.previewUrl || null,
        completedAt: new Date(),
        processingTime,
      };

      // Add motion-specific outputs if present
      if (isMotionOutput) {
        jobUpdateData.outputMotionMetadataUrl = outputs.motionMetadataUrl;
        jobUpdateData.outputMotionFrameCount = outputs.motionFrameCount;
        jobUpdateData.outputMotionDuration = outputs.motionDuration || null;
      }

      // Update processing job
      await db.processingJob.update({
        where: { id: production_id },
        data: jobUpdateData,
      });

      // Build update data for experience
      const experienceUpdateData: Record<string, unknown> = {
        status: "PUBLISHED",
        publishedAt: new Date(),
      };

      if (isMotionOutput) {
        // 4D motion output - set motion fields
        experienceUpdateData.motionEnabled = true;
        experienceUpdateData.motionMetadataUrl = outputs.motionMetadataUrl;
        experienceUpdateData.motionFrameCount = outputs.motionFrameCount;
        experienceUpdateData.motionDuration = outputs.motionDuration || null;
        experienceUpdateData.motionFps = outputs.motionFps || 15;
        // Also set the first frame PLY as the static fallback
        if (outputs.plyUrl) {
          experienceUpdateData.plyUrl = outputs.plyUrl;
        }
        experienceUpdateData.camerasJson = outputs.camerasUrl || null;
        experienceUpdateData.thumbnailUrl = outputs.thumbnailUrl || null;
        experienceUpdateData.previewUrl = outputs.previewUrl || null;
      } else {
        // Static output - set standard fields
        experienceUpdateData.plyUrl = outputs.plyUrl;
        experienceUpdateData.camerasJson = outputs.camerasUrl;
        experienceUpdateData.thumbnailUrl = outputs.thumbnailUrl;
        experienceUpdateData.previewUrl = outputs.previewUrl || null;
        experienceUpdateData.motionEnabled = false;
      }

      // Update experience with output URLs
      await db.experience.update({
        where: { id: experience_id },
        data: experienceUpdateData,
      });

      console.log(`[Callback] Production ${production_id} completed successfully (motion: ${isMotionOutput})`);

      // TODO: Send notification to user (email, push, etc.)

    } else {
      // Processing failed or no valid outputs
      const errorMessage = error ||
        (success && !outputs?.plyUrl ? "Processing completed but no output was generated" : "Unknown processing error");

      await db.processingJob.update({
        where: { id: production_id },
        data: {
          status: "FAILED",
          stage: null, // Clear stage so dashboard shows "failed" status instead of stale stage
          progress: 0,
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
