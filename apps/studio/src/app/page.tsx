import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Sparkles, Play, Zap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gv-gradient">
      {/* Header */}
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐰</span>
          <span className="font-bold text-white text-xl tracking-wide">GAME VIEW</span>
          <span className="text-gv-primary-500 font-semibold">Studio</span>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-gv-neutral-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv font-medium transition-colors"
            >
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv font-medium transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gv-primary-500/10 border border-gv-primary-500/20 mb-8">
            <Sparkles className="h-4 w-4 text-gv-primary-500" />
            <span className="text-sm text-gv-primary-400 font-medium">AI-Powered Experience Creation</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Create immersive 3D experiences with{" "}
            <span className="text-gv-primary-500">Spark</span>
          </h1>

          <p className="text-xl text-gv-neutral-400 mb-10 max-w-2xl mx-auto">
            Transform your ideas into interactive 3D worlds. Just describe what you want to create,
            and our AI assistant will guide you from concept to published experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <Link
                href="/sign-up"
                className="px-8 py-4 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv font-semibold text-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <Zap className="h-5 w-5" />
                Spark Your First Experience
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv font-semibold text-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <Zap className="h-5 w-5" />
                Go to Dashboard
              </Link>
            </SignedIn>
            <Link
              href="#how-it-works"
              className="px-8 py-4 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-white rounded-gv font-semibold text-lg transition-colors border border-gv-neutral-700 inline-flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" />
              See How It Works
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8" id="how-it-works">
          <div className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-8">
            <div className="w-12 h-12 rounded-gv bg-gv-primary-500/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-gv-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">1. Spark Your Idea</h3>
            <p className="text-gv-neutral-400">
              Tell Spark what experience you want to create. Whether it&apos;s a treasure hunt,
              virtual tour, or interactive story — just describe your vision.
            </p>
          </div>

          <div className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-8">
            <div className="w-12 h-12 rounded-gv bg-gv-accent-500/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-gv-accent-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">2. Build Together</h3>
            <p className="text-gv-neutral-400">
              Spark guides you through the creation process — from capturing footage to
              adding interactive elements. No coding required.
            </p>
          </div>

          <div className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-8">
            <div className="w-12 h-12 rounded-gv bg-gv-success/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-gv-success" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">3. Publish & Share</h3>
            <p className="text-gv-neutral-400">
              Launch your experience on Game View and share it with the world.
              Track engagement and iterate based on player feedback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gv-neutral-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐰</span>
            <span className="font-bold text-gv-neutral-400">GAME VIEW</span>
          </div>
          <p className="text-gv-neutral-500 text-sm">
            © 2024 Game View Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
