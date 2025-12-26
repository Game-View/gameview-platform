import { Queue, QueueEvents, Job } from "bullmq";
import { getRedisConnection, createNewConnection } from "./connection";

/**
 * Production Queue - Video to 3D processing pipeline
 *
 * Stages:
 * 1. Download: Fetch source videos from storage
 * 2. FrameExtraction: Extract frames using FFmpeg (0-20%)
 * 3. COLMAP: Structure from Motion reconstruction (20-40%)
 * 4. Brush: Gaussian Splat training (40-90%)
 * 5. Upload: Upload outputs to storage (90-95%)
 * 6. Finalize: Update database and notify (95-100%)
 */

export const QUEUE_NAME = "production";

// Production job data
export interface ProductionJobData {
  productionId: string;
  experienceId: string;
  creatorId: string;

  // Source videos (URLs from Supabase Storage)
  sourceVideos: {
    url: string;
    filename: string;
    size: number;
  }[];

  // Processing settings
  preset: "fast" | "balanced" | "high";
  settings: {
    totalSteps: number;
    maxSplats: number;
    imagePercentage: number;
    fps: number;
    duration: number;
  };

  // Output paths (set after processing)
  outputPlyUrl?: string;
  outputCamerasUrl?: string;
  outputThumbnail?: string;
  outputPreview?: string;
}

// Progress update event
export interface ProductionProgress {
  productionId: string;
  stage: ProductionStage;
  progress: number; // 0-100
  message: string;
  timestamp: Date;
}

export type ProductionStage =
  | "queued"
  | "downloading"
  | "frame_extraction"
  | "colmap"
  | "brush"
  | "uploading"
  | "finalizing"
  | "completed"
  | "failed";

// Job result
export interface ProductionResult {
  success: boolean;
  productionId: string;
  outputs?: {
    plyUrl: string;
    camerasUrl: string;
    thumbnailUrl: string;
    previewUrl?: string;
    processingTimeSeconds: number;
  };
  error?: string;
}

// Quality presets (matching gvcore-cli)
export const QUALITY_PRESETS = {
  fast: {
    totalSteps: 5000,
    maxSplats: 5000000,
    imagePercentage: 30,
    fps: 5,
    duration: 5,
  },
  balanced: {
    totalSteps: 15000,
    maxSplats: 10000000,
    imagePercentage: 50,
    fps: 10,
    duration: 10,
  },
  high: {
    totalSteps: 30000,
    maxSplats: 20000000,
    imagePercentage: 75,
    fps: 15,
    duration: 15,
  },
} as const;

// Create the production queue
let productionQueue: Queue<ProductionJobData, ProductionResult> | null = null;

export function getProductionQueue(): Queue<ProductionJobData, ProductionResult> {
  if (!productionQueue) {
    productionQueue = new Queue<ProductionJobData, ProductionResult>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 30000, // 30 seconds initial delay
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });
  }
  return productionQueue;
}

// Queue events for monitoring
let queueEvents: QueueEvents | null = null;

export function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: createNewConnection(),
    });
  }
  return queueEvents;
}

/**
 * Add a production job to the queue
 */
export async function addProductionJob(
  data: Omit<ProductionJobData, "settings"> & { preset: ProductionJobData["preset"] }
): Promise<Job<ProductionJobData, ProductionResult>> {
  const queue = getProductionQueue();

  // Apply preset settings
  const settings = QUALITY_PRESETS[data.preset];

  const jobData: ProductionJobData = {
    ...data,
    settings,
  };

  const job = await queue.add(data.productionId, jobData, {
    jobId: data.productionId,
    priority: data.preset === "high" ? 1 : data.preset === "balanced" ? 2 : 3,
  });

  console.log(`[Queue] Added production job: ${job.id}`);
  return job;
}

/**
 * Get job by production ID
 */
export async function getProductionJob(
  productionId: string
): Promise<Job<ProductionJobData, ProductionResult> | undefined> {
  const queue = getProductionQueue();
  return queue.getJob(productionId);
}

/**
 * Cancel a production job
 */
export async function cancelProductionJob(productionId: string): Promise<boolean> {
  const job = await getProductionJob(productionId);
  if (!job) return false;

  const state = await job.getState();
  if (state === "active") {
    // Can't cancel active jobs directly, need to signal worker
    await job.updateData({ ...job.data, cancelled: true } as ProductionJobData);
    return true;
  } else if (state === "waiting" || state === "delayed") {
    await job.remove();
    return true;
  }

  return false;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const queue = getProductionQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  };
}

/**
 * Clean up old jobs
 */
export async function cleanQueue(): Promise<void> {
  const queue = getProductionQueue();
  await queue.clean(24 * 3600 * 1000, 100, "completed"); // 24 hours
  await queue.clean(7 * 24 * 3600 * 1000, 50, "failed"); // 7 days
}
