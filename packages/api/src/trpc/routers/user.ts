import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  /**
   * Get current user's profile
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      include: {
        creator: true,
        interests: true,
        _count: {
          select: {
            follows: true,
            playHistory: true,
            wishlist: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  /**
   * Get user by Clerk ID (used internally)
   */
  getByClerkId: publicProcedure
    .input(z.object({ clerkId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkId: input.clerkId },
        include: {
          creator: true,
        },
      });

      return user;
    }),

  /**
   * Update current user's profile
   */
  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(100).optional(),
        avatarUrl: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.userId },
        data: input,
      });

      return user;
    }),

  /**
   * Get user's interests
   */
  interests: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const interests = await ctx.db.userInterest.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: "desc" },
      });

      return interests;
    }),

    update: protectedProcedure
      .input(
        z.object({
          interests: z.array(
            z.object({
              interest: z.string(),
              category: z.enum(["ENTERTAINMENT", "EDUCATION", "EXPLORATION"]),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Delete existing interests
        await ctx.db.userInterest.deleteMany({
          where: { userId: ctx.userId },
        });

        // Create new interests
        const interests = await ctx.db.userInterest.createMany({
          data: input.interests.map((interest) => ({
            userId: ctx.userId,
            ...interest,
          })),
        });

        return interests;
      }),
  }),

  /**
   * Connected accounts management
   */
  connectedAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const accounts = await ctx.db.connectedAccount.findMany({
        where: { userId: ctx.userId },
        select: {
          id: true,
          platform: true,
          username: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      return accounts;
    }),

    disconnect: protectedProcedure
      .input(z.object({ platform: z.enum(["YOUTUBE", "TIKTOK", "TWITCH", "TWITTER", "INSTAGRAM"]) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.connectedAccount.deleteMany({
          where: {
            userId: ctx.userId,
            platform: input.platform,
          },
        });

        return { success: true };
      }),
  }),
});
