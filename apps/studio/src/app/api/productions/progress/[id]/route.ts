import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";
import { db } from "@gameview/database";

/**
 * GET /api/productions/progress/:id
 *
 * Server-Sent Events (SSE) endpoint for real-time production progress.
 * Uses database polling (works on Vercel serverless).
 * Falls back to Redis pub/sub if REDIS_URL is configured.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const productionId = params.id;
  const redisUrl = process.env.REDIS_URL;

  // If Redis is available, use pub/sub for real-time updates
  if (redisUrl) {
    return createRedisSSE(request, productionId, redisUrl);
  }

  // Otherwise, use database polling (works on Vercel serverless)
  return createPollingSSE(request, productionId);
}

/**
 * Database-polling SSE - works on Vercel without Redis.
 * Polls the ProcessingJob table every 5 seconds.
 */
function createPollingSSE(request: NextRequest, productionId: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastStatus = "";
      let lastProgress = -1;

      const poll = async () => {
        try {
          const job = await db.processingJob.findUnique({
            where: { id: productionId },
            select: {
              status: true,
              stage: true,
              progress: true,
              errorMessage: true,
            },
          });

          if (!job) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "Job not found" })}\n\n`)
            );
            controller.close();
            return;
          }

          const statusKey = `${job.status}-${job.stage}-${job.progress}`;
          if (statusKey !== lastStatus || job.progress !== lastProgress) {
            lastStatus = statusKey;
            lastProgress = job.progress ?? -1;

            const data = JSON.stringify({
              productionId,
              status: job.status,
              stage: job.stage || "unknown",
              progress: job.progress || 0,
              error: job.errorMessage,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Stop polling on terminal states
          if (job.status === "COMPLETED" || job.status === "FAILED") {
            controller.close();
            return;
          }
        } catch (err) {
          console.error("[Progress] Polling error:", err);
        }
      };

      // Initial poll
      await poll();

      // Poll every 5 seconds
      const interval = setInterval(poll, 5000);

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          clearInterval(interval);
        }
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(heartbeat);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Redis pub/sub SSE - for environments with Redis configured.
 */
function createRedisSSE(request: NextRequest, productionId: string, redisUrl: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const Redis = (await import("ioredis")).default;

        const subscriber = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          connectTimeout: 5000,
        });

        subscriber.on("error", (err) => {
          console.error("[Progress] Redis error:", err.message);
        });

        const channel = "production:progress";

        await subscriber.subscribe(channel);

        subscriber.on("message", (ch: string, message: string) => {
          if (ch !== channel) return;

          try {
            const progress = JSON.parse(message);
            if (progress.productionId === productionId) {
              controller.enqueue(encoder.encode(`data: ${message}\n\n`));

              if (progress.stage === "completed" || progress.stage === "failed") {
                setTimeout(() => {
                  subscriber.unsubscribe(channel);
                  subscriber.quit();
                  controller.close();
                }, 1000);
              }
            }
          } catch {
            // Ignore invalid messages
          }
        });

        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch {
            clearInterval(heartbeat);
          }
        }, 30000);

        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          subscriber.unsubscribe(channel);
          subscriber.quit();
        });
      } catch (err) {
        console.error("[Progress] Redis SSE setup failed, falling back to polling:", err);
        // If Redis fails, close this stream - client can retry and will get polling
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
