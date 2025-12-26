import { NextResponse } from "next/server";
import { db } from "@gameview/database";

export async function GET() {
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
    ];

    const results = [];
    for (const promo of promoCodes) {
      const result = await db.promoCode.upsert({
        where: { code: promo.code },
        update: {},
        create: promo,
      });
      results.push({ code: result.code, created: true });
    }

    return NextResponse.json({
      success: true,
      message: "Promo codes seeded!",
      codes: results,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed", details: String(error) },
      { status: 500 }
    );
  }
}
