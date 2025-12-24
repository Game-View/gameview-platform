import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClaudeClient, CLAUDE_MODEL } from "@/lib/claude";
import { buildSparkSystemPrompt } from "@/lib/spark-prompt";
import type { CreatorType, ExperienceLevel, CreationGoal, FootageStatus } from "@gameview/types";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

export async function POST(request: Request) {
  try {
    // Authenticate
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user profile from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.unsafeMetadata as {
      creatorType?: CreatorType;
      experienceLevel?: ExperienceLevel;
      creationGoals?: CreationGoal[];
      footageStatus?: FootageStatus;
    } | undefined;

    // Parse request
    const body: ChatRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build personalized system prompt
    const systemPrompt = buildSparkSystemPrompt({
      firstName: user.firstName || undefined,
      creatorType: metadata?.creatorType,
      experienceLevel: metadata?.experienceLevel,
      creationGoals: metadata?.creationGoals,
      footageStatus: metadata?.footageStatus,
    });

    // Create Claude client and stream response
    const claude = createClaudeClient();

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Create streaming response
    const stream = await claude.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Create a ReadableStream to send chunks
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = event.delta.text;
              // Send as Server-Sent Events format
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
          }
          // Send done signal
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
