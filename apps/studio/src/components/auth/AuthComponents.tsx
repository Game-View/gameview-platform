"use client";

import { ReactNode } from "react";

// Check if we're in test mode (client-side)
const isTestMode = () => {
  if (typeof window === "undefined") return false;
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const isPlaceholderKey = clerkKey === "pk_test_xxx" || clerkKey.length < 20;
  return skipAuth || isPlaceholderKey;
};

// In test mode, always show "signed in" state
// This simulates a logged-in user for UI testing
export function SignedIn({ children }: { children: ReactNode }) {
  if (isTestMode()) {
    // In test mode, always show signed in content
    return <>{children}</>;
  }

  // In production, use Clerk's SignedIn
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SignedIn: ClerkSignedIn } = require("@clerk/nextjs");
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

export function SignedOut({ children }: { children: ReactNode }) {
  if (isTestMode()) {
    // In test mode, hide signed out content (user is "signed in")
    return null;
  }

  // In production, use Clerk's SignedOut
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SignedOut: ClerkSignedOut } = require("@clerk/nextjs");
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}

export function UserButton() {
  if (isTestMode()) {
    // In test mode, show a mock user button
    return (
      <div className="w-8 h-8 rounded-full bg-gv-primary-500 flex items-center justify-center text-white text-sm font-medium">
        T
      </div>
    );
  }

  // In production, use Clerk's UserButton
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { UserButton: ClerkUserButton } = require("@clerk/nextjs");
  return <ClerkUserButton afterSignOutUrl="/" />;
}
