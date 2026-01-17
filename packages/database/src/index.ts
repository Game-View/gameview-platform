// Database package - exports Prisma client
// Uses custom output location to ensure proper bundling in Vercel serverless

// Import from custom generated location (set in schema.prisma output)
import { PrismaClient as GeneratedPrismaClient } from "../generated/client";

// Re-export the PrismaClient class
export { GeneratedPrismaClient as PrismaClient };

// PrismaClient singleton for serverless environments
const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof GeneratedPrismaClient> | undefined;
};

const prismaClient =
  globalForPrisma.prisma ??
  new GeneratedPrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;
export const db = prismaClient;

// Type helper for transactions
export type TransactionClient = InstanceType<typeof GeneratedPrismaClient>;

// Re-export enums and Prisma namespace from generated client
export {
  UserRole,
  Category,
  ExperienceStatus,
  AgeRating,
  Platform,
  PurchaseStatus,
  JobStatus,
  JobStage,
  SubscriptionTier,
  SubscriptionStatus,
  CreditTransactionType,
  PromoCodeType,
  AppType,
  UpdateType,
  Prisma,
} from "../generated/client";
