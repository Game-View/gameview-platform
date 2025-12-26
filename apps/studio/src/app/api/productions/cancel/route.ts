import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";

/**
 * POST /api/productions/cancel
 *
 * Cancels a production job in the BullMQ queue.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productionId } = body;

    if (!productionId) {
      return NextResponse.json(
        { error: "productionId is required" },
        { status: 400 }
      );
    }

    // Dynamic import
    const { cancelProductionJob } = await import("@gameview/queue");

    const cancelled = await cancelProductionJob(productionId);

    return NextResponse.json({
      success: cancelled,
      productionId,
    });
  } catch (error) {
    console.error("[API] Failed to cancel production:", error);
    return NextResponse.json(
      { error: "Failed to cancel production" },
      { status: 500 }
    );
  }
}
