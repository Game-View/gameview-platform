import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const followRouter = router({
  /**
   * Get creators the user is following
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const follows = await ctx.db.follow.findMany({
        where: { followerId: ctx.userId },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
              _count: {
                select: {
                  experiences: { where: { status: "PUBLISHED" } },
                  followers: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (follows.length > limit) {
        const nextItem = follows.pop();
        nextCursor = nextItem?.id;
      }

      return {
        follows: follows.map((f) => f.creator),
        nextCursor,
      };
    }),

  /**
   * Follow a creator
   */
  follow: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify creator exists
      const creator = await ctx.db.creator.findUnique({
        where: { id: input.creatorId },
      });

      if (!creator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creator not found",
        });
      }

      // Check if user is trying to follow themselves
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        include: { creator: true },
      });

      if (user?.creator?.id === input.creatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself",
        });
      }

      // Create follow (upsert to handle duplicates)
      const follow = await ctx.db.follow.upsert({
        where: {
          followerId_creatorId: {
            followerId: ctx.userId,
            creatorId: input.creatorId,
          },
        },
        update: {},
        create: {
          followerId: ctx.userId,
          creatorId: input.creatorId,
        },
      });

      return follow;
    }),

  /**
   * Unfollow a creator
   */
  unfollow: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.follow.deleteMany({
        where: {
          followerId: ctx.userId,
          creatorId: input.creatorId,
        },
      });

      return { success: true };
    }),

  /**
   * Check if user is following a creator
   */
  isFollowing: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const follow = await ctx.db.follow.findUnique({
        where: {
          followerId_creatorId: {
            followerId: ctx.userId,
            creatorId: input.creatorId,
          },
        },
      });

      return { following: !!follow };
    }),

  /**
   * Get follower count for a creator
   */
  count: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.follow.count({
        where: { creatorId: input.creatorId },
      });

      return { count };
    }),
});
