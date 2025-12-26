/**
 * @gameview/queue
 *
 * BullMQ job queue for Game View production pipeline.
 *
 * Usage:
 * - Import queue functions to add jobs
 * - Run worker with: pnpm --filter @gameview/queue worker
 *
 * Environment variables:
 * - REDIS_URL: Redis connection URL
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - GVCORE_CLI_PATH: Path to gvcore-cli binary
 * - BRUSH_PATH: Path to Brush 3DGS installation
 * - WORK_DIR: Temporary work directory
 * - WORKER_CONCURRENCY: Number of concurrent jobs (default: 1)
 */

export {
  getProductionQueue,
  getQueueEvents,
  addProductionJob,
  getProductionJob,
  cancelProductionJob,
  getQueueStats,
  cleanQueue,
  QUEUE_NAME,
  QUALITY_PRESETS,
  type ProductionJobData,
  type ProductionResult,
  type ProductionProgress,
  type ProductionStage,
} from "./production-queue";

export { getRedisConnection, closeConnection } from "./connection";

export { createWorker } from "./worker";
