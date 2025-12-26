/**
 * @gameview/api/trpc
 * tRPC API layer for Game View platform
 */

// Export router and procedures
export {
  router,
  middleware,
  mergeRouters,
  publicProcedure,
  protectedProcedure,
  creatorProcedure,
  adminProcedure,
} from "./trpc";

// Export context utilities
export { createContext } from "./context";
export type { Context, CreateContextOptions } from "./context";

// Export app router and type
export { appRouter } from "./routers";
export type { AppRouter } from "./routers";

// Re-export superjson for client transformer
export { default as superjson } from "superjson";
