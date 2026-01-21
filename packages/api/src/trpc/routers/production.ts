import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, creatorProcedure, protectedProcedure } from "../trpc";

/**
 * Production Router
 *
 * Manages video-to-3D production jobs:
 * - Create new productions
 * - Get production status
 * - List creator's productions
 * - Cancel/retry productions
 *
 * Note: The actual queue operations are handled via REST API
 * to avoid importing BullMQ in the tRPC bundle.
 */

/**
 * Get the base URL for internal API calls
 * Works in both local development and Vercel deployment
 */
function getInternalApiUrl(): string {
  // Explicit override takes priority
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  // Vercel deployment URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Local development
  return "http://localhost:3000";
}

const productionPreset = z.enum(["fast", "balanced", "high"]);

const productionStatus = z.enum([
  "queued",
  "downloading",
  "frame_extraction",
  "colmap",
  "brush",
  "uploading",
  "finalizing",
  "completed",
  "failed",
  "cancelled",
]);

export const productionRouter = router({
  /**
   * Create a new production
   *
   * Creates a ProcessingJob record and triggers the queue.
   */
  create: creatorProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        experienceId: z.string().optional(), // Create new or link to existing
        sourceVideos: z.array(
          z.object({
            url: z.string().url(),
            filename: z.string(),
            size: z.number(),
          })
        ).min(2, "At least 2 camera angles required"),
        preset: productionPreset.default("balanced"),
        motionEnabled: z.boolean().default(false), // 4D motion processing
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create or get experience
      let experienceId = input.experienceId;

      if (!experienceId) {
        // Create a draft experience for this production
        const experience = await ctx.db.experience.create({
          data: {
            creatorId: ctx.creatorId,
            title: input.name,
            description: `Production created on ${new Date().toLocaleDateString()}`,
            category: "ENTERTAINMENT", // Default category
            subcategory: "performance",
            duration: 60,
            status: "PROCESSING",
          },
        });
        experienceId = experience.id;
      }

      // Get quality settings based on preset
      const presetSettings = {
        fast: { totalSteps: 5000, maxSplats: 5000000, imagePercentage: 30, fps: 15, duration: 5 },
        balanced: { totalSteps: 15000, maxSplats: 10000000, imagePercentage: 50, fps: 24, duration: 10 },
        high: { totalSteps: 30000, maxSplats: 20000000, imagePercentage: 75, fps: 30, duration: 15 },
      };

      const settings = presetSettings[input.preset];

      // Create ProcessingJob record
      const job = await ctx.db.processingJob.create({
        data: {
          experienceId,
          status: "QUEUED",
          sourceVideoUrl: JSON.stringify(input.sourceVideos), // Store as JSON for now
          ...settings,
          motionEnabled: input.motionEnabled,
        },
        include: {
          experience: true,
        },
      });

      // Trigger queue via internal API (avoids importing BullMQ here)
      // The API route will handle adding to BullMQ
      try {
        const queueUrl = `${getInternalApiUrl()}/api/productions/queue`;
        console.log("[Production] Triggering queue at:", queueUrl);

        const queueResponse = await fetch(
          queueUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productionId: job.id,
              experienceId,
              creatorId: ctx.creatorId,
              sourceVideos: input.sourceVideos,
              preset: input.preset,
              motionEnabled: input.motionEnabled,
            }),
          }
        );

        // Always try to read the response body for better error messages
        let responseBody: string | null = null;
        try {
          responseBody = await queueResponse.text();
        } catch {
          // Ignore body read errors
        }

        if (!queueResponse.ok) {
          console.error("[Production] Queue failed:", queueResponse.status, responseBody);
          throw new Error(`Queue returned ${queueResponse.status}: ${responseBody || 'No response body'}`);
        }

        console.log("[Production] Queue success:", responseBody?.substring(0, 200));
      } catch (error) {
        console.error("[Production] Queue error:", error);

        // Mark job as failed if queue fails - wrap in try-catch to prevent double errors
        try {
          await ctx.db.processingJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              errorMessage: error instanceof Error ? error.message : "Failed to queue job",
            },
          });
        } catch (dbError) {
          console.error("[Production] Failed to update job status:", dbError);
          // Continue - we still want to return the error to the user
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to start production",
        });
      }

      return {
        id: job.id,
        experienceId,
        status: "queued",
        name: input.name,
        preset: input.preset,
        motionEnabled: input.motionEnabled,
        videoCount: input.sourceVideos.length,
        createdAt: job.queuedAt,
      };
    }),

  /**
   * Get a single production by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.processingJob.findUnique({
        where: { id: input.id },
        include: {
          experience: {
            include: {
              creator: {
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production not found",
        });
      }

      // Check if experience exists (data integrity)
      if (!job.experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production has no associated experience",
        });
      }

      // Verify ownership
      if (job.experience.creator.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this production",
        });
      }

      // Parse source videos
      let sourceVideos = [];
      try {
        sourceVideos = JSON.parse(job.sourceVideoUrl || "[]");
      } catch {
        sourceVideos = [{ url: job.sourceVideoUrl, filename: "video.mp4", size: 0 }];
      }

      return {
        id: job.id,
        experienceId: job.experienceId,
        name: job.experience.title,
        status: job.status.toLowerCase(),
        stage: job.stage?.toLowerCase(),
        progress: job.progress,
        sourceVideos,
        preset: getPresetFromSettings(job),
        outputs: job.status === "COMPLETED"
          ? {
              plyUrl: job.outputPlyUrl,
              camerasUrl: job.outputCamerasUrl,
              thumbnailUrl: job.outputThumbnail,
              previewUrl: job.outputPreview,
            }
          : null,
        error: job.errorMessage,
        createdAt: job.queuedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        processingTime: job.processingTime,
      };
    }),

  /**
   * List productions for the authenticated creator
   */
  list: creatorProcedure
    .input(
      z.object({
        status: productionStatus.optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        experience: {
          creatorId: ctx.creatorId,
        },
        ...(input.status && {
          status: input.status.toUpperCase() as any,
        }),
      };

      const jobs = await ctx.db.processingJob.findMany({
        where,
        include: {
          experience: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: { queuedAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      });

      let nextCursor: string | undefined;
      if (jobs.length > input.limit) {
        const nextItem = jobs.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: jobs
          .filter((job) => job.experience !== null) // Skip orphaned jobs
          .map((job) => ({
            id: job.id,
            experienceId: job.experienceId,
            name: job.experience!.title,
            thumbnailUrl: job.experience!.thumbnailUrl || job.outputThumbnail,
            status: job.status.toLowerCase(),
            stage: job.stage?.toLowerCase(),
            progress: job.progress,
            preset: getPresetFromSettings(job),
            videoCount: getVideoCount(job.sourceVideoUrl),
            error: job.errorMessage,
            createdAt: job.queuedAt,
            completedAt: job.completedAt,
          })),
        nextCursor,
      };
    }),

  /**
   * Get production progress (for polling)
   */
  progress: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.processingJob.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          status: true,
          stage: true,
          progress: true,
          errorMessage: true,
          lastHeartbeat: true,
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production not found",
        });
      }

      return {
        id: job.id,
        status: job.status.toLowerCase(),
        stage: job.stage?.toLowerCase(),
        progress: job.progress,
        error: job.errorMessage,
        lastUpdate: job.lastHeartbeat,
      };
    }),

  /**
   * Cancel a production
   */
  cancel: creatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.processingJob.findUnique({
        where: { id: input.id },
        include: {
          experience: {
            include: { creator: { select: { id: true } } },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production not found",
        });
      }

      // Check if experience exists (data integrity)
      if (!job.experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production has no associated experience",
        });
      }

      if (job.experience.creator.id !== ctx.creatorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to cancel this production",
        });
      }

      // Allow cancelling any job that's not COMPLETED
      // (even if already CANCELLED, just update it again)
      if (job.status === "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Completed productions cannot be cancelled",
        });
      }

      // Update database directly - no need to call internal API
      await ctx.db.processingJob.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          stage: null,
          completedAt: new Date(),
        },
      });

      return { success: true };
    }),

  /**
   * Retry a failed production
   */
  retry: creatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.processingJob.findUnique({
        where: { id: input.id },
        include: {
          experience: {
            include: { creator: { select: { id: true } } },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production not found",
        });
      }

      // Check if experience exists (data integrity)
      if (!job.experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production has no associated experience",
        });
      }

      if (job.experience.creator.id !== ctx.creatorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to retry this production",
        });
      }

      if (job.status !== "FAILED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only failed productions can be retried",
        });
      }

      if (job.retryCount >= job.maxRetries) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum retry attempts reached",
        });
      }

      // Reset job status
      await ctx.db.processingJob.update({
        where: { id: input.id },
        data: {
          status: "QUEUED",
          stage: null,
          progress: 0,
          errorMessage: null,
          retryCount: { increment: 1 },
        },
      });

      // Re-queue
      let sourceVideos = [];
      try {
        sourceVideos = JSON.parse(job.sourceVideoUrl || "[]");
      } catch {
        console.error("[Production] Failed to parse sourceVideoUrl for retry:", job.sourceVideoUrl);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to parse source video data for retry",
        });
      }
      const preset = getPresetFromSettings(job);

      try {
        const queueUrl = `${getInternalApiUrl()}/api/productions/queue`;
        console.log("[Production] Re-triggering queue at:", queueUrl);

        const queueResponse = await fetch(
          queueUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productionId: job.id,
              experienceId: job.experienceId,
              creatorId: ctx.creatorId,
              sourceVideos,
              preset,
            }),
          }
        );

        if (!queueResponse.ok) {
          const errorText = await queueResponse.text().catch(() => 'No response body');
          console.error("[Production] Re-queue failed:", queueResponse.status, errorText);
          throw new Error(`Re-queue returned ${queueResponse.status}`);
        }
      } catch (error) {
        console.error("[Production] Re-queue error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to re-queue production",
        });
      }

      return { success: true };
    }),

  /**
   * Delete a production
   */
  delete: creatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.processingJob.findUnique({
        where: { id: input.id },
        include: {
          experience: {
            include: { creator: { select: { id: true } } },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production not found",
        });
      }

      // Check if experience exists (data integrity)
      if (!job.experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Production has no associated experience",
        });
      }

      if (job.experience.creator.id !== ctx.creatorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this production",
        });
      }

      // Cancel if still running
      if (job.status === "PROCESSING" || job.status === "QUEUED") {
        try {
          await fetch(
            `${getInternalApiUrl()}/api/productions/cancel`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productionId: input.id }),
            }
          );
        } catch {
          // Continue
        }
      }

      // Delete the job (cascades from experience delete would also work)
      await ctx.db.processingJob.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

// Helper functions
function getPresetFromSettings(job: {
  totalSteps: number;
  maxSplats: number;
}): "fast" | "balanced" | "high" {
  if (job.totalSteps <= 5000) return "fast";
  if (job.totalSteps <= 15000) return "balanced";
  return "high";
}

function getVideoCount(sourceVideoUrl: string | null): number {
  if (!sourceVideoUrl) return 0;
  try {
    const videos = JSON.parse(sourceVideoUrl);
    return Array.isArray(videos) ? videos.length : 1;
  } catch {
    return 1;
  }
}
