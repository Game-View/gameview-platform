import { appRouter, createContext } from "@gameview/api/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { auth } from "@clerk/nextjs/server";
import { db } from "@gameview/database";

/**
 * Ensure user has a Creator record (for users who completed onboarding before this was added)
 */
async function ensureCreatorExists(userId: string, email: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { creator: true },
  });

  if (user && !user.creator) {
    // Generate username from display name or email
    const baseUsername = (user.displayName || email.split("@")[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 20) || "creator";

    let username = baseUsername;
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.creator.findUnique({ where: { username } });
      if (!existing) break;
      username = `${baseUsername}_${Math.random().toString(36).slice(2, 6)}`;
      attempts++;
    }

    await db.creator.create({
      data: {
        userId: user.id,
        username,
        displayName: user.displayName || "Creator",
      },
    });
  }
}

/**
 * Handle tRPC requests in Next.js API routes
 */
export async function handleTRPCRequest(req: Request) {
  // Get the user ID from Clerk
  const { userId: clerkId } = await auth();

  // Look up the user in our database if they're authenticated
  let userId: string | null = null;
  let userEmail: string | null = null;

  if (clerkId) {
    let user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true },
    });

    // If user doesn't exist in database, create them (webhook fallback)
    if (!user) {
      console.log("[tRPC] User not in database, fetching from Clerk:", clerkId);
      try {
        // Dynamically import Clerk to get user data
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkId);

        const primaryEmail = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        );

        if (primaryEmail) {
          const displayName = [clerkUser.firstName, clerkUser.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || "User";

          user = await db.user.create({
            data: {
              clerkId,
              email: primaryEmail.emailAddress,
              displayName,
              avatarUrl: clerkUser.imageUrl,
              role: "CREATOR", // Default to creator for Studio app
            },
            select: { id: true, email: true },
          });
          console.log("[tRPC] Created user in database:", user.id);
        }
      } catch (createError) {
        console.error("[tRPC] Failed to create user from Clerk:", createError);
      }
    }

    userId = user?.id ?? null;
    userEmail = user?.email ?? null;

    // Ensure Creator record exists for users who completed onboarding before this fix
    if (userId && userEmail) {
      try {
        await ensureCreatorExists(userId, userEmail);
      } catch (error) {
        console.error("Failed to ensure creator exists:", error);
        // Don't block the request if this fails
      }
    }
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createContext({
        userId,
        req,
      }),
    onError: ({ error, path }) => {
      console.error(`tRPC error on path '${path}':`, error);
    },
  });
}
