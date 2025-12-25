import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { getSceneById, addVideoToScene, updateProcessingStatus } from "@/lib/scenes";

// Supported video formats
const SUPPORTED_FORMATS = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/webm",
];

// Max file size: 2GB
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

// POST /api/upload - Upload video file to a scene
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const sceneId = formData.get("sceneId") as string;
    const file = formData.get("file") as File;

    if (!sceneId) {
      return NextResponse.json({ error: "sceneId is required" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file format. Supported: MP4, MOV, AVI, WebM` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2GB" },
        { status: 400 }
      );
    }

    // Verify scene exists and user owns it
    const scene = await getSceneById(sceneId, userId);
    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    // Update status to uploading
    await updateProcessingStatus(sceneId, userId, "uploading", 0, "Uploading video...");

    // In production, upload to cloud storage (S3, Supabase Storage, etc.)
    // For now, we simulate the upload and store metadata
    const videoFile = {
      filename: file.name,
      url: `/uploads/${sceneId}/${file.name}`, // Placeholder URL
      size: file.size,
      duration: undefined, // Would extract from video metadata
      uploadedAt: new Date().toISOString(),
    };

    // Add video to scene
    const updatedScene = await addVideoToScene(sceneId, userId, videoFile);

    // Reset status to pending (ready for processing)
    await updateProcessingStatus(
      sceneId,
      userId,
      "pending",
      0,
      `${updatedScene.videoFiles.length} video(s) ready for processing`
    );

    return NextResponse.json({
      success: true,
      video: videoFile,
      totalVideos: updatedScene.videoFiles.length,
      totalSize: updatedScene.totalVideoSize,
    });
  } catch (error) {
    console.error("Failed to upload video:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Remove a video from a scene
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get("sceneId");
    const filename = searchParams.get("filename");

    if (!sceneId || !filename) {
      return NextResponse.json(
        { error: "sceneId and filename are required" },
        { status: 400 }
      );
    }

    const scene = await getSceneById(sceneId, userId);
    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    // Remove video from list
    const updatedVideos = scene.videoFiles.filter((v) => v.filename !== filename);
    const totalSize = updatedVideos.reduce((sum, v) => sum + v.size, 0);

    // Update scene
    const { updateScene } = await import("@/lib/scenes");
    await updateScene(sceneId, userId, {
      videoFiles: updatedVideos,
      totalVideoSize: totalSize,
    });

    return NextResponse.json({
      success: true,
      remainingVideos: updatedVideos.length,
      totalSize,
    });
  } catch (error) {
    console.error("Failed to remove video:", error);
    return NextResponse.json(
      { error: "Failed to remove video" },
      { status: 500 }
    );
  }
}
