import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

/**
 * Promo Code Router
 * Handles promo code validation, redemption, and management
 */
export const promoRouter = router({
  /**
   * Validate a promo code without redeeming it
   * Returns promo details if valid, or error if invalid
   */
  validate: publicProcedure
    .input(z.object({ code: z.string().min(1).max(50) }))
    .query(async ({ ctx, input }) => {
      const code = input.code.toUpperCase().trim();

      const promo = await ctx.db.promoCode.findUnique({
        where: { code },
      });

      if (!promo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promo code not found",
        });
      }

      // Check if active
      if (!promo.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This promo code is no longer active",
        });
      }

      // Check validity period
      const now = new Date();
      if (promo.validFrom > now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This promo code is not yet valid",
        });
      }

      if (promo.validUntil && promo.validUntil < now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This promo code has expired",
        });
      }

      // Check redemption limit
      if (promo.maxRedemptions && promo.redemptionCount >= promo.maxRedemptions) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This promo code has reached its maximum redemptions",
        });
      }

      // Return safe promo details (don't expose internal limits)
      return {
        code: promo.code,
        type: promo.type,
        description: promo.description,
        creditAmount: promo.creditAmount,
        discountPercent: promo.discountPercent,
        trialDays: promo.trialDays,
        valid: true,
      };
    }),

  /**
   * Redeem a promo code for the current user
   */
  redeem: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const code = input.code.toUpperCase().trim();

      const promo = await ctx.db.promoCode.findUnique({
        where: { code },
        include: {
          redemptions: {
            where: { userId: ctx.userId },
          },
        },
      });

      if (!promo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promo code not found",
        });
      }

      // Check if active
      if (!promo.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This promo code is no longer active",
        });
      }

      // Check validity period
      const now = new Date();
      if (promo.validFrom > now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This promo code is not yet valid",
        });
      }

      if (promo.validUntil && promo.validUntil < now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This promo code has expired",
        });
      }

      // Check redemption limit
      if (promo.maxRedemptions && promo.redemptionCount >= promo.maxRedemptions) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This promo code has reached its maximum redemptions",
        });
      }

      // Check per-user limit
      if (promo.redemptions.length >= promo.maxPerUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already used this promo code",
        });
      }

      // Check email restrictions
      if (promo.requiresEmail || promo.requiresDomain) {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.userId },
          select: { email: true },
        });

        if (promo.requiresEmail && user?.email !== promo.requiresEmail) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This promo code is not available for your account",
          });
        }

        if (promo.requiresDomain && !user?.email?.endsWith(promo.requiresDomain)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This promo code is not available for your email domain",
          });
        }
      }

      // Process redemption based on promo type
      let creditsGranted: number | null = null;
      let accessGranted: string | null = null;

      // Use a transaction for atomicity
      const result = await ctx.db.$transaction(async (tx) => {
        // Create redemption record
        const redemption = await tx.promoRedemption.create({
          data: {
            promoCodeId: promo.id,
            userId: ctx.userId,
            creditsGranted: promo.creditAmount,
            accessGranted: promo.type === "BETA_ACCESS" ? "beta" : null,
          },
        });

        // Increment redemption count
        await tx.promoCode.update({
          where: { id: promo.id },
          data: { redemptionCount: { increment: 1 } },
        });

        // Apply benefits based on type
        switch (promo.type) {
          case "BETA_ACCESS":
            // Grant beta access
            await tx.betaAccess.upsert({
              where: { userId: ctx.userId },
              create: {
                userId: ctx.userId,
                promoCodeId: promo.id,
                features: { fullAccess: true },
              },
              update: {
                isActive: true,
                revokedAt: null,
                revokedBy: null,
              },
            });
            accessGranted = "beta";
            break;

          case "PUBLISH_CREDITS":
            // Grant publishing credits to creator's subscription
            if (promo.creditAmount) {
              const user = await tx.user.findUnique({
                where: { id: ctx.userId },
                include: { creator: { include: { subscription: true } } },
              });

              if (user?.creator) {
                // Upsert subscription and add credits to rolloverCredits (bonus credits)
                await tx.creatorSubscription.upsert({
                  where: { creatorId: user.creator.id },
                  create: {
                    creatorId: user.creator.id,
                    rolloverCredits: promo.creditAmount,
                  },
                  update: {
                    rolloverCredits: { increment: promo.creditAmount },
                  },
                });
                creditsGranted = promo.creditAmount;
              }
            }
            break;

          case "SUBSCRIPTION_TRIAL":
            // Trial days would be applied when subscription is created
            accessGranted = `trial_${promo.trialDays}_days`;
            break;

          case "DISCOUNT":
            // Discount would be applied at checkout
            accessGranted = `discount_${promo.discountPercent || promo.discountAmount}`;
            break;
        }

        return redemption;
      });

      return {
        success: true,
        redemptionId: result.id,
        type: promo.type,
        creditsGranted,
        accessGranted,
        message: getRedemptionMessage(promo.type, creditsGranted, accessGranted),
      };
    }),

  /**
   * Get current user's promo code redemptions
   */
  myRedemptions: protectedProcedure.query(async ({ ctx }) => {
    const redemptions = await ctx.db.promoRedemption.findMany({
      where: { userId: ctx.userId },
      include: {
        promoCode: {
          select: {
            code: true,
            type: true,
            description: true,
          },
        },
      },
      orderBy: { redeemedAt: "desc" },
    });

    return redemptions;
  }),

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  /**
   * Create a new promo code (admin only)
   */
  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(3).max(50),
        type: z.enum(["BETA_ACCESS", "PUBLISH_CREDITS", "SUBSCRIPTION_TRIAL", "DISCOUNT"]),
        description: z.string().optional(),
        creditAmount: z.number().int().positive().optional(),
        discountPercent: z.number().int().min(1).max(100).optional(),
        discountAmount: z.number().positive().optional(),
        trialDays: z.number().int().positive().optional(),
        maxRedemptions: z.number().int().positive().optional(),
        maxPerUser: z.number().int().positive().default(1),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
        requiresEmail: z.string().email().optional(),
        requiresDomain: z.string().optional(),
        tier: z.enum(["FREE", "INDIE", "PRO", "STUDIO"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const code = input.code.toUpperCase().trim();

      // Check if code already exists
      const existing = await ctx.db.promoCode.findUnique({
        where: { code },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A promo code with this code already exists",
        });
      }

      const promo = await ctx.db.promoCode.create({
        data: {
          code,
          type: input.type,
          description: input.description,
          creditAmount: input.creditAmount,
          discountPercent: input.discountPercent,
          discountAmount: input.discountAmount,
          trialDays: input.trialDays,
          maxRedemptions: input.maxRedemptions,
          maxPerUser: input.maxPerUser,
          validFrom: input.validFrom || new Date(),
          validUntil: input.validUntil,
          requiresEmail: input.requiresEmail,
          requiresDomain: input.requiresDomain,
          tier: input.tier,
        },
      });

      return promo;
    }),

  /**
   * List all promo codes (admin only)
   */
  list: adminProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
        type: z.enum(["BETA_ACCESS", "PUBLISH_CREDITS", "SUBSCRIPTION_TRIAL", "DISCOUNT"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (!input?.includeInactive) {
        where.isActive = true;
      }

      if (input?.type) {
        where.type = input.type;
      }

      const promos = await ctx.db.promoCode.findMany({
        where,
        include: {
          _count: {
            select: { redemptions: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return promos;
    }),

  /**
   * Update a promo code (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().optional(),
        maxRedemptions: z.number().int().positive().optional().nullable(),
        maxPerUser: z.number().int().positive().optional(),
        validUntil: z.date().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const promo = await ctx.db.promoCode.update({
        where: { id },
        data,
      });

      return promo;
    }),

  /**
   * Delete a promo code (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete by deactivating
      const promo = await ctx.db.promoCode.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return { success: true, id: promo.id };
    }),
});

/**
 * Helper to generate user-friendly redemption messages
 */
function getRedemptionMessage(
  type: string,
  creditsGranted: number | null,
  accessGranted: string | null
): string {
  switch (type) {
    case "BETA_ACCESS":
      return "Beta access granted! You now have full access to the platform.";
    case "PUBLISH_CREDITS":
      return `${creditsGranted} publishing credits have been added to your account!`;
    case "SUBSCRIPTION_TRIAL":
      return `Extended trial activated! ${accessGranted?.replace("trial_", "").replace("_days", "")} extra days added.`;
    case "DISCOUNT":
      return "Discount code applied! It will be automatically applied at checkout.";
    default:
      return "Promo code redeemed successfully!";
  }
}
