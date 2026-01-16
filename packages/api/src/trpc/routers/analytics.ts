import { z } from "zod";
import { router, creatorProcedure } from "../trpc";

/**
 * Analytics Router - Creator analytics and experience stats
 *
 * Sprint 19: Analytics & Creator Dashboard
 */
export const analyticsRouter = router({
  /**
   * Get overview stats for a creator
   */
  overview: creatorProcedure.query(async ({ ctx }) => {
    // Get all experiences for this creator
    const experiences = await ctx.db.experience.findMany({
      where: { creatorId: ctx.creatorId },
      select: { id: true, title: true, status: true, publishedAt: true },
    });

    const experienceIds = experiences.map((e) => e.id);

    // Get total play history across all experiences
    const playStats = await ctx.db.playHistory.aggregate({
      where: { experienceId: { in: experienceIds } },
      _count: { id: true },
      _sum: { playTimeSeconds: true, score: true },
    });

    // Get completion count
    const completions = await ctx.db.playHistory.count({
      where: {
        experienceId: { in: experienceIds },
        completedAt: { not: null },
      },
    });

    // Get wins count
    const wins = await ctx.db.playHistory.count({
      where: {
        experienceId: { in: experienceIds },
        hasWon: true,
      },
    });

    // Get unique players
    const uniquePlayers = await ctx.db.playHistory.groupBy({
      by: ["userId"],
      where: { experienceId: { in: experienceIds } },
    });

    // Get plays by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPlays = await ctx.db.playHistory.findMany({
      where: {
        experienceId: { in: experienceIds },
        startedAt: { gte: thirtyDaysAgo },
      },
      select: { startedAt: true },
      orderBy: { startedAt: "asc" },
    });

    // Group plays by date
    const playsByDate = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      playsByDate.set(dateStr, 0);
    }
    recentPlays.forEach((play) => {
      const dateStr = play.startedAt.toISOString().split("T")[0];
      playsByDate.set(dateStr, (playsByDate.get(dateStr) || 0) + 1);
    });

    const playsOverTime = Array.from(playsByDate.entries())
      .map(([date, plays]) => ({ date, plays }))
      .reverse();

    return {
      totalPlays: playStats._count.id || 0,
      totalPlayTime: playStats._sum.playTimeSeconds || 0,
      completions,
      wins,
      uniquePlayers: uniquePlayers.length,
      completionRate: playStats._count.id ? Math.round((completions / playStats._count.id) * 100) : 0,
      winRate: completions ? Math.round((wins / completions) * 100) : 0,
      experienceCount: experiences.length,
      publishedCount: experiences.filter((e) => e.status === "PUBLISHED").length,
      playsOverTime,
    };
  }),

  /**
   * Get stats for a specific experience
   */
  experience: creatorProcedure
    .input(z.object({ experienceId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const experience = await ctx.db.experience.findUnique({
        where: { id: input.experienceId },
        select: {
          id: true,
          title: true,
          creatorId: true,
          status: true,
          publishedAt: true,
          thumbnailUrl: true,
        },
      });

      if (!experience || experience.creatorId !== ctx.creatorId) {
        return null;
      }

      // Get play stats
      const playStats = await ctx.db.playHistory.aggregate({
        where: { experienceId: input.experienceId },
        _count: { id: true },
        _sum: { playTimeSeconds: true, score: true },
        _avg: { playTimeSeconds: true, score: true },
        _max: { score: true },
      });

      // Get completions and wins
      const completions = await ctx.db.playHistory.count({
        where: {
          experienceId: input.experienceId,
          completedAt: { not: null },
        },
      });

      const wins = await ctx.db.playHistory.count({
        where: {
          experienceId: input.experienceId,
          hasWon: true,
        },
      });

      // Get unique players
      const uniquePlayers = await ctx.db.playHistory.groupBy({
        by: ["userId"],
        where: { experienceId: input.experienceId },
      });

      // Get recent plays (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentPlays = await ctx.db.playHistory.findMany({
        where: {
          experienceId: input.experienceId,
          startedAt: { gte: thirtyDaysAgo },
        },
        select: { startedAt: true },
        orderBy: { startedAt: "asc" },
      });

      // Group plays by date
      const playsByDate = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        playsByDate.set(dateStr, 0);
      }
      recentPlays.forEach((play) => {
        const dateStr = play.startedAt.toISOString().split("T")[0];
        playsByDate.set(dateStr, (playsByDate.get(dateStr) || 0) + 1);
      });

      const playsOverTime = Array.from(playsByDate.entries())
        .map(([date, plays]) => ({ date, plays }))
        .reverse();

      // Get top scores
      const topScores = await ctx.db.playHistory.findMany({
        where: {
          experienceId: input.experienceId,
          completedAt: { not: null },
        },
        orderBy: { score: "desc" },
        take: 10,
        include: {
          user: {
            select: { displayName: true, avatarUrl: true },
          },
        },
      });

      return {
        experience: {
          id: experience.id,
          title: experience.title,
          status: experience.status,
          publishedAt: experience.publishedAt,
          thumbnailUrl: experience.thumbnailUrl,
        },
        stats: {
          totalPlays: playStats._count.id || 0,
          totalPlayTime: playStats._sum.playTimeSeconds || 0,
          avgPlayTime: Math.round(playStats._avg.playTimeSeconds || 0),
          avgScore: Math.round(playStats._avg.score || 0),
          highScore: playStats._max.score || 0,
          completions,
          wins,
          uniquePlayers: uniquePlayers.length,
          completionRate: playStats._count.id ? Math.round((completions / playStats._count.id) * 100) : 0,
          winRate: completions ? Math.round((wins / completions) * 100) : 0,
        },
        playsOverTime,
        topScores: topScores.map((s) => ({
          userId: s.userId,
          displayName: s.user.displayName,
          avatarUrl: s.user.avatarUrl,
          score: s.score,
          playTime: s.playTimeSeconds,
          completedAt: s.completedAt,
        })),
      };
    }),

  /**
   * Get experience rankings (top performers)
   */
  rankings: creatorProcedure.query(async ({ ctx }) => {
    const experiences = await ctx.db.experience.findMany({
      where: { creatorId: ctx.creatorId, status: "PUBLISHED" },
      include: {
        _count: {
          select: { playHistory: true },
        },
      },
    });

    // Get additional stats for each experience
    const experienceStats = await Promise.all(
      experiences.map(async (exp) => {
        const completions = await ctx.db.playHistory.count({
          where: {
            experienceId: exp.id,
            completedAt: { not: null },
          },
        });

        const uniquePlayers = await ctx.db.playHistory.groupBy({
          by: ["userId"],
          where: { experienceId: exp.id },
        });

        return {
          id: exp.id,
          title: exp.title,
          thumbnailUrl: exp.thumbnailUrl,
          publishedAt: exp.publishedAt,
          totalPlays: exp._count.playHistory,
          completions,
          uniquePlayers: uniquePlayers.length,
          completionRate: exp._count.playHistory
            ? Math.round((completions / exp._count.playHistory) * 100)
            : 0,
        };
      })
    );

    // Sort by total plays
    return experienceStats.sort((a, b) => b.totalPlays - a.totalPlays);
  }),
});
