import { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";

/**
 * GET /api/productions/progress/:id
 *
 * Server-Sent Events (SSE) endpoint for real-time production progress.
 * Subscribes to Redis pub/sub for progress updates.
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

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Dynamic import to avoid bundling issues
      const { getRedisConnection } = await import("@gameview/queue");
      const Redis = (await import("ioredis")).default;

      // Create subscriber connection
      const redisUrl = process.env.REDIS_URL;
      const subscriber = redisUrl
        ? new Redis(redisUrl, { maxRetriesPerRequest: null })
        : new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379", 10),
            maxRetriesPerRequest: null,
          });

      const progressKey = `production:progress:${productionId}`;
      const channel = "production:progress";

      // Send initial progress from Redis
      const connection = getRedisConnection();
      const initialProgress = await connection.get(progressKey);
      if (initialProgress) {
        const data = `data: ${initialProgress}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Subscribe to progress updates
      await subscriber.subscribe(channel);

      subscriber.on("message", (ch: string, message: string) => {
        if (ch !== channel) return;

        try {
          const progress = JSON.parse(message);
          if (progress.productionId === productionId) {
            const data = `data: ${message}\n\n`;
            controller.enqueue(encoder.encode(data));

            // Close stream when completed or failed
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

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        subscriber.unsubscribe(channel);
        subscriber.quit();
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
