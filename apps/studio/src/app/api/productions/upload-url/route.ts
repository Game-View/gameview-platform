import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { createServerClient } from "@/lib/supabase";

/**
 * POST /api/productions/upload-url
 *
 * Generate a signed upload URL for direct browser-to-Supabase uploads.
 * This bypasses Vercel's 4.5MB body size limit for serverless functions.
 */

const BUCKET_NAME = "production-videos";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Generate unique path
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${userId}/pending/${timestamp}_${safeName}`;

    // Create signed upload URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error("[Upload URL] Error:", error);

      // Try to create bucket if it doesn't exist
      if (error.message.includes("Bucket not found")) {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: false,
          fileSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
        });

        // Retry
        const { data: retryData, error: retryError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUploadUrl(storagePath);

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          uploadUrl: retryData.signedUrl,
          token: retryData.token,
          path: storagePath,
        });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
    });
  } catch (error) {
    console.error("[Upload URL] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
