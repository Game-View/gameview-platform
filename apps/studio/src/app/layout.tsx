import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ToastContainer } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game View Studio",
  description: "Create immersive 3D experiences with AI-powered tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <html lang="en" className="dark">
        <body className="min-h-screen bg-gv-neutral-900">
          {children}
          <ToastContainer />
        </body>
      </html>
    </ClerkProvider>
  );
}
