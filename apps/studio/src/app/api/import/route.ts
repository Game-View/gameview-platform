import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@gameview/database";
import { createClient } from "@supabase/supabase-js";

/**
 * Import pre-rendered 3D content (PLY files from desktop app)
 *
 * POST /api/import
 * Content-Type: multipart/form-data
 *
 * Fields:
 * - plyFile: The .ply file
 * - configFile: Optional .json config file
 * - title: Experience title
 * - description: Optional description
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create the user
    let user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // User doesn't exist in DB, create them
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: "Could not get user info" }, { status: 401 });
      }

      user = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@temp.local`,
          displayName: clerkUser.firstName || "User",
        },
      });
      console.log(`[Import] Created new user: ${user.id}`);
    }

    // Get or create Creator for this user (Experience requires a Creator)
    let creator = await db.creator.findUnique({
      where: { userId: user.id },
    });

    if (!creator) {
      creator = await db.creator.create({
        data: {
          userId: user.id,
          username: `creator_${user.id.slice(-8)}`,
          displayName: user.displayName,
        },
      });
      console.log(`[Import] Created new creator: ${creator.id}`);
    }

    // Parse form data
    const formData = await request.formData();
    const plyFile = formData.get("plyFile") as File | null;
    const configFile = formData.get("configFile") as File | null;
    const title = formData.get("title") as string || "Imported Experience";
    const description = formData.get("description") as string || "";

    if (!plyFile) {
      return NextResponse.json({ error: "PLY file is required" }, { status: 400 });
    }

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a unique ID for this import
    const importId = `import-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const bucket = "production-outputs";

    // Upload PLY file
    const plyBuffer = await plyFile.arrayBuffer();
    const { error: plyError } = await supabase.storage
      .from(bucket)
      .upload(`${importId}/scene.ply`, plyBuffer, {
        contentType: "application/octet-stream",
        upsert: true,
      });

    if (plyError) {
      console.error("PLY upload error:", plyError);
      return NextResponse.json({ error: "Failed to upload PLY file" }, { status: 500 });
    }

    const plyUrl = supabase.storage.from(bucket).getPublicUrl(`${importId}/scene.ply`).data.publicUrl;

    // Upload config file if provided
    let camerasJson: string | null = null;
    if (configFile) {
      const configBuffer = await configFile.arrayBuffer();
      const { error: configError } = await supabase.storage
        .from(bucket)
        .upload(`${importId}/cameras.json`, configBuffer, {
          contentType: "application/json",
          upsert: true,
        });

      if (!configError) {
        camerasJson = supabase.storage.from(bucket).getPublicUrl(`${importId}/cameras.json`).data.publicUrl;
      }
    }

    // Create Experience record
    const experience = await db.experience.create({
      data: {
        title,
        description,
        status: "PUBLISHED",
        plyUrl,
        camerasJson,
        thumbnailUrl: null,
        creatorId: creator.id,
        // Required fields with defaults
        category: "ENTERTAINMENT",
        subcategory: "General",
        tags: ["imported", "desktop"],
        duration: 0,
      },
    });

    console.log(`[Import] Created experience ${experience.id} with PLY from desktop`);

    return NextResponse.json({
      success: true,
      experienceId: experience.id,
      plyUrl,
      camerasJson,
      viewerUrl: `/viewer/${experience.id}`,
      playerUrl: `https://gvdw-player.vercel.app/experience/${experience.id}/play`,
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/import - Returns a simple upload form for testing
 */
export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Import Desktop Render</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; background: #1a1a1a; color: #fff; }
    h1 { color: #22d3ee; }
    form { display: flex; flex-direction: column; gap: 15px; }
    label { font-weight: bold; }
    input, button { padding: 10px; border-radius: 8px; border: 1px solid #333; background: #2a2a2a; color: #fff; }
    input[type="file"] { cursor: pointer; }
    button { background: #22d3ee; color: #000; font-weight: bold; cursor: pointer; }
    button:hover { background: #06b6d4; }
    .note { color: #888; font-size: 14px; }
    #result { margin-top: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px; display: none; }
    #result.success { border: 1px solid #22c55e; }
    #result.error { border: 1px solid #ef4444; }
    a { color: #22d3ee; }
  </style>
</head>
<body>
  <h1>Import Desktop Render</h1>
  <p class="note">Upload your PLY file from GameViewer desktop to test in the web player.</p>

  <form id="importForm" enctype="multipart/form-data">
    <div>
      <label for="title">Title</label>
      <input type="text" id="title" name="title" value="Desktop Import Test" required>
    </div>

    <div>
      <label for="plyFile">PLY File (required)</label>
      <input type="file" id="plyFile" name="plyFile" accept=".ply" required>
    </div>

    <div>
      <label for="configFile">Config JSON (optional)</label>
      <input type="file" id="configFile" name="configFile" accept=".json">
    </div>

    <button type="submit">Upload & Import</button>
  </form>

  <div id="result"></div>

  <script>
    document.getElementById('importForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const resultDiv = document.getElementById('result');

      resultDiv.style.display = 'block';
      resultDiv.className = '';
      resultDiv.innerHTML = 'Uploading...';

      try {
        const res = await fetch('/api/import', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
          resultDiv.className = 'success';
          resultDiv.innerHTML = \`
            <h3>Import Successful!</h3>
            <p>Experience ID: \${data.experienceId}</p>
            <p><a href="\${data.viewerUrl}" target="_blank">Open in Studio Viewer</a></p>
            <p><a href="\${data.playerUrl}" target="_blank">Open in Player</a></p>
          \`;
        } else {
          resultDiv.className = 'error';
          resultDiv.innerHTML = '<h3>Error</h3><p>' + data.error + '</p>';
        }
      } catch (err) {
        resultDiv.className = 'error';
        resultDiv.innerHTML = '<h3>Error</h3><p>' + err.message + '</p>';
      }
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
