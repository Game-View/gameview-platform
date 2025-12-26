import Redis from "ioredis";

/**
 * Redis connection for BullMQ
 *
 * Supports both local development and cloud Redis (Upstash, etc.)
 *
 * Environment variables:
 * - REDIS_URL: Full Redis connection URL (recommended for production)
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 */

function getRedisConfig() {
  // Use REDIS_URL if provided (Upstash, Railway, etc.)
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  // Fall back to individual config
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
  };
}

// Shared connection for queue and worker
let connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!connection) {
    const config = getRedisConfig();
    connection =
      typeof config === "string"
        ? new Redis(config, { maxRetriesPerRequest: null })
        : new Redis(config);

    connection.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    connection.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });
  }

  return connection;
}

export function createNewConnection(): Redis {
  const config = getRedisConfig();
  return typeof config === "string"
    ? new Redis(config, { maxRetriesPerRequest: null })
    : new Redis(config);
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
