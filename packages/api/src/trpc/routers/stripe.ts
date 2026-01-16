import { z } from "zod";
import { router, protectedProcedure, creatorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

/**
 * Stripe Router - Sprint 20: Payments & Monetization
 *
 * Handles:
 * - Creator onboarding (Stripe Connect)
 * - Experience purchases (Checkout Sessions)
 * - Purchase verification
 * - Creator earnings/payouts
 */

// Initialize Stripe (server-side only)
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured",
    });
  }
  return new Stripe(secretKey, { apiVersion: "2024-06-20" });
};

export const stripeRouter = router({
  // ============================================
  // CREATOR ONBOARDING (Stripe Connect)
  // ============================================

  /**
   * Create Stripe Connect account for creator
   */
  createConnectAccount: creatorProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();

    // Check if creator already has a Stripe account
    const creator = await ctx.db.creator.findUnique({
      where: { id: ctx.creatorId },
      include: { user: true },
    });

    if (!creator) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Creator not found",
      });
    }

    if (creator.stripeAccountId) {
      // Return existing account link for re-onboarding if needed
      const accountLink = await stripe.accountLinks.create({
        account: creator.stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_STUDIO_URL}/settings/payments?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_STUDIO_URL}/settings/payments?success=true`,
        type: "account_onboarding",
      });

      return { accountId: creator.stripeAccountId, onboardingUrl: accountLink.url };
    }

    // Create new Express Connect account
    const account = await stripe.accounts.create({
      type: "express",
      email: creator.user.email,
      metadata: {
        creatorId: creator.id,
        userId: creator.userId,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save account ID to database
    await ctx.db.creator.update({
      where: { id: ctx.creatorId },
      data: { stripeAccountId: account.id },
    });

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_STUDIO_URL}/settings/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_STUDIO_URL}/settings/payments?success=true`,
      type: "account_onboarding",
    });

    return { accountId: account.id, onboardingUrl: accountLink.url };
  }),

  /**
   * Get Stripe Connect account status
   */
  getConnectStatus: creatorProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.creator.findUnique({
      where: { id: ctx.creatorId },
      select: { stripeAccountId: true },
    });

    if (!creator?.stripeAccountId) {
      return {
        hasAccount: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(creator.stripeAccountId);

    return {
      hasAccount: true,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  }),

  /**
   * Get Stripe dashboard login link for creator
   */
  getDashboardLink: creatorProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.creator.findUnique({
      where: { id: ctx.creatorId },
      select: { stripeAccountId: true },
    });

    if (!creator?.stripeAccountId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No Stripe account connected",
      });
    }

    const stripe = getStripe();
    const loginLink = await stripe.accounts.createLoginLink(creator.stripeAccountId);

    return { url: loginLink.url };
  }),

  // ============================================
  // EXPERIENCE PURCHASES
  // ============================================

  /**
   * Create checkout session for purchasing an experience
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        experienceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();

      // Get experience details
      const experience = await ctx.db.experience.findUnique({
        where: { id: input.experienceId },
        include: {
          creator: {
            select: { stripeAccountId: true, displayName: true },
          },
        },
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      if (experience.status !== "PUBLISHED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Experience is not available for purchase",
        });
      }

      // Check if already purchased
      const existingPurchase = await ctx.db.purchase.findFirst({
        where: {
          userId: ctx.userId,
          experienceId: input.experienceId,
          status: "COMPLETED",
        },
      });

      if (existingPurchase) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already own this experience",
        });
      }

      // Free experiences don't need checkout
      const price = Number(experience.price);
      if (price === 0) {
        // Create free "purchase" record
        await ctx.db.purchase.create({
          data: {
            userId: ctx.userId,
            experienceId: input.experienceId,
            amount: 0,
            status: "COMPLETED",
          },
        });

        return { free: true, experienceId: input.experienceId };
      }

      // Creator must have Stripe account for paid experiences
      if (!experience.creator.stripeAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Creator has not set up payments",
        });
      }

      // Platform fee (e.g., 20%)
      const platformFeePercent = 20;
      const applicationFeeAmount = Math.round(price * (platformFeePercent / 100) * 100);

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: experience.title,
                description: `By ${experience.creator.displayName}`,
                images: experience.thumbnailUrl ? [experience.thumbnailUrl] : [],
              },
              unit_amount: Math.round(price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_PLAYER_URL}/experience/${input.experienceId}?purchase=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_PLAYER_URL}/experience/${input.experienceId}?purchase=cancelled`,
        metadata: {
          experienceId: input.experienceId,
          userId: ctx.userId,
          creatorId: experience.creatorId,
        },
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: experience.creator.stripeAccountId,
          },
        },
      });

      // Create pending purchase record
      await ctx.db.purchase.create({
        data: {
          userId: ctx.userId,
          experienceId: input.experienceId,
          amount: price,
          stripePaymentId: session.id,
          status: "PENDING",
        },
      });

      return { sessionId: session.id, url: session.url };
    }),

  /**
   * Check if user has purchased an experience
   */
  checkPurchase: protectedProcedure
    .input(z.object({ experienceId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check for free experience (price = 0)
      const experience = await ctx.db.experience.findUnique({
        where: { id: input.experienceId },
        select: { price: true, creatorId: true },
      });

      if (!experience) {
        return { hasAccess: false, reason: "not_found" };
      }

      // Free experiences are always accessible
      if (Number(experience.price) === 0) {
        return { hasAccess: true, reason: "free" };
      }

      // Check if user is the creator
      const creator = await ctx.db.creator.findFirst({
        where: { userId: ctx.userId },
      });

      if (creator && creator.id === experience.creatorId) {
        return { hasAccess: true, reason: "creator" };
      }

      // Check for completed purchase
      const purchase = await ctx.db.purchase.findFirst({
        where: {
          userId: ctx.userId,
          experienceId: input.experienceId,
          status: "COMPLETED",
        },
      });

      if (purchase) {
        return { hasAccess: true, reason: "purchased", purchaseDate: purchase.createdAt };
      }

      return { hasAccess: false, reason: "not_purchased", price: Number(experience.price) };
    }),

  // ============================================
  // CREATOR EARNINGS
  // ============================================

  /**
   * Get creator earnings summary
   */
  getEarnings: creatorProcedure.query(async ({ ctx }) => {
    // Get all completed purchases for creator's experiences
    const purchases = await ctx.db.purchase.findMany({
      where: {
        experience: { creatorId: ctx.creatorId },
        status: "COMPLETED",
      },
      include: {
        experience: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
    const platformFee = totalRevenue * 0.2; // 20% platform fee
    const netEarnings = totalRevenue - platformFee;

    // Get monthly breakdown
    const monthlyEarnings = new Map<string, number>();
    purchases.forEach((p) => {
      const month = p.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const current = monthlyEarnings.get(month) || 0;
      monthlyEarnings.set(month, current + Number(p.amount) * 0.8); // After platform fee
    });

    const monthlyData = Array.from(monthlyEarnings.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Recent transactions
    const recentTransactions = purchases.slice(0, 10).map((p) => ({
      id: p.id,
      experienceTitle: p.experience.title,
      amount: Number(p.amount),
      netAmount: Number(p.amount) * 0.8,
      date: p.createdAt,
    }));

    return {
      totalRevenue,
      platformFee,
      netEarnings,
      purchaseCount: purchases.length,
      monthlyData,
      recentTransactions,
    };
  }),

  /**
   * Get payout history and balance
   */
  getPayoutInfo: creatorProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.creator.findUnique({
      where: { id: ctx.creatorId },
      select: { stripeAccountId: true },
    });

    if (!creator?.stripeAccountId) {
      return {
        balance: 0,
        pendingBalance: 0,
        payouts: [],
        hasAccount: false,
      };
    }

    const stripe = getStripe();

    // Get balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: creator.stripeAccountId,
    });

    const availableBalance = balance.available.reduce(
      (sum, b) => sum + b.amount,
      0
    ) / 100;
    const pendingBalance = balance.pending.reduce(
      (sum, b) => sum + b.amount,
      0
    ) / 100;

    // Get recent payouts
    const payoutsList = await stripe.payouts.list(
      { limit: 10 },
      { stripeAccount: creator.stripeAccountId }
    );

    const payouts = payoutsList.data.map((p) => ({
      id: p.id,
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      arrivalDate: new Date(p.arrival_date * 1000),
      createdAt: new Date(p.created * 1000),
    }));

    return {
      balance: availableBalance,
      pendingBalance,
      payouts,
      hasAccount: true,
    };
  }),
});
