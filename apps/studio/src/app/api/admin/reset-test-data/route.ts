import { auth } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { db } from "@gameview/database";

// POST /api/admin/reset-test-data - Delete all test users from database
// This is useful for testing when you need to reuse email addresses
//
// SAFETY: Only works in development/preview environments
// In production, requires ADMIN_SECRET header
export async function POST(request: Request) {
  try {
    // Check environment - only allow in non-production OR with admin secret
    const isProduction = process.env.NODE_ENV === "production";
    const isVercelPreview = process.env.VERCEL_ENV === "preview";
    const adminSecret = request.headers.get("x-admin-secret");
    const expectedSecret = process.env.ADMIN_SECRET;

    // Allow if:
    // 1. Not production (local dev)
    // 2. Vercel preview environment
    // 3. Has valid admin secret
    const hasValidSecret = expectedSecret && adminSecret === expectedSecret;
    const isAllowed = !isProduction || isVercelPreview || hasValidSecret;

    if (!isAllowed) {
      return NextResponse.json(
        { error: "This endpoint is only available in development/preview environments" },
        { status: 403 }
      );
    }

    // Optionally check for authenticated admin user
    const { userId } = await auth();

    // Get counts before deletion for reporting
    const userCount = await db.user.count();
    const creatorCount = await db.creator.count();
    const experienceCount = await db.experience.count();

    if (userCount === 0) {
      return NextResponse.json({
        success: true,
        message: "No users to delete",
        deleted: { users: 0, creators: 0, experiences: 0 },
      });
    }

    // Delete all users (cascades to Creator, Experience, etc.)
    await db.user.deleteMany({});

    // Also clean up any orphaned records just in case
    await db.creator.deleteMany({});
    await db.experience.deleteMany({});
    await db.promoRedemption.deleteMany({});
    await db.betaAccess.deleteMany({});

    console.log(`[Admin] Reset test data - deleted ${userCount} users, ${creatorCount} creators, ${experienceCount} experiences`);
    console.log(`[Admin] Initiated by: ${userId || "anonymous"}`);

    return NextResponse.json({
      success: true,
      message: "All test data has been deleted from the database",
      deleted: {
        users: userCount,
        creators: creatorCount,
        experiences: experienceCount,
      },
      note: "Remember to also delete users from Clerk dashboard if you want to fully reset those accounts",
    });
  } catch (error) {
    console.error("Error resetting test data:", error);
    return NextResponse.json(
      {
        error: "Failed to reset test data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check what would be deleted (dry run)
export async function GET() {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const isVercelPreview = process.env.VERCEL_ENV === "preview";

    if (isProduction && !isVercelPreview) {
      return NextResponse.json(
        { error: "This endpoint is only available in development/preview environments" },
        { status: 403 }
      );
    }

    const userCount = await db.user.count();
    const creatorCount = await db.creator.count();
    const experienceCount = await db.experience.count();

    // Get list of emails for reference
    const users = await db.user.findMany({
      select: { email: true, displayName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to 50 most recent
    });

    return NextResponse.json({
      wouldDelete: {
        users: userCount,
        creators: creatorCount,
        experiences: experienceCount,
      },
      recentUsers: users,
      note: "Use POST to actually delete this data",
    });
  } catch (error) {
    console.error("Error checking test data:", error);
    return NextResponse.json(
      { error: "Failed to check test data" },
      { status: 500 }
    );
  }
}
