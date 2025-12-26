import { Worker, Job } from "bullmq";
import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { createNewConnection } from "./connection";
import {
  QUEUE_NAME,
  ProductionJobData,
  ProductionResult,
  ProductionStage,
  ProductionProgress,
} from "./production-queue";

/**
 * Production Worker
 *
 * Processes video-to-3D jobs using gvcore-cli.
 * Updates progress in Redis for real-time SSE streaming.
 */

// gvcore-cli path (configurable via env)
const GVCORE_CLI = process.env.GVCORE_CLI_PATH || "/usr/local/bin/gvcore-cli";
const BRUSH_PATH = process.env.BRUSH_PATH || "/opt/brush";
const WORK_DIR = process.env.WORK_DIR || "/tmp/gv-processing";

// Redis key for progress updates
const PROGRESS_KEY_PREFIX = "production:progress:";
const PROGRESS_CHANNEL = "production:progress";

interface WorkerContext {
  job: Job<ProductionJobData, ProductionResult>;
  workDir: string;
  connection: ReturnType<typeof createNewConnection>;
}

/**
 * Update production progress
 */
async function updateProgress(
  ctx: WorkerContext,
  stage: ProductionStage,
  progress: number,
  message: string
): Promise<void> {
  const progressData: ProductionProgress = {
    productionId: ctx.job.data.productionId,
    stage,
    progress,
    message,
    timestamp: new Date(),
  };

  // Store in Redis for polling
  await ctx.connection.set(
    `${PROGRESS_KEY_PREFIX}${ctx.job.data.productionId}`,
    JSON.stringify(progressData),
    "EX",
    3600 // Expire after 1 hour
  );

  // Publish for real-time SSE
  await ctx.connection.publish(PROGRESS_CHANNEL, JSON.stringify(progressData));

  // Update job progress
  await ctx.job.updateProgress(progress);

  console.log(
    `[Worker] ${ctx.job.data.productionId}: ${stage} ${progress}% - ${message}`
  );
}

/**
 * Download videos from Supabase storage
 */
async function downloadVideos(ctx: WorkerContext): Promise<string[]> {
  await updateProgress(ctx, "downloading", 0, "Starting video downloads...");

  const inputDir = path.join(ctx.workDir, "input");
  await fs.mkdir(inputDir, { recursive: true });

  const localPaths: string[] = [];
  const videos = ctx.job.data.sourceVideos;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const progress = Math.round(((i + 1) / videos.length) * 5); // 0-5%

    await updateProgress(
      ctx,
      "downloading",
      progress,
      `Downloading ${video.filename} (${i + 1}/${videos.length})...`
    );

    const localPath = path.join(inputDir, video.filename);

    // Download from URL
    const response = await fetch(video.url);
    if (!response.ok) {
      throw new Error(`Failed to download ${video.filename}: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(localPath, buffer);

    localPaths.push(localPath);
  }

  await updateProgress(ctx, "downloading", 5, "All videos downloaded");
  return localPaths;
}

/**
 * Run gvcore-cli processing
 */
async function runGvcoreCli(
  ctx: WorkerContext,
  inputPaths: string[]
): Promise<{
  plyPath: string;
  camerasPath: string;
  thumbnailPath: string;
}> {
  const outputDir = path.join(ctx.workDir, "output");
  await fs.mkdir(outputDir, { recursive: true });

  const { settings } = ctx.job.data;

  // Build CLI arguments
  const args = [
    "run",
    ...inputPaths.flatMap((p) => ["--input", p]),
    "--output",
    outputDir,
    "--brush-path",
    BRUSH_PATH,
    "--steps",
    settings.totalSteps.toString(),
    "--max-splats",
    settings.maxSplats.toString(),
    "--image-percent",
    settings.imagePercentage.toString(),
    "--fps",
    settings.fps.toString(),
    "--duration",
    settings.duration.toString(),
    "--progress-format",
    "json",
  ];

  return new Promise((resolve, reject) => {
    const process = spawn(GVCORE_CLI, args, {
      cwd: ctx.workDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    process.stdout.on("data", async (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const progress = JSON.parse(line);

          // Map gvcore stages to our stages
          const stageMap: Record<string, ProductionStage> = {
            frame_extraction: "frame_extraction",
            colmap: "colmap",
            brush: "brush",
            metadata: "finalizing",
          };

          const stage = stageMap[progress.stage] || "brush";
          const percent = Math.round(5 + progress.progress * 0.85); // 5-90%

          await updateProgress(ctx, stage, percent, progress.message || "Processing...");
        } catch {
          // Not JSON, log as debug info
          console.log(`[gvcore] ${line}`);
        }
      }
    });

    process.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`gvcore-cli exited with code ${code}: ${stderr}`));
        return;
      }

      resolve({
        plyPath: path.join(outputDir, "scene.ply"),
        camerasPath: path.join(outputDir, "cameras.json"),
        thumbnailPath: path.join(outputDir, "thumbnail.jpg"),
      });
    });

    process.on("error", (err) => {
      reject(new Error(`Failed to spawn gvcore-cli: ${err.message}`));
    });
  });
}

/**
 * Upload outputs to Supabase storage
 */
async function uploadOutputs(
  ctx: WorkerContext,
  outputs: { plyPath: string; camerasPath: string; thumbnailPath: string }
): Promise<{
  plyUrl: string;
  camerasUrl: string;
  thumbnailUrl: string;
}> {
  await updateProgress(ctx, "uploading", 90, "Uploading outputs to storage...");

  const { productionId } = ctx.job.data;

  // In production, upload to Supabase storage
  // For now, simulate with placeholder URLs
  const baseUrl = process.env.SUPABASE_STORAGE_URL || "https://storage.supabase.co";
  const bucket = "productions";

  // Read and upload each file
  const uploadFile = async (localPath: string, remoteName: string): Promise<string> => {
    const exists = await fs
      .access(localPath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      console.warn(`[Worker] Output file not found: ${localPath}`);
      return `${baseUrl}/${bucket}/${productionId}/${remoteName}`;
    }

    // TODO: Implement actual Supabase upload
    // const buffer = await fs.readFile(localPath);
    // const supabase = createServerClient();
    // const { data, error } = await supabase.storage
    //   .from(bucket)
    //   .upload(`${productionId}/${remoteName}`, buffer);

    return `${baseUrl}/${bucket}/${productionId}/${remoteName}`;
  };

  const [plyUrl, camerasUrl, thumbnailUrl] = await Promise.all([
    uploadFile(outputs.plyPath, "scene.ply"),
    uploadFile(outputs.camerasPath, "cameras.json"),
    uploadFile(outputs.thumbnailPath, "thumbnail.jpg"),
  ]);

  await updateProgress(ctx, "uploading", 95, "Outputs uploaded");

  return { plyUrl, camerasUrl, thumbnailUrl };
}

/**
 * Cleanup work directory
 */
async function cleanup(workDir: string): Promise<void> {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[Worker] Failed to cleanup ${workDir}:`, err);
  }
}

/**
 * Process a production job
 */
async function processJob(
  job: Job<ProductionJobData, ProductionResult>
): Promise<ProductionResult> {
  const connection = createNewConnection();
  const workDir = path.join(WORK_DIR, job.data.productionId);

  const ctx: WorkerContext = { job, workDir, connection };

  try {
    await fs.mkdir(workDir, { recursive: true });

    await updateProgress(ctx, "queued", 0, "Starting production...");

    // Step 1: Download videos
    const inputPaths = await downloadVideos(ctx);

    // Step 2: Run gvcore-cli processing
    const outputs = await runGvcoreCli(ctx, inputPaths);

    // Step 3: Upload outputs
    const urls = await uploadOutputs(ctx, outputs);

    // Step 4: Finalize
    await updateProgress(ctx, "finalizing", 98, "Updating database...");

    // TODO: Update database with output URLs
    // await db.processingJob.update({
    //   where: { id: job.data.productionId },
    //   data: {
    //     status: "COMPLETED",
    //     outputPlyUrl: urls.plyUrl,
    //     outputCamerasUrl: urls.camerasUrl,
    //     outputThumbnail: urls.thumbnailUrl,
    //     completedAt: new Date(),
    //   },
    // });

    await updateProgress(ctx, "completed", 100, "Production complete!");

    const result: ProductionResult = {
      success: true,
      productionId: job.data.productionId,
      outputs: {
        plyUrl: urls.plyUrl,
        camerasUrl: urls.camerasUrl,
        thumbnailUrl: urls.thumbnailUrl,
        processingTimeSeconds: Math.floor(
          (Date.now() - job.timestamp) / 1000
        ),
      },
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await updateProgress(ctx, "failed", 0, `Failed: ${errorMessage}`);

    // TODO: Update database with error
    // await db.processingJob.update({
    //   where: { id: job.data.productionId },
    //   data: {
    //     status: "FAILED",
    //     errorMessage,
    //   },
    // });

    throw error;
  } finally {
    await connection.quit();
    await cleanup(workDir);
  }
}

/**
 * Create and start the worker
 */
export function createWorker(): Worker<ProductionJobData, ProductionResult> {
  const worker = new Worker<ProductionJobData, ProductionResult>(
    QUEUE_NAME,
    processJob,
    {
      connection: createNewConnection(),
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || "1", 10),
      limiter: {
        max: 2,
        duration: 60000, // 2 jobs per minute max
      },
    }
  );

  worker.on("completed", (job, result) => {
    console.log(`[Worker] Job ${job.id} completed:`, result.success);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Error:", err);
  });

  console.log("[Worker] Production worker started");

  return worker;
}

// Run worker if executed directly
if (require.main === module) {
  const worker = createWorker();

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("[Worker] Shutting down...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[Worker] Shutting down...");
    await worker.close();
    process.exit(0);
  });
}
