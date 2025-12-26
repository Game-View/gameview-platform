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
 * Reusable middleware to ensure user is a creator
 */
const isCreator = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const user = await ctx.db.user.findUnique({
    where: { id: ctx.userId },
    include: { creator: true },
  });

  if (!user?.creator) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be a creator to access this resource",
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
