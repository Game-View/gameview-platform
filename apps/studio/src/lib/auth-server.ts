/**
 * Server-Side Auth Module
 *
 * Provides authentication helpers for API routes that work in both:
 * - Production mode (with Clerk)
 * - Test mode (with mock data)
 *
 * Import from this module instead of @clerk/nextjs/server directly
 */

// Check if we're in test mode (placeholder key detection)
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholderKey = clerkKey === "pk_test_xxx" || clerkKey.length < 20;
const isTestMode = process.env.NEXT_PUBLIC_SKIP_AUTH === "true" || isPlaceholderKey;

// Mock user ID for testing
const MOCK_USER_ID = "test_user_123";

/**
 * Server-side auth function
 * In test mode, returns mock user data
 * In production, uses Clerk's auth()
 */
export async function auth(): Promise<{
  userId: string | null;
  sessionId: string | null;
  orgId: string | null;
  orgRole: string | null;
  orgSlug: string | null;
}> {
  if (isTestMode) {
    return {
      userId: MOCK_USER_ID,
      sessionId: "test_session_123",
      orgId: null,
      orgRole: null,
      orgSlug: null,
    };
  }

  // Use Clerk auth in production
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs/server");
  return clerk.auth();
}

/**
 * currentUser function for server components
 * In test mode, returns mock user
 */
export async function currentUser() {
  if (isTestMode) {
    return {
      id: MOCK_USER_ID,
      firstName: "Test",
      lastName: "Creator",
      fullName: "Test Creator",
      emailAddresses: [{ emailAddress: "test@gameview.app" }],
      primaryEmailAddress: { emailAddress: "test@gameview.app" },
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=gameview",
      unsafeMetadata: {
        profileCompleted: true,
        creatorType: "indie_developer",
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs/server");
  return clerk.currentUser();
}

/**
 * clerkClient function for API routes
 * In test mode, returns mock client with users methods
 */
export async function clerkClient() {
  if (isTestMode) {
    return {
      users: {
        getUser: async () => ({
          id: MOCK_USER_ID,
          firstName: "Test",
          lastName: "Creator",
          fullName: "Test Creator",
          emailAddresses: [{ emailAddress: "test@gameview.app" }],
          primaryEmailAddress: { emailAddress: "test@gameview.app" },
          imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=gameview",
          unsafeMetadata: {
            profileCompleted: true,
            creatorType: "indie_developer",
            experienceLevel: "intermediate",
            creationGoals: ["marketing", "entertainment"],
            footageStatus: "have_footage",
          },
        }),
        updateUser: async () => ({
          id: MOCK_USER_ID,
          unsafeMetadata: {},
        }),
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs/server");
  return clerk.clerkClient();
}

export { isTestMode, MOCK_USER_ID };
