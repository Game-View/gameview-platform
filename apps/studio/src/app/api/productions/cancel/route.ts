import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { db } from "@gameview/database";

/**
 * POST /api/productions/cancel
 *
 * Cancels a production job.
 * Updates the database status to CANCELLED.
 * Note: Modal jobs cannot be cancelled mid-execution, but we update the status.
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

    // Update database status to CANCELLED
    await db.processingJob.update({
      where: { id: productionId },
      data: {
        status: "CANCELLED",
        stage: null,
        completedAt: new Date(),
      },
    });

    // Try to cancel in BullMQ if available (legacy support)
    try {
      const { cancelProductionJob } = await import("@gameview/queue");
      await cancelProductionJob(productionId);
    } catch {
      // BullMQ not available, but we've already updated the database
      console.log("[API] BullMQ cancel skipped (not available)");
    }

    return NextResponse.json({
      success: true,
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
