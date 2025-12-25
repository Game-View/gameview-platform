import { NextResponse, NextRequest } from "next/server";

// Check if we should skip auth (for local testing)
// Skip if env var is set OR if using placeholder Clerk key
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholderKey = clerkKey === "pk_test_xxx" || clerkKey.length < 20;
const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true" || isPlaceholderKey;

// Test mode middleware - bypasses all auth
function testModeMiddleware(_req: NextRequest) {
  // In test mode, allow all routes
  return NextResponse.next();
}

// Only import and use Clerk when not in test mode
let productionMiddleware: (req: NextRequest) => Promise<NextResponse> | NextResponse;

if (!skipAuth) {
  // Dynamic import to avoid loading Clerk in test mode
  const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");
  const { clerkClient } = require("@clerk/nextjs/server");

  // Public routes that don't require authentication
  const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
  ]);

  // Routes that require a completed profile
  const requiresProfile = createRouteMatcher([
    "/dashboard(.*)",
    "/projects(.*)",
    "/spark(.*)",
    "/settings(.*)",
  ]);

  // Routes that are part of onboarding (don't redirect from these)
  const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

  // API routes (skip profile check)
  const isApiRoute = createRouteMatcher(["/api(.*)"]);

  productionMiddleware = clerkMiddleware(async (auth: () => Promise<{ userId: string | null }>, req: NextRequest) => {
    const { userId } = await auth();

    // Allow public routes
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // Require authentication for all other routes
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Skip profile check for API routes and onboarding
    if (isApiRoute(req) || isOnboardingRoute(req)) {
      return NextResponse.next();
    }

    // Check if profile is required but not completed
    if (requiresProfile(req)) {
      try {
        // Get user from Clerk to check metadata
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const profileCompleted = user.unsafeMetadata?.profileCompleted as boolean | undefined;

        if (!profileCompleted) {
          // Redirect to onboarding
          return NextResponse.redirect(new URL("/onboarding", req.url));
        }
      } catch (error) {
        console.error("Error checking profile status:", error);
        // On error, allow through but log it
      }
    }

    return NextResponse.next();
  });
} else {
  productionMiddleware = testModeMiddleware;
}

// Export the appropriate middleware based on mode
export default skipAuth ? testModeMiddleware : productionMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
