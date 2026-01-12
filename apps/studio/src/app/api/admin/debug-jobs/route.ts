import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { db } from "@gameview/database";

/**
 * GET /api/admin/debug-jobs
 *
 * Debug endpoint to see ALL processing jobs in the database.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ALL jobs, no filter
    const allJobs = await db.processingJob.findMany({
      include: {
        experience: {
          select: { title: true },
        },
      },
      orderBy: { queuedAt: "desc" },
    });

    return NextResponse.json({
      total: allJobs.length,
      jobs: allJobs.map((j) => ({
        id: j.id,
        name: j.experience?.title || "Unknown",
        status: j.status,
        stage: j.stage,
        progress: j.progress,
        createdAt: j.queuedAt,
        completedAt: j.completedAt,
        error: j.errorMessage,
      })),
    });
  } catch (error) {
    console.error("[API] Debug failed:", error);
    return NextResponse.json(
      { error: "Debug failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/debug-jobs
 *
 * Delete ALL processing jobs (nuclear option for beta cleanup).
 */
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete ALL jobs
    const result = await db.processingJob.deleteMany({});

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("[API] Delete all failed:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
