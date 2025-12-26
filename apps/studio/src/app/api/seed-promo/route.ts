import { NextResponse } from "next/server";
import { db } from "@gameview/database";

/**
 * Seed promo codes for testing
 * DELETE THIS IN PRODUCTION
 *
 * GET /api/seed-promo - Creates test promo codes
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const promoCodes = [
      {
        id: "promo_beta2025",
        code: "BETA2025",
        type: "BETA_ACCESS" as const,
        description: "Full beta access for early testers",
        maxRedemptions: 100,
        redemptionCount: 0,
        maxPerUser: 1,
        validFrom: new Date(),
        isActive: true,
      },
      {
        id: "promo_credits10",
        code: "CREDITS10",
        type: "PUBLISH_CREDITS" as const,
        description: "10 free publishing credits",
        creditAmount: 10,
        maxRedemptions: null,
        redemptionCount: 0,
        maxPerUser: 1,
        validFrom: new Date(),
        isActive: true,
      },
      {
        id: "promo_earlybird",
        code: "EARLYBIRD",
        type: "DISCOUNT" as const,
        description: "25% off for early adopters",
        discountPercent: 25,
        maxRedemptions: 50,
        redemptionCount: 0,
        maxPerUser: 1,
        validFrom: new Date(),
        isActive: true,
      },
      {
        id: "promo_trial30",
        code: "TRIAL30",
        type: "SUBSCRIPTION_TRIAL" as const,
        description: "30-day extended trial",
        trialDays: 30,
        maxRedemptions: null,
        redemptionCount: 0,
        maxPerUser: 1,
        validFrom: new Date(),
        isActive: true,
      },
    ];

    const results = [];

    for (const promo of promoCodes) {
      const result = await db.promoCode.upsert({
        where: { code: promo.code },
        update: {}, // Don't update if exists
        create: promo,
      });
      results.push({ code: result.code, status: "created" });
    }

    return NextResponse.json({
      success: true,
      message: "Test promo codes created",
      codes: results,
      availableCodes: promoCodes.map(p => ({
        code: p.code,
        type: p.type,
        description: p.description,
      })),
    });
  } catch (error) {
    console.error("Error seeding promo codes:", error);
    return NextResponse.json(
      {
        error: "Failed to seed promo codes",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
