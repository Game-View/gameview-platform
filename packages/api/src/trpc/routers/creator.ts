import { z } from "zod";
import { router, publicProcedure, protectedProcedure, creatorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const creatorRouter = router({
  /**
   * Get creator profile by username (public)
   */
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const creator = await ctx.db.creator.findUnique({
        where: { username: input.username },
        include: {
          user: {
            select: {
              displayName: true,
              avatarUrl: true,
            },
          },
          socialLinks: true,
          _count: {
            select: {
              experiences: {
                where: { status: "PUBLISHED" },
              },
              followers: true,
            },
          },
        },
      });

      if (!creator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creator not found",
        });
      }

      return creator;
    }),

  /**
   * Get current user's creator profile
   */
  me: creatorProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.creator.findUnique({
      where: { id: ctx.creatorId },
      include: {
        socialLinks: true,
        _count: {
          select: {
            experiences: true,
            followers: true,
          },
        },
      },
    });

    return creator;
  }),

  /**
   * Become a creator (upgrade from player)
   */
  create: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(30)
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        displayName: z.string().min(1).max(100),
        bio: z.string().max(500).optional(),
        tagline: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a creator profile
      const existing = await ctx.db.creator.findUnique({
        where: { userId: ctx.userId },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a creator profile",
        });
      }

      // Check if username is taken
      const usernameExists = await ctx.db.creator.findUnique({
        where: { username: input.username.toLowerCase() },
      });

      if (usernameExists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username is already taken",
        });
      }

      // Create creator profile and update user role
      const creator = await ctx.db.$transaction(async (tx) => {
        // Update user role
        await tx.user.update({
          where: { id: ctx.userId },
          data: { role: "CREATOR" },
        });

        // Create creator profile
        return tx.creator.create({
          data: {
            userId: ctx.userId,
            username: input.username.toLowerCase(),
            displayName: input.displayName,
            bio: input.bio,
            tagline: input.tagline,
          },
        });
      });

      return creator;
    }),

  /**
   * Update creator profile
   */
  update: creatorProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(100).optional(),
        bio: z.string().max(500).optional().nullable(),
        tagline: z.string().max(100).optional().nullable(),
        avatarUrl: z.string().url().optional().nullable(),
        bannerUrl: z.string().url().optional().nullable(),
        websiteUrl: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creator = await ctx.db.creator.update({
        where: { id: ctx.creatorId },
        data: input,
      });

      return creator;
    }),

  /**
   * Check if username is available
   */
  checkUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const creator = await ctx.db.creator.findUnique({
        where: { username: input.username.toLowerCase() },
      });

      return { available: !creator };
    }),

  /**
   * Get creator's experiences
   */
  experiences: publicProcedure
    .input(
      z.object({
        username: z.string(),
        status: z.enum(["PUBLISHED", "DRAFT", "PROCESSING", "ARCHIVED"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { username, status, limit, cursor } = input;

      const creator = await ctx.db.creator.findUnique({
        where: { username },
      });

      if (!creator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creator not found",
        });
      }

      // Non-owners can only see published experiences
      let statusFilter = status;
      if (ctx.userId) {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.userId },
          include: { creator: true },
        });

        if (user?.creator?.id !== creator.id) {
          statusFilter = "PUBLISHED";
        }
      } else {
        statusFilter = "PUBLISHED";
      }

      const experiences = await ctx.db.experience.findMany({
        where: {
          creatorId: creator.id,
          ...(statusFilter && { status: statusFilter }),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          series: true,
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
   * Get creator's series
   */
  series: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const creator = await ctx.db.creator.findUnique({
        where: { username: input.username },
      });

      if (!creator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creator not found",
        });
      }

      const series = await ctx.db.series.findMany({
        where: { creatorId: creator.id },
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: {
              experiences: {
                where: { status: "PUBLISHED" },
              },
            },
          },
        },
      });

      return series;
    }),

  /**
   * Update social links
   */
  updateSocialLinks: creatorProcedure
    .input(
      z.object({
        links: z.array(
          z.object({
            platform: z.string(),
            url: z.string().url(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Delete existing links
      await ctx.db.socialLink.deleteMany({
        where: { creatorId: ctx.creatorId },
      });

      // Create new links
      await ctx.db.socialLink.createMany({
        data: input.links.map((link) => ({
          creatorId: ctx.creatorId,
          ...link,
        })),
      });

      return { success: true };
    }),

  /**
   * Get featured creators for discovery
   */
  featured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      // Get verified creators with the most experiences
      const creators = await ctx.db.creator.findMany({
        where: {
          isVerified: true,
          experiences: {
            some: { status: "PUBLISHED" },
          },
        },
        orderBy: {
          followers: { _count: "desc" },
        },
        take: input.limit,
        include: {
          _count: {
            select: {
              experiences: { where: { status: "PUBLISHED" } },
              followers: true,
            },
          },
        },
      });

      return creators;
    }),
});
