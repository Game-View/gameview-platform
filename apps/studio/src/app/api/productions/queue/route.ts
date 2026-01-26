import { NextRequest, NextResponse } from "next/server";
import { db } from "@gameview/database";

/**
 * POST /api/productions/queue
 *
 * Triggers GPU processing for a production job.
 * Called internally by the tRPC production.create mutation.
 *
 * NOTE: This is an internal API route - auth is handled by the calling tRPC
 * procedure. The middleware allows this route without auth to enable internal calls.
 *
 * Processing options (in order of preference):
 * 1. Modal - if MODAL_ENDPOINT_URL is configured
 * 2. BullMQ - if REDIS_URL is configured (legacy)
 * 3. Pending - marks job for manual processing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productionId, experienceId, creatorId, sourceVideos, preset, motionEnabled } = body;

    if (!productionId || !experienceId || !sourceVideos || !preset) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine if this is a 4D motion job
    const isMotionJob = motionEnabled === true;

    // Option 1: Use Modal for GPU processing (preferred)
    // Select the appropriate Modal endpoint based on job type
    const defaultStaticUrl = "https://smithjps512--gameview-processing-trigger.modal.run";
    const default4DUrl = "https://smithjps512--gameview-4d-processing-trigger-4d.modal.run";

    const modalEndpointUrl = isMotionJob
      ? (process.env.MODAL_4D_WEBHOOK_URL || default4DUrl)
      : (process.env.MODAL_ENDPOINT_URL || defaultStaticUrl);

    console.log("[QUEUE] ===== Queue route called =====");
    console.log("[QUEUE] Production:", productionId);
    console.log("[QUEUE] Motion enabled:", motionEnabled, "→ isMotionJob:", isMotionJob);
    console.log("[QUEUE] Modal endpoint:", modalEndpointUrl ? `${modalEndpointUrl.substring(0, 80)}` : "NOT SET");
    console.log("[QUEUE] Timestamp:", new Date().toISOString());

    if (modalEndpointUrl) {
      console.log("[QUEUE] Triggering Modal processing for:", productionId);

      try {
        // Get the processing job for settings
        const job = await db.processingJob.findUnique({
          where: { id: productionId },
        });

        if (!job) {
          return NextResponse.json(
            { error: "Processing job not found" },
            { status: 404 }
          );
        }

        // Build callback URL - use INTERNAL_API_URL for stable production URL
        const baseUrl = process.env.INTERNAL_API_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const callbackUrl = `${baseUrl}/api/processing/callback`;
        console.log("[QUEUE] Callback URL:", callbackUrl);

        // Prepare Modal payload
        const modalPayload = {
          production_id: productionId,
          experience_id: experienceId,
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

        // Trigger Modal web endpoint
        const modalResponse = await fetch(modalEndpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(modalPayload),
        });

        console.log("[QUEUE] Modal response status:", modalResponse.status);

        if (modalResponse.ok) {
          let modalResult;
          try {
            const responseText = await modalResponse.text();
            console.log("[QUEUE] Modal response body:", responseText.substring(0, 500));
            modalResult = JSON.parse(responseText);
          } catch (parseError) {
            console.error("[QUEUE] Failed to parse Modal response:", parseError);
            // Fall through to other options
            throw parseError;
          }
          console.log("[QUEUE] Modal success - call_id:", modalResult.call_id);

          // Use job_run_id from trigger_4d if available (this is what the GPU function
          // uses as assigned_worker_id to recognize itself). Falling back to call_id
          // would cause the GPU function to see a different workerId and abort.
          const workerId = modalResult.job_run_id || modalResult.call_id || "modal";
          console.log("[QUEUE] Setting workerId:", workerId, "(job_run_id:", modalResult.job_run_id, ", call_id:", modalResult.call_id, ")");

          // Update job status to processing
          await db.processingJob.update({
            where: { id: productionId },
            data: {
              status: "PROCESSING",
              stage: "DOWNLOADING",
              startedAt: new Date(),
              workerId,
            },
          });

          return NextResponse.json({
            success: true,
            jobId: productionId,
            productionId,
            processor: "modal",
            callId: modalResult.call_id,
          });
        } else {
          const errorText = await modalResponse.text();
          console.error("[QUEUE] Modal trigger failed:", errorText);
          // Fall through to other options
        }
      } catch (modalError) {
        console.error("[QUEUE] Modal error:", modalError);
        // Fall through to other options
      }
    }

    // Option 2: Use BullMQ queue (legacy, if Redis configured)
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
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
          processor: "bullmq",
        });
      } catch (queueError) {
        console.error("[QUEUE] BullMQ unavailable:", queueError);
        // Fall through to pending
      }
    }

    // Option 3: Mark as pending for manual processing
    console.log("[QUEUE] No processor available - production queued for manual processing:", productionId);
    return NextResponse.json({
      success: true,
      jobId: productionId,
      productionId,
      processor: "pending",
      message: "Production created. Processing will begin when the processing service is available.",
    });

  } catch (error) {
    console.error("[QUEUE] Failed to queue production:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to queue production", details: errorMessage },
      { status: 500 }
    );
  }
}
