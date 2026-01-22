import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@gameview/database";

/**
 * POST /api/processing/trigger
 *
 * Triggers Modal GPU processing for a production job.
 * Called after a production is created and videos are uploaded.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productionId } = body;

    if (!productionId) {
      return NextResponse.json(
        { error: "productionId is required" },
        { status: 400 }
      );
    }

    // Get the processing job with all needed data
    const job = await db.processingJob.findUnique({
      where: { id: productionId },
      include: {
        experience: {
          include: {
            creator: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Production job not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this production
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { creator: true },
    });

    if (!user?.creator || user.creator.id !== job.experience.creatorId) {
      return NextResponse.json(
        { error: "Not authorized to process this production" },
        { status: 403 }
      );
    }

    // Check if already processing
    if (job.status === "PROCESSING") {
      return NextResponse.json(
        { error: "Production is already processing" },
        { status: 400 }
      );
    }

    // Build the callback URL
    // VERCEL_URL doesn't include the protocol, so we need to add it
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      baseUrl = "http://localhost:3000";
    }
    const callbackUrl = `${baseUrl}/api/processing/callback`;

    // Get video URLs from storage
    // The sourceVideoUrl is stored as JSON array from the production router
    let sourceVideos: Array<{ url: string; filename: string; size: number }>;
    try {
      // Try to parse as JSON (new format from production.create)
      const parsed = JSON.parse(job.sourceVideoUrl);
      if (Array.isArray(parsed)) {
        // Already in correct format with urls
        sourceVideos = parsed.map((v: { url?: string; filename?: string; size?: number }, index: number) => ({
          url: v.url || "",
          filename: v.filename || `video_${index}.mp4`,
          size: v.size || 0,
        }));
      } else {
        throw new Error("Not an array");
      }
    } catch {
      // Fallback: treat as comma-separated paths (legacy format)
      const videoPaths = job.sourceVideoUrl.split(",");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      sourceVideos = videoPaths.map((path, index) => ({
        url: `${supabaseUrl}/storage/v1/object/public/production-videos/${path.trim()}`,
        filename: `video_${index}.mp4`,
        size: 0,
      }));
    }

    // Determine if this is a 4D motion job
    const isMotionJob = job.motionEnabled === true;

    // Prepare Modal payload (base settings for both static and motion)
    const modalPayload = {
      production_id: productionId,
      experience_id: job.experienceId,
      source_videos: sourceVideos,
      settings: {
        totalSteps: job.totalSteps,
        maxSplats: job.maxSplats,
        imagePercentage: job.imagePercentage,
        fps: job.fps,
        duration: job.duration,
        // 4D motion-specific settings (only used by 4D worker)
        ...(isMotionJob && {
          motionEnabled: true,
          motionFps: job.motionFps || 15,
          motionMaxFrames: job.motionMaxFrames || 150,
        }),
      },
      callback_url: callbackUrl,
    };

    // Select the appropriate Modal webhook based on job type
    const defaultStaticUrl = "https://smithjps512--gameview-processing-trigger.modal.run";
    const default4DUrl = "https://smithjps512--gameview-4d-processing-trigger.modal.run";

    const modalWebhookUrl = isMotionJob
      ? (process.env.MODAL_4D_WEBHOOK_URL || default4DUrl)
      : (process.env.MODAL_WEBHOOK_URL || defaultStaticUrl);

    console.log(`[Processing] Triggering ${isMotionJob ? "4D motion" : "static"} processing`);
    console.log("[Processing] Modal webhook:", modalWebhookUrl);
    console.log("[Processing] Payload:", JSON.stringify(modalPayload, null, 2));

    const modalResponse = await fetch(modalWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modalPayload),
    });

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text();
      console.error("[Processing] Modal API error:", errorText);

      // Update job status to failed
      await db.processingJob.update({
        where: { id: productionId },
        data: {
          status: "FAILED",
          errorMessage: `Failed to start processing: ${errorText}`,
        },
      });

      return NextResponse.json(
        { error: "Failed to start processing" },
        { status: 500 }
      );
    }

    const modalResult = await modalResponse.json();

    // Update job status to processing
    await db.processingJob.update({
      where: { id: productionId },
      data: {
        status: "PROCESSING",
        stage: "DOWNLOADING",
        startedAt: new Date(),
        workerId: modalResult.call_id || "modal",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Processing started",
      callId: modalResult.call_id,
    });

  } catch (error) {
    console.error("[Processing] Trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
