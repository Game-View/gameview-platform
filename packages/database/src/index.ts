import { PrismaClient } from "@prisma/client";

// PrismaClient singleton for serverless environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export everything from Prisma client for convenience
export * from "@prisma/client";

// Export the db alias for compatibility
export const db = prisma;

// Type helper for transactions
export type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];
