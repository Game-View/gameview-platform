import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";

export const metadata: Metadata = {
  title: "Game View - Play Immersive Experiences",
  description: "Discover and play amazing 360° interactive experiences from talented creators",
};

// Check if we should skip auth (for testing)
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholderKey = clerkKey === "pk_test_xxx" || clerkKey.length < 20;
const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true" || isPlaceholderKey;

function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-gv-neutral-900 text-white antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // In test mode, skip ClerkProvider entirely
  if (skipAuth) {
    return <AppContent>{children}</AppContent>;
  }

  // Production mode with Clerk
  // Dynamic import to avoid issues in test mode
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ClerkProvider } = require("@clerk/nextjs");

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#f97066",
          colorBackground: "#1e293b",
          colorInputBackground: "#334155",
          colorInputText: "#f8fafc",
        },
      }}
    >
      <AppContent>{children}</AppContent>
    </ClerkProvider>
  );
}
