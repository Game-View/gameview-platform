import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSceneById, updateProcessingStatus, updateScene, type ProcessingStatus } from "@/lib/scenes";

// Processing stages with their progress ranges
const PROCESSING_STAGES: { status: ProcessingStatus; startProgress: number; endProgress: number; duration: number }[] = [
  { status: "frame_extraction", startProgress: 0, endProgress: 20, duration: 3000 },
  { status: "colmap", startProgress: 20, endProgress: 40, duration: 5000 },
  { status: "brush", startProgress: 40, endProgress: 90, duration: 8000 },
  { status: "metadata", startProgress: 90, endProgress: 100, duration: 2000 },
];

// Simulated processing (will be replaced with actual CLI integration)
async function simulateProcessing(sceneId: string, userId: string): Promise<void> {
  // Update to processing status
  await updateProcessingStatus(sceneId, userId, "processing", 0, "Initializing processing pipeline...");

  // Simulate each stage
  for (const stage of PROCESSING_STAGES) {
    await updateProcessingStatus(
      sceneId,
      userId,
      stage.status,
      stage.startProgress,
      getStageMessage(stage.status, "starting")
    );

    // Simulate progress within stage
    const steps = 5;
    const progressStep = (stage.endProgress - stage.startProgress) / steps;
    const timeStep = stage.duration / steps;

    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, timeStep));
      const progress = Math.round(stage.startProgress + progressStep * i);
      await updateProcessingStatus(
        sceneId,
        userId,
        stage.status,
        progress,
        getStageMessage(stage.status, "progress", i, steps)
      );
    }
  }

  // Mark as completed with placeholder outputs
  await updateScene(sceneId, userId, {
    processingStatus: "completed",
    processingProgress: 100,
    processingMessage: "Processing complete!",
    processingCompletedAt: new Date().toISOString(),
    // Placeholder URLs (will be real URLs when CLI is integrated)
    splatUrl: `/api/placeholder/scene.ply`,
    thumbnailUrl: `/api/placeholder/thumbnail.jpg`,
    metadataUrl: `/api/placeholder/metadata.json`,
    outputSize: 125000000, // 125MB placeholder
    cameraPosition: { x: 0, y: 2, z: 5 },
    cameraTarget: { x: 0, y: 0, z: 0 },
  });
}

function getStageMessage(status: ProcessingStatus, phase: "starting" | "progress", step?: number, total?: number): string {
  const messages: Record<ProcessingStatus, { starting: string; progress: string }> = {
    pending: { starting: "Waiting...", progress: "Waiting..." },
    uploading: { starting: "Uploading videos...", progress: "Uploading videos..." },
    processing: { starting: "Initializing...", progress: "Initializing..." },
    frame_extraction: {
      starting: "Starting frame extraction...",
      progress: `Extracting frames (${step}/${total})...`,
    },
    colmap: {
      starting: "Starting 3D reconstruction...",
      progress: `Building 3D structure (${step}/${total})...`,
    },
    brush: {
      starting: "Starting Gaussian Splat training...",
      progress: `Training 3D model (${step}/${total})...`,
    },
    metadata: {
      starting: "Generating preview...",
      progress: `Creating thumbnail and metadata (${step}/${total})...`,
    },
    completed: { starting: "Complete!", progress: "Complete!" },
    failed: { starting: "Failed", progress: "Failed" },
  };

  return messages[status][phase];
}

// POST /api/processing - Start processing a scene
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sceneId, preset = "Balanced" } = body;

    if (!sceneId) {
      return NextResponse.json({ error: "sceneId is required" }, { status: 400 });
    }

    // Verify scene exists and user owns it
    const scene = await getSceneById(sceneId, userId);
    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    // Check if already processing
    if (scene.processingStatus === "processing" ||
        scene.processingStatus === "frame_extraction" ||
        scene.processingStatus === "colmap" ||
        scene.processingStatus === "brush" ||
        scene.processingStatus === "metadata") {
      return NextResponse.json(
        { error: "Scene is already being processed" },
        { status: 400 }
      );
    }

    // Check if scene has videos
    if (!scene.videoFiles || scene.videoFiles.length === 0) {
      return NextResponse.json(
        { error: "Scene has no videos to process" },
        { status: 400 }
      );
    }

    // Start processing (non-blocking)
    // In production, this would spawn the CLI process
    // For now, we simulate it
    simulateProcessing(sceneId, userId).catch((error) => {
      console.error("Processing failed:", error);
      updateProcessingStatus(
        sceneId,
        userId,
        "failed",
        0,
        "Processing failed",
        error.message
      );
    });

    return NextResponse.json({
      success: true,
      message: "Processing started",
      sceneId,
      preset,
    });
  } catch (error) {
    console.error("Failed to start processing:", error);
    return NextResponse.json(
      { error: "Failed to start processing" },
      { status: 500 }
    );
  }
}

// GET /api/processing?sceneId=xxx - Get processing status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get("sceneId");

    if (!sceneId) {
      return NextResponse.json({ error: "sceneId is required" }, { status: 400 });
    }

    const scene = await getSceneById(sceneId, userId);
    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    return NextResponse.json({
      sceneId: scene.id,
      status: scene.processingStatus,
      progress: scene.processingProgress,
      message: scene.processingMessage,
      startedAt: scene.processingStartedAt,
      completedAt: scene.processingCompletedAt,
      error: scene.processingError,
      outputs: scene.processingStatus === "completed" ? {
        splatUrl: scene.splatUrl,
        thumbnailUrl: scene.thumbnailUrl,
        metadataUrl: scene.metadataUrl,
        outputSize: scene.outputSize,
      } : null,
    });
  } catch (error) {
    console.error("Failed to get processing status:", error);
    return NextResponse.json(
      { error: "Failed to get processing status" },
      { status: 500 }
    );
  }
}
