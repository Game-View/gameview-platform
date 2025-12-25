import { auth } from "@/lib/auth-server";
import { createClaudeClient, CLAUDE_MODEL } from "@/lib/claude";
import type { ExperienceType } from "@gameview/types";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ExtractBriefRequest {
  messages: ChatMessage[];
}

export interface ExtractedBrief {
  // Basic Info
  name: string | null;
  tagline: string | null;
  experienceType: ExperienceType | null;

  // Overview
  concept: string | null;
  targetAudience: string | null;
  duration: string | null;
  difficulty: "easy" | "medium" | "hard" | "progressive" | null;
  playerMode: "single" | "multiplayer" | "competitive" | null;

  // Setting & Story
  setting: string | null;
  narrative: string | null;

  // Interactive Elements
  interactiveElements: string[];
  collectibles: string | null;
  winCondition: string | null;

  // Content & Technical
  contentStatus: "has_content" | "needs_capture" | "needs_guidance" | null;
  contentDescription: string | null;
  estimatedScenes: number | null;

  // Progress
  completeness: number; // 0-100
  missingElements: string[];
  suggestedNextQuestions: string[];
}

const EXTRACTION_PROMPT = `Analyze the conversation between a creator and Spark (an AI assistant) and extract a structured project brief.

Return a JSON object with the following structure. Use null for fields not yet discussed. Be accurate - only include information explicitly shared by the creator.

{
  "name": "Project name if mentioned, or a suggested name based on the concept",
  "tagline": "A catchy one-liner describing the experience",
  "experienceType": "treasure_hunt" | "virtual_tour" | "interactive_story" | "competition" | "brand_experience" | null,

  "concept": "Brief description of the core idea/vision",
  "targetAudience": "Who this experience is for",
  "duration": "Expected experience duration (e.g., '30 minutes', '1-2 hours')",
  "difficulty": "easy" | "medium" | "hard" | "progressive" | null,
  "playerMode": "single" | "multiplayer" | "competitive" | null,

  "setting": "Where the experience takes place (venue, location type)",
  "narrative": "The story or theme tying the experience together",

  "interactiveElements": ["Array of interactive features mentioned"],
  "collectibles": "What users collect or discover",
  "winCondition": "How users complete or win the experience",

  "contentStatus": "has_content" | "needs_capture" | "needs_guidance" | null,
  "contentDescription": "What 360° content they have or need",
  "estimatedScenes": number or null,

  "completeness": 0-100 (percentage of key brief elements defined),
  "missingElements": ["Array of important elements not yet discussed"],
  "suggestedNextQuestions": ["2-3 questions Spark should ask next to complete the brief"]
}

Important:
- Only extract information explicitly stated by the creator
- For completeness, consider: concept, audience, setting, experience type, and interactive elements as key elements
- Suggest practical next questions that would help complete the brief
- Return ONLY the JSON, no other text`;

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

    // Parse request
    const body: ExtractBriefRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format conversation for extraction
    const conversationText = messages
      .map((msg) => `${msg.role === "user" ? "Creator" : "Spark"}: ${msg.content}`)
      .join("\n\n");

    // Create Claude client
    const claude = createClaudeClient();

    // Extract brief using Claude
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\n---\n\nConversation:\n\n${conversationText}`,
        },
      ],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const extractedBrief: ExtractedBrief = JSON.parse(jsonText);

    return new Response(JSON.stringify(extractedBrief), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Brief extraction error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to extract brief",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
