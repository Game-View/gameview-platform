import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

/**
 * Public (unauthenticated) procedure
 * This is the base piece you use to build new queries and mutations on your tRPC API.
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware to ensure user is authenticated
 */
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Protected (authenticated) procedure
 * Only logged-in users can access these procedures
 */
export const protectedProcedure = t.procedure.use(isAuthenticated);

/**
 * Generate a unique username from display name or email
 */
async function generateUniqueUsername(db: Context["db"], baseUsername: string): Promise<string> {
  // Sanitize: lowercase, alphanumeric and underscores only
  let username = baseUsername
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 20);

  // Ensure minimum length
  if (username.length < 3) {
    username = "creator";
  }

  // Check if username exists, if so add random suffix
  let finalUsername = username;
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.creator.findUnique({
      where: { username: finalUsername },
    });
    if (!existing) break;

    // Add random suffix
    const suffix = Math.random().toString(36).slice(2, 6);
    finalUsername = `${username}_${suffix}`;
    attempts++;
  }

  return finalUsername;
}

/**
 * Reusable middleware to ensure user is a creator
 * Auto-creates Creator record if user has CREATOR role but missing Creator record
 */
const isCreator = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  // ctx.userId is the DATABASE id (UUID), not the Clerk ID
  // The server.ts already handled user lookup/creation before passing the id here
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.userId },
    include: { creator: true },
  });

  if (!user) {
    // This shouldn't happen - server.ts should have created the user
    console.error("[tRPC] User not found for database id:", ctx.userId);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "User account not found. Please try signing out and back in.",
    });
  }

  // Auto-create Creator record if user has CREATOR role but no Creator record
  // This handles race conditions where onboarding sets role but Creator creation failed
  if (user && user.role === "CREATOR" && !user.creator) {
    try {
      console.log("[tRPC] Auto-creating Creator record for user:", user.id);
      const displayName = user.displayName || "Creator";
      const usernameBase = user.email.split("@")[0] || displayName;
      const username = await generateUniqueUsername(ctx.db, usernameBase);

      const creator = await ctx.db.creator.create({
        data: {
          userId: user.id,
          username,
          displayName,
        },
      });

      // Update user object with new creator
      user = { ...user, creator };
      console.log("[tRPC] Created Creator record:", creator.id);
    } catch (creatorError) {
      console.error("[tRPC] Failed to auto-create Creator:", creatorError);
      // Fall through to the error below if creation fails
    }
  }

  if (!user?.creator) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be a creator to access this resource. Please complete onboarding first.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      creatorId: user.creator.id,
    },
  });
});

/**
 * Creator procedure
 * Only users with a creator profile can access these procedures
 */
export const creatorProcedure = t.procedure.use(isCreator);

/**
 * Reusable middleware to ensure user is an admin
 */
const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  // ctx.userId is the DATABASE id (UUID), not the Clerk ID
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.userId },
  });

  if (user?.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Admin procedure
 * Only admin users can access these procedures
 */
export const adminProcedure = t.procedure.use(isAdmin);
