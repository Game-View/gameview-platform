import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ToastContainer } from "@/components/ui/Toast";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game View Studio",
  description: "Create immersive 3D experiences with AI-powered tools",
};

// Check if we should skip auth (for testing)
// Skip if env var is set OR if using placeholder Clerk key
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholderKey = clerkKey === "pk_test_xxx" || clerkKey.length < 20;
const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true" || isPlaceholderKey;

function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gv-neutral-900">
        <AppProviders>
          {children}
        </AppProviders>
        <ToastContainer />
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
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#f97066",
          colorBackground: "#1e293b",
          colorInputBackground: "#0f172a",
          colorInputText: "#f8fafc",
        },
      }}
    >
      <AppContent>{children}</AppContent>
    </ClerkProvider>
  );
}
