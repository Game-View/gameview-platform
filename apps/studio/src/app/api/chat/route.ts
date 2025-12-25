import { auth, clerkClient } from "@/lib/auth-server";
import { createClaudeClient, CLAUDE_MODEL } from "@/lib/claude";
import { buildSparkSystemPrompt } from "@/lib/spark-prompt";
import type { CreatorType, ExperienceLevel, CreationGoal, FootageStatus } from "@gameview/types";

export const runtime = "nodejs";

// Check if we're in test/mock mode (no Anthropic API key)
const anthropicKey = process.env.ANTHROPIC_API_KEY || "";
const isMockMode = !anthropicKey || anthropicKey === "sk-ant-xxx" || anthropicKey.length < 20;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

// Mock responses for testing Spark without API key
const MOCK_RESPONSES: Record<string, string> = {
  default: `Hey there! 👋 I'm Spark, your AI creative partner for building immersive 360° experiences.

I noticed you're running in **test mode** (no Anthropic API key configured), so I'm responding with pre-written messages. But I can still show you how our conversation flow works!

**Tell me about your idea:**
- What kind of experience are you creating?
- Do you have 360° footage already, or are you planning to capture it?
- What's the main goal - entertainment, education, marketing?

Just type your response and I'll guide you through the creative process! 🎮`,

  treasure_hunt: `A treasure hunt experience - I love it! 🗺️

Here's what I'm imagining for your experience:

**Core Concept:**
- Players explore your 360° environment searching for hidden items
- Each discovery reveals clues leading to the next location
- Build tension with a timer or limited hints

**Key Elements to Consider:**
1. **Theme** - What's the story? Pirates? Mystery mansion? Sci-fi escape?
2. **Difficulty** - How challenging should the puzzles be?
3. **Rewards** - What happens when players find everything?

Want me to help you develop any of these aspects? Or tell me more about your specific vision!`,

  virtual_tour: `A virtual tour is a fantastic choice! 🏛️

I can help you create an engaging guided experience. Here's a framework:

**Tour Structure:**
- **Welcome Scene** - Set the context and tone
- **Key Locations** - 3-5 main points of interest
- **Transitions** - Smooth navigation between scenes
- **Conclusion** - Call to action or memorable ending

**Enhancement Ideas:**
- Add hotspots with additional info
- Include ambient audio for immersion
- Use text overlays for key facts

What location or subject is your tour about? That'll help me tailor my suggestions!`,

  footage: `Great question about footage! 📹

**If you have footage:**
- Upload it directly to Game View
- Our AI will analyze it and suggest interactive elements
- We'll help you identify the best spots for hotspots and navigation

**If you need to capture:**
- 360° cameras like Insta360 or Ricoh Theta work great
- Plan your shots around key interaction points
- We have guides for optimal capture settings

**Pro tip:** Even smartphone panoramas can work for prototyping!

Which situation applies to you?`,

  help: `No problem! Here's what I can help you with:

**Planning Phase:**
- Brainstorm concepts and themes
- Define your target audience
- Plan the user journey

**Design Phase:**
- Suggest interactive elements
- Help structure your scenes
- Create engaging narratives

**Technical Phase:**
- Guide you through the editor
- Optimize for different devices
- Test and refine the experience

What aspect would you like to explore first? 🚀`,
};

function getMockResponse(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";

  if (lastMessage.includes("treasure") || lastMessage.includes("hunt") || lastMessage.includes("find")) {
    return MOCK_RESPONSES.treasure_hunt;
  }
  if (lastMessage.includes("tour") || lastMessage.includes("guide") || lastMessage.includes("showcase")) {
    return MOCK_RESPONSES.virtual_tour;
  }
  if (lastMessage.includes("footage") || lastMessage.includes("video") || lastMessage.includes("camera") || lastMessage.includes("360")) {
    return MOCK_RESPONSES.footage;
  }
  if (lastMessage.includes("help") || lastMessage.includes("what can") || lastMessage.includes("how do")) {
    return MOCK_RESPONSES.help;
  }

  // For first message or unrecognized, use default
  if (messages.length <= 1) {
    return MOCK_RESPONSES.default;
  }

  // Generic follow-up response
  return `That's a great direction! 🎯

Based on what you've shared, here are some next steps:

1. **Define the hook** - What makes players want to explore?
2. **Map the journey** - Plan 3-5 key moments
3. **Add interactivity** - Where should players click, discover, or decide?

When you're ready to build, click **"Generate Brief"** and I'll create a structured plan you can take into the editor.

Want to dive deeper into any of these areas?`;
}

// Simulate streaming by yielding characters with delays
async function* mockStreamResponse(text: string): AsyncGenerator<string> {
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? " " : "");
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
  }
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

    // Mock mode - return pre-written responses for testing
    if (isMockMode) {
      console.log("[Mock Mode] Using pre-written Spark responses");
      const mockResponse = getMockResponse(messages);
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of mockStreamResponse(mockResponse)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (error) {
            console.error("Mock streaming error:", error);
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
    }

    // Production mode - use real Claude API
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
