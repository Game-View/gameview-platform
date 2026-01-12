import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { db } from "@gameview/database";

/**
 * POST /api/admin/cleanup-stuck
 *
 * Cleans up stuck productions by marking them as cancelled.
 * This is an admin endpoint to fix productions that are stuck in
 * QUEUED or PROCESSING state but aren't actually running.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all stuck productions for this user (via creator's userId)
    const stuckJobs = await db.processingJob.findMany({
      where: {
        experience: {
          creator: {
            userId: userId,
          },
        },
        status: {
          in: ["QUEUED", "PROCESSING"],
        },
      },
      include: {
        experience: {
          select: { title: true },
        },
      },
    });

    if (stuckJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stuck productions found",
        cleaned: 0,
      });
    }

    // Mark all stuck jobs as cancelled
    const result = await db.processingJob.updateMany({
      where: {
        id: {
          in: stuckJobs.map((j) => j.id),
        },
      },
      data: {
        status: "CANCELLED",
        stage: null,
        completedAt: new Date(),
        errorMessage: "Cancelled by admin cleanup",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.count} stuck productions`,
      cleaned: result.count,
      productions: stuckJobs.map((j) => ({
        id: j.id,
        name: j.experience.title,
        previousStatus: j.status,
      })),
    });
  } catch (error) {
    console.error("[API] Cleanup failed:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cleanup-stuck
 *
 * Lists stuck productions without cleaning them up.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stuckJobs = await db.processingJob.findMany({
      where: {
        experience: {
          creator: {
            userId: userId,
          },
        },
        status: {
          in: ["QUEUED", "PROCESSING"],
        },
      },
      include: {
        experience: {
          select: { title: true },
        },
      },
    });

    return NextResponse.json({
      stuck: stuckJobs.map((j) => ({
        id: j.id,
        name: j.experience.title,
        status: j.status,
        stage: j.stage,
        createdAt: j.queuedAt,
      })),
      count: stuckJobs.length,
    });
  } catch (error) {
    console.error("[API] List stuck failed:", error);
    return NextResponse.json(
      { error: "Failed to list stuck productions" },
      { status: 500 }
    );
  }
}
