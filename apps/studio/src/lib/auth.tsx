"use client";

import { ReactNode, useState } from "react";
import {
  useUser as useClerkUser,
  useAuth as useClerkAuth,
  useClerk as useClerkInstance,
  UserButton as ClerkUserButton,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
} from "@clerk/nextjs";

// Type for mock user (matches Clerk's User shape)
type MockUser = ReturnType<typeof useClerkUser>["user"];

/**
 * Unified Auth Module
 *
 * Provides authentication hooks and components that work in both:
 * - Production mode (with Clerk)
 * - Test mode (with mock data)
 *
 * Import from this module instead of @clerk/nextjs directly
 */

// Check if we're in test mode (placeholder key detection)
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholderKey = clerkKey === "pk_test_xxx" || clerkKey.length < 20;
export const isTestMode = process.env.NEXT_PUBLIC_SKIP_AUTH === "true" || isPlaceholderKey;

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
    creatorType: "indie_developer",
    role: "creator",
  },
  publicMetadata: {},
  privateMetadata: {},
} as unknown as MockUser;

// ============================================
// HOOKS
// ============================================

/**
 * useUser hook - returns current user
 * In test mode, returns mock user data
 */
export function useUser() {
  const clerkResult = useClerkUser();

  if (isTestMode) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: mockUser,
    };
  }

  return clerkResult;
}

/**
 * useAuth hook - returns auth state
 * In test mode, returns mock auth state
 */
export function useAuth() {
  const clerkResult = useClerkAuth();

  if (isTestMode) {
    return {
      isLoaded: true,
      isSignedIn: true,
      userId: mockUser.id,
      sessionId: "test_session_123",
      orgId: null,
      orgRole: null,
      orgSlug: null,
    };
  }

  return clerkResult;
}

/**
 * useClerk hook - returns Clerk instance
 * In test mode, returns mock methods
 */
export function useClerk() {
  const clerkResult = useClerkInstance();

  if (isTestMode) {
    return {
      signOut: () => {
        console.log("[Test Mode] Sign out called");
        window.location.href = "/";
      },
      openSignIn: () => console.log("[Test Mode] Open sign in"),
      openSignUp: () => console.log("[Test Mode] Open sign up"),
      openUserProfile: () => console.log("[Test Mode] Open user profile"),
    };
  }

  return clerkResult;
}

// ============================================
// COMPONENTS
// ============================================

/**
 * UserButton component
 * In test mode, shows a simple avatar with dropdown
 */
export function UserButton({
  appearance,
  afterSignOutUrl = "/",
}: {
  appearance?: { elements?: { avatarBox?: string } };
  afterSignOutUrl?: string;
}) {
  if (isTestMode) {
    return <TestUserButton afterSignOutUrl={afterSignOutUrl} />;
  }

  return <ClerkUserButton appearance={appearance} afterSignOutUrl={afterSignOutUrl} />;
}

function TestUserButton({ afterSignOutUrl }: { afterSignOutUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-gv-primary-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden"
      >
        <img
          src={mockUser.imageUrl}
          alt="Test User"
          className="w-full h-full object-cover"
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv shadow-xl min-w-[200px] py-2">
            <div className="px-4 py-2 border-b border-gv-neutral-700">
              <p className="text-white text-sm font-medium">{mockUser.fullName}</p>
              <p className="text-gv-neutral-400 text-xs">{mockUser.primaryEmailAddress?.emailAddress}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-gv-warning-500/20 text-gv-warning-500 text-xs rounded">
                Test Mode
              </span>
            </div>
            <button
              onClick={() => {
                console.log("[Test Mode] Sign out - redirecting to", afterSignOutUrl);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gv-neutral-300 hover:bg-gv-neutral-700"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * SignedIn component - renders children only when signed in
 * In test mode, always renders children
 */
export function SignedIn({ children }: { children: ReactNode }) {
  if (isTestMode) {
    return <>{children}</>;
  }

  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

/**
 * SignedOut component - renders children only when signed out
 * In test mode, never renders children
 */
export function SignedOut({ children }: { children: ReactNode }) {
  if (isTestMode) {
    return null;
  }

  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}
