import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const wishlistRouter = router({
  /**
   * Get user's wishlist
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

      const wishlist = await ctx.db.wishlist.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          experience: {
            include: {
              creator: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (wishlist.length > limit) {
        const nextItem = wishlist.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: wishlist.map((w) => ({
          ...w.experience,
          addedAt: w.createdAt,
        })),
        nextCursor,
      };
    }),

  /**
   * Add experience to wishlist
   */
  add: protectedProcedure
    .input(z.object({ experienceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify experience exists and is published
      const experience = await ctx.db.experience.findUnique({
        where: { id: input.experienceId },
      });

      if (!experience || experience.status !== "PUBLISHED") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      // Add to wishlist (upsert to handle duplicates)
      const wishlistItem = await ctx.db.wishlist.upsert({
        where: {
          userId_experienceId: {
            userId: ctx.userId,
            experienceId: input.experienceId,
          },
        },
        update: {},
        create: {
          userId: ctx.userId,
          experienceId: input.experienceId,
        },
      });

      return wishlistItem;
    }),

  /**
   * Remove experience from wishlist
   */
  remove: protectedProcedure
    .input(z.object({ experienceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.wishlist.deleteMany({
        where: {
          userId: ctx.userId,
          experienceId: input.experienceId,
        },
      });

      return { success: true };
    }),

  /**
   * Check if experience is in wishlist
   */
  isInWishlist: protectedProcedure
    .input(z.object({ experienceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.wishlist.findUnique({
        where: {
          userId_experienceId: {
            userId: ctx.userId,
            experienceId: input.experienceId,
          },
        },
      });

      return { inWishlist: !!item };
    }),
});
