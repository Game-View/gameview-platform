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
 * Uses direct Supabase upload to bypass Vercel's 4.5MB limit
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    button:disabled { background: #666; cursor: not-allowed; }
    .note { color: #888; font-size: 14px; }
    #result { margin-top: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px; display: none; }
    #result.success { border: 1px solid #22c55e; }
    #result.error { border: 1px solid #ef4444; }
    #result.uploading { border: 1px solid #22d3ee; }
    a { color: #22d3ee; }
    .progress { margin-top: 10px; }
    .progress-bar { width: 100%; height: 20px; background: #333; border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; background: #22d3ee; transition: width 0.3s; }
  </style>
</head>
<body>
  <h1>Import Desktop Render</h1>
  <p class="note">Upload your PLY file from GameViewer desktop to test in the web player. Supports files up to 500MB.</p>

  <form id="importForm">
    <div>
      <label for="title">Title</label>
      <input type="text" id="title" name="title" value="Desktop Import Test" required>
    </div>

    <div>
      <label for="plyFile">PLY File (required)</label>
      <input type="file" id="plyFile" name="plyFile" accept=".ply" required>
      <p class="note" id="fileSize"></p>
    </div>

    <div>
      <label for="configFile">Config JSON (optional)</label>
      <input type="file" id="configFile" name="configFile" accept=".json">
    </div>

    <button type="submit" id="submitBtn">Upload & Import</button>
  </form>

  <div id="result"></div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script>
    const SUPABASE_URL = '${supabaseUrl}';
    const SUPABASE_ANON_KEY = '${supabaseAnonKey}';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Show file size when selected
    document.getElementById('plyFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        document.getElementById('fileSize').textContent = 'Size: ' + sizeMB + ' MB';
      }
    });

    document.getElementById('importForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitBtn');
      const resultDiv = document.getElementById('result');
      const title = document.getElementById('title').value;
      const plyFile = document.getElementById('plyFile').files[0];
      const configFile = document.getElementById('configFile').files[0];

      if (!plyFile) {
        alert('Please select a PLY file');
        return;
      }

      submitBtn.disabled = true;
      resultDiv.style.display = 'block';
      resultDiv.className = 'uploading';
      resultDiv.innerHTML = '<p>Uploading PLY file directly to storage...</p><div class="progress"><div class="progress-bar"><div class="progress-fill" id="progressFill" style="width: 0%"></div></div><p id="progressText">0%</p></div>';

      try {
        const importId = 'import-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const bucket = 'production-outputs';

        // Upload PLY file directly to Supabase
        const { error: plyError } = await supabase.storage
          .from(bucket)
          .upload(importId + '/scene.ply', plyFile, {
            contentType: 'application/octet-stream',
            upsert: true
          });

        if (plyError) throw new Error('PLY upload failed: ' + plyError.message);

        document.getElementById('progressFill').style.width = '70%';
        document.getElementById('progressText').textContent = '70% - PLY uploaded, creating experience...';

        const plyUrl = SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + importId + '/scene.ply';

        // Upload config if provided
        let camerasJson = null;
        if (configFile) {
          const { error: configError } = await supabase.storage
            .from(bucket)
            .upload(importId + '/cameras.json', configFile, {
              contentType: 'application/json',
              upsert: true
            });
          if (!configError) {
            camerasJson = SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + importId + '/cameras.json';
          }
        }

        document.getElementById('progressFill').style.width = '85%';
        document.getElementById('progressText').textContent = '85% - Creating experience record...';

        // Create experience via API (just metadata, no file upload)
        const res = await fetch('/api/import/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, plyUrl, camerasJson })
        });
        const data = await res.json();

        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressText').textContent = '100%';

        if (data.success) {
          resultDiv.className = 'success';
          resultDiv.innerHTML = \`
            <h3>Import Successful!</h3>
            <p>Experience ID: \${data.experienceId}</p>
            <p><a href="\${data.viewerUrl}" target="_blank">Open in Studio Viewer</a></p>
            <p><a href="\${data.playerUrl}" target="_blank">Open in Player</a></p>
          \`;
        } else {
          throw new Error(data.error || 'Failed to create experience');
        }
      } catch (err) {
        resultDiv.className = 'error';
        resultDiv.innerHTML = '<h3>Error</h3><p>' + err.message + '</p>';
      } finally {
        submitBtn.disabled = false;
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
