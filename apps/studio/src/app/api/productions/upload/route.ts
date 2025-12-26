import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { createServerClient } from "@/lib/supabase";

/**
 * POST /api/productions/upload
 *
 * Upload video files to Supabase Storage for production processing.
 * Supports chunked uploads for large files.
 *
 * Request body (multipart/form-data):
 * - file: Video file (MP4, MOV, AVI, WebM)
 * - productionId: Optional production ID to associate with
 *
 * Returns:
 * - url: Signed URL for the uploaded file
 * - filename: Original filename
 * - size: File size in bytes
 * - path: Storage path
 */

// Supported video formats
const SUPPORTED_FORMATS = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/webm",
];

// Max file size: 2GB
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

// Storage bucket for production videos
const BUCKET_NAME = "production-videos";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productionId = formData.get("productionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file format: ${file.type}. Supported: MP4, MOV, AVI, WebM`,
        },
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

    // Create Supabase client
    const supabase = createServerClient();

    // Generate unique path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = productionId
      ? `${userId}/${productionId}/${timestamp}_${safeName}`
      : `${userId}/pending/${timestamp}_${safeName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[Upload] Supabase error:", error);

      // Handle bucket not found
      if (error.message.includes("Bucket not found")) {
        // Try to create the bucket
        const { error: createError } = await supabase.storage.createBucket(
          BUCKET_NAME,
          {
            public: false,
            fileSizeLimit: MAX_FILE_SIZE,
            allowedMimeTypes: SUPPORTED_FORMATS,
          }
        );

        if (createError) {
          console.error("[Upload] Failed to create bucket:", createError);
          return NextResponse.json(
            { error: "Storage not configured. Please contact support." },
            { status: 500 }
          );
        }

        // Retry upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, buffer, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (retryError) {
          return NextResponse.json(
            { error: `Upload failed: ${retryError.message}` },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Upload failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Get signed URL for the uploaded file (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600);

    if (urlError) {
      console.error("[Upload] Failed to create signed URL:", urlError);
      return NextResponse.json(
        { error: "Upload succeeded but failed to generate URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urlData.signedUrl,
      filename: file.name,
      size: file.size,
      path: storagePath,
      contentType: file.type,
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/productions/upload
 *
 * Delete an uploaded video file.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "path parameter is required" },
        { status: 400 }
      );
    }

    // Verify user owns this file
    if (!path.startsWith(`${userId}/`)) {
      return NextResponse.json(
        { error: "Not authorized to delete this file" },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error("[Upload] Delete error:", error);
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Upload] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
