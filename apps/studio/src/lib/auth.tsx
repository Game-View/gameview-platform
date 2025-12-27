"use client";

/**
 * Unified Auth Module
 *
 * Re-exports Clerk client utilities for consistent imports across the app.
 */

export {
  useUser,
  useAuth,
  useClerk,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
