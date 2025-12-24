"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Plus, Sparkles, FolderOpen, Settings } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const metadata = user?.unsafeMetadata as {
    profileCompleted?: boolean;
    creatorType?: string;
  } | undefined;

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Header */}
      <header className="border-b border-gv-neutral-800 bg-gv-neutral-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐰</span>
            <span className="font-bold text-white text-xl tracking-wide">GAME VIEW</span>
            <span className="text-gv-primary-500 font-semibold">Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-gv-neutral-400">
            {metadata?.creatorType
              ? `Ready to create your next experience?`
              : "Let's build something amazing together."}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link
            href="/spark"
            className="group p-6 bg-gv-primary-500/10 border border-gv-primary-500/30 rounded-gv-lg hover:border-gv-primary-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-gv bg-gv-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-gv-primary-500/30 transition-colors">
              <Sparkles className="h-6 w-6 text-gv-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Start with Spark</h3>
            <p className="text-gv-neutral-400 text-sm">
              Describe your vision and let AI help you build it
            </p>
          </Link>

          <button className="group p-6 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg hover:border-gv-neutral-600 transition-all text-left">
            <div className="w-12 h-12 rounded-gv bg-gv-neutral-700 flex items-center justify-center mb-4 group-hover:bg-gv-neutral-600 transition-colors">
              <Plus className="h-6 w-6 text-gv-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">New Project</h3>
            <p className="text-gv-neutral-400 text-sm">
              Create a blank project and build from scratch
            </p>
          </button>

          <button className="group p-6 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg hover:border-gv-neutral-600 transition-all text-left">
            <div className="w-12 h-12 rounded-gv bg-gv-neutral-700 flex items-center justify-center mb-4 group-hover:bg-gv-neutral-600 transition-colors">
              <FolderOpen className="h-6 w-6 text-gv-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Open Project</h3>
            <p className="text-gv-neutral-400 text-sm">
              Continue working on an existing project
            </p>
          </button>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Recent Projects</h2>
          <div className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-12 text-center">
            <p className="text-gv-neutral-500">
              No projects yet. Start with Spark to create your first experience!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
