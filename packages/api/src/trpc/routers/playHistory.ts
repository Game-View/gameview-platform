import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const playHistoryRouter = router({
  /**
   * Get user's play history
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

      const history = await ctx.db.playHistory.findMany({
        where: { userId: ctx.userId },
        orderBy: { updatedAt: "desc" },
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
      if (history.length > limit) {
        const nextItem = history.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: history.map((h) => ({
          ...h.experience,
          playTimeSeconds: h.playTimeSeconds,
          completed: !!h.completedAt,
          lastPlayedAt: h.updatedAt,
        })),
        nextCursor,
      };
    }),

  /**
   * Record play session start
   */
  start: protectedProcedure
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

      // Create or update play history entry
      const playHistory = await ctx.db.playHistory.upsert({
        where: {
          id: `${ctx.userId}-${input.experienceId}`,
        },
        update: {
          startedAt: new Date(),
        },
        create: {
          userId: ctx.userId,
          experienceId: input.experienceId,
          startedAt: new Date(),
        },
      });

      return playHistory;
    }),

  /**
   * Update play session (called periodically during playback)
   */
  update: protectedProcedure
    .input(
      z.object({
        experienceId: z.string(),
        playTimeSeconds: z.number().min(0),
        lastPosition: z
          .object({
            x: z.number(),
            y: z.number(),
            z: z.number(),
            rotationX: z.number().optional(),
            rotationY: z.number().optional(),
            rotationZ: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { experienceId, playTimeSeconds, lastPosition } = input;

      // Find existing play history
      const existing = await ctx.db.playHistory.findFirst({
        where: {
          userId: ctx.userId,
          experienceId,
        },
      });

      if (!existing) {
        // Create new entry if doesn't exist
        return ctx.db.playHistory.create({
          data: {
            userId: ctx.userId,
            experienceId,
            playTimeSeconds,
            lastPosition: lastPosition ?? undefined,
          },
        });
      }

      // Update existing entry with max play time
      return ctx.db.playHistory.update({
        where: { id: existing.id },
        data: {
          playTimeSeconds: Math.max(existing.playTimeSeconds, playTimeSeconds),
          lastPosition: lastPosition ?? undefined,
        },
      });
    }),

  /**
   * Mark play session as complete
   */
  complete: protectedProcedure
    .input(
      z.object({
        experienceId: z.string(),
        playTimeSeconds: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { experienceId, playTimeSeconds } = input;

      const existing = await ctx.db.playHistory.findFirst({
        where: {
          userId: ctx.userId,
          experienceId,
        },
      });

      if (!existing) {
        return ctx.db.playHistory.create({
          data: {
            userId: ctx.userId,
            experienceId,
            playTimeSeconds,
            completedAt: new Date(),
          },
        });
      }

      return ctx.db.playHistory.update({
        where: { id: existing.id },
        data: {
          playTimeSeconds: Math.max(existing.playTimeSeconds, playTimeSeconds),
          completedAt: new Date(),
        },
      });
    }),

  /**
   * Get resume position for an experience
   */
  getResumePosition: protectedProcedure
    .input(z.object({ experienceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const history = await ctx.db.playHistory.findFirst({
        where: {
          userId: ctx.userId,
          experienceId: input.experienceId,
        },
        select: {
          playTimeSeconds: true,
          lastPosition: true,
          completedAt: true,
        },
      });

      if (!history) {
        return null;
      }

      return {
        playTimeSeconds: history.playTimeSeconds,
        lastPosition: history.lastPosition as {
          x: number;
          y: number;
          z: number;
          rotationX?: number;
          rotationY?: number;
          rotationZ?: number;
        } | null,
        completed: !!history.completedAt,
      };
    }),

  /**
   * Clear play history for an experience
   */
  clear: protectedProcedure
    .input(z.object({ experienceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.playHistory.deleteMany({
        where: {
          userId: ctx.userId,
          experienceId: input.experienceId,
        },
      });

      return { success: true };
    }),

  /**
   * Clear all play history
   */
  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.playHistory.deleteMany({
      where: { userId: ctx.userId },
    });

    return { success: true };
  }),
});
