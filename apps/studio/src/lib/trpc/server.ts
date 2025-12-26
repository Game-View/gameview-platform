import { appRouter, createContext } from "@gameview/api/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { auth } from "@clerk/nextjs/server";
import { db } from "@gameview/database";

/**
 * Handle tRPC requests in Next.js API routes
 */
export async function handleTRPCRequest(req: Request) {
  // Get the user ID from Clerk
  const { userId: clerkId } = await auth();

  // Look up the user in our database if they're authenticated
  let userId: string | null = null;
  if (clerkId) {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    userId = user?.id ?? null;
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
