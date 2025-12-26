import { db } from "@gameview/database";
import type { PrismaClient } from "@gameview/database";

/**
 * Context available in all tRPC procedures
 */
export interface Context {
  db: PrismaClient;
  userId: string | null;
  req?: Request;
}

/**
 * Create context for each request
 * This is called for each request and provides the context to all procedures
 */
export interface CreateContextOptions {
  userId?: string | null;
  req?: Request;
}

export function createContext(opts: CreateContextOptions): Context {
  return {
    db,
    userId: opts.userId ?? null,
    req: opts.req,
  };
}

export type { PrismaClient };
