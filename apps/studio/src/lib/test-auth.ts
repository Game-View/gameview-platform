"use client";

import { ReactNode } from "react";

/**
 * Mock Auth Provider for testing without Clerk
 * Provides fake auth context when NEXT_PUBLIC_SKIP_AUTH=true
 */

// Mock user for testing
export const mockUser = {
  id: "test_user_123",
  firstName: "Test",
  lastName: "Creator",
  fullName: "Test Creator",
  emailAddresses: [{ emailAddress: "test@gameview.app" }],
  primaryEmailAddress: { emailAddress: "test@gameview.app" },
  imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=gameview",
  unsafeMetadata: {
    profileCompleted: true,
    role: "creator",
  },
};

// Simple provider that just renders children
export function TestAuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Mock hooks that mimic Clerk's API
export function useTestAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: mockUser.id,
    user: mockUser,
    sessionId: "test_session_123",
  };
}

export function useTestUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: mockUser,
  };
}

// Check if we're in test mode
export function isTestMode() {
  return process.env.NEXT_PUBLIC_SKIP_AUTH === "true";
}
