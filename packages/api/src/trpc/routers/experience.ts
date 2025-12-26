import { z } from "zod";
import { router, publicProcedure, protectedProcedure, creatorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const categoryEnum = z.enum(["ENTERTAINMENT", "EDUCATION", "EXPLORATION"]);
const statusEnum = z.enum(["DRAFT", "PROCESSING", "PUBLISHED", "ARCHIVED"]);
const ageRatingEnum = z.enum(["E", "E10", "T", "M"]);

export const experienceRouter = router({
  /**
   * Get a single experience by ID (public)
   */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const experience = await ctx.db.experience.findUnique({
        where: { id: input.id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          series: true,
          _count: {
            select: {
              playHistory: true,
              wishlist: true,
            },
          },
        },
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      // Only return published experiences to non-creators
      if (experience.status !== "PUBLISHED") {
        // Check if the user is the creator
        if (ctx.userId) {
          const user = await ctx.db.user.findUnique({
            where: { id: ctx.userId },
            include: { creator: true },
          });

          if (user?.creator?.id !== experience.creatorId) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Experience not found",
            });
          }
        } else {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Experience not found",
          });
        }
      }

      return experience;
    }),

  /**
   * List published experiences with filters
   */
  list: publicProcedure
    .input(
      z.object({
        category: categoryEnum.optional(),
        subcategory: z.string().optional(),
        priceType: z.enum(["free", "paid", "all"]).default("all"),
        sortBy: z.enum(["recent", "popular", "price_low", "price_high"]).default("recent"),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { category, subcategory, priceType, sortBy, cursor, limit } = input;

      const where = {
        status: "PUBLISHED" as const,
        ...(category && { category }),
        ...(subcategory && { subcategory }),
        ...(priceType === "free" && { price: { equals: 0 } }),
        ...(priceType === "paid" && { price: { gt: 0 } }),
      };

      const orderBy = (() => {
        switch (sortBy) {
          case "recent":
            return { publishedAt: "desc" as const };
          case "price_low":
            return { price: "asc" as const };
          case "price_high":
            return { price: "desc" as const };
          default:
            return { publishedAt: "desc" as const };
        }
      })();

      const experiences = await ctx.db.experience.findMany({
        where,
        orderBy,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
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
      });

      let nextCursor: string | undefined;
      if (experiences.length > limit) {
        const nextItem = experiences.pop();
        nextCursor = nextItem?.id;
      }

      return { experiences, nextCursor };
    }),

  /**
   * Get trending experiences
   */
  trending: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // For now, just get recent published experiences
      // TODO: Implement actual trending algorithm based on play counts
      const experiences = await ctx.db.experience.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: input.limit,
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
      });

      return experiences;
    }),

  /**
   * Personalized "For You" feed
   */
  forYou: protectedProcedure
    .input(
      z.object({
        category: categoryEnum.optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get user's followed creators
      const follows = await ctx.db.follow.findMany({
        where: { followerId: ctx.userId },
        select: { creatorId: true },
      });
      const followedCreatorIds = follows.map((f) => f.creatorId);

      // Get user's interests
      const interests = await ctx.db.userInterest.findMany({
        where: { userId: ctx.userId },
        select: { interest: true, category: true },
      });

      // Get experiences from followed creators (60%)
      const fromFollowed = await ctx.db.experience.findMany({
        where: {
          status: "PUBLISHED",
          creatorId: { in: followedCreatorIds },
          ...(input.category && { category: input.category }),
        },
        orderBy: { publishedAt: "desc" },
        take: Math.floor(input.limit * 0.6),
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
      });

      // Get recommended experiences based on interests (40%)
      const interestTags = interests.map((i) => i.interest.toLowerCase());
      const recommended = await ctx.db.experience.findMany({
        where: {
          status: "PUBLISHED",
          creatorId: { notIn: followedCreatorIds },
          ...(interestTags.length > 0 && { tags: { hasSome: interestTags } }),
          ...(input.category && { category: input.category }),
        },
        orderBy: { publishedAt: "desc" },
        take: input.limit - fromFollowed.length,
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
      });

      return {
        fromFollowed,
        recommended,
      };
    }),

  /**
   * Search experiences
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: categoryEnum.optional(),
        priceType: z.enum(["free", "paid", "all"]).default("all"),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, category, priceType, limit } = input;

      const experiences = await ctx.db.experience.findMany({
        where: {
          status: "PUBLISHED",
          ...(category && { category }),
          ...(priceType === "free" && { price: { equals: 0 } }),
          ...(priceType === "paid" && { price: { gt: 0 } }),
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { tags: { hasSome: [query.toLowerCase()] } },
            { subcategory: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit,
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
      });

      return experiences;
    }),

  /**
   * Get experiences by category
   */
  byCategory: publicProcedure
    .input(
      z.object({
        category: categoryEnum,
        subcategory: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { category, subcategory, limit, cursor } = input;

      const experiences = await ctx.db.experience.findMany({
        where: {
          status: "PUBLISHED",
          category,
          ...(subcategory && { subcategory }),
        },
        orderBy: { publishedAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
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
      });

      let nextCursor: string | undefined;
      if (experiences.length > limit) {
        const nextItem = experiences.pop();
        nextCursor = nextItem?.id;
      }

      return { experiences, nextCursor };
    }),

  /**
   * Creator: Create a new experience
   */
  create: creatorProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(5000),
        category: categoryEnum,
        subcategory: z.string(),
        tags: z.array(z.string()).max(10).default([]),
        duration: z.number().min(1),
        price: z.number().min(0).default(0),
        ageRating: ageRatingEnum.default("E"),
        seriesId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const experience = await ctx.db.experience.create({
        data: {
          ...input,
          creatorId: ctx.creatorId,
          tags: input.tags.map((t) => t.toLowerCase()),
        },
      });

      return experience;
    }),

  /**
   * Creator: Update an experience
   */
  update: creatorProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().min(1).max(5000).optional(),
        thumbnailUrl: z.string().url().optional().nullable(),
        previewUrl: z.string().url().optional().nullable(),
        category: categoryEnum.optional(),
        subcategory: z.string().optional(),
        tags: z.array(z.string()).max(10).optional(),
        duration: z.number().min(1).optional(),
        price: z.number().min(0).optional(),
        ageRating: ageRatingEnum.optional(),
        seriesId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tags, ...data } = input;

      // Verify ownership
      const existing = await ctx.db.experience.findUnique({
        where: { id },
      });

      if (!existing || existing.creatorId !== ctx.creatorId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      const experience = await ctx.db.experience.update({
        where: { id },
        data: {
          ...data,
          ...(tags && { tags: tags.map((t) => t.toLowerCase()) }),
        },
      });

      return experience;
    }),

  /**
   * Creator: Publish an experience
   */
  publish: creatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.experience.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.creatorId !== ctx.creatorId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      if (existing.status === "PROCESSING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot publish while processing",
        });
      }

      const experience = await ctx.db.experience.update({
        where: { id: input.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      return experience;
    }),

  /**
   * Creator: Delete an experience
   */
  delete: creatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.experience.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.creatorId !== ctx.creatorId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      await ctx.db.experience.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
