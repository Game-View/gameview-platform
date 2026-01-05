import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { db } from "@gameview/database";

/**
 * POST /api/productions/queue
 *
 * Triggers GPU processing for a production job.
 * Called by the tRPC production.create mutation.
 *
 * Processing options (in order of preference):
 * 1. Modal - if MODAL_API_TOKEN is configured
 * 2. BullMQ - if REDIS_URL is configured (legacy)
 * 3. Pending - marks job for manual processing
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

    // Option 1: Use Modal for GPU processing (preferred)
    // MODAL_ENDPOINT_URL format: https://<username>--gameview-processing-trigger.modal.run
    const modalEndpointUrl = process.env.MODAL_ENDPOINT_URL;
    console.log("[API] Queue route called for production:", productionId);
    console.log("[API] MODAL_ENDPOINT_URL:", modalEndpointUrl ? `${modalEndpointUrl.substring(0, 30)}...` : "NOT SET");

    if (modalEndpointUrl) {
      console.log("[API] Triggering Modal processing for:", productionId);

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

        // Build callback URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const callbackUrl = `${baseUrl}/api/processing/callback`;

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

        console.log("[API] Modal response status:", modalResponse.status);

        if (modalResponse.ok) {
          const modalResult = await modalResponse.json();
          console.log("[API] Modal success - call_id:", modalResult.call_id);

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
            jobId: productionId,
            productionId,
            processor: "modal",
            callId: modalResult.call_id,
          });
        } else {
          const errorText = await modalResponse.text();
          console.error("[API] Modal trigger failed:", errorText);
          // Fall through to other options
        }
      } catch (modalError) {
        console.error("[API] Modal error:", modalError);
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
        console.error("[API] BullMQ unavailable:", queueError);
        // Fall through to pending
      }
    }

    // Option 3: Mark as pending for manual processing
    console.log("[API] No processor available - production queued for manual processing:", productionId);
    return NextResponse.json({
      success: true,
      jobId: productionId,
      productionId,
      processor: "pending",
      message: "Production created. Processing will begin when the processing service is available.",
    });

  } catch (error) {
    console.error("[API] Failed to queue production:", error);
    return NextResponse.json(
      { error: "Failed to queue production" },
      { status: 500 }
    );
  }
}
