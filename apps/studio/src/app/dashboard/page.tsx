"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Plus,
  Sparkles,
  FolderOpen,
  Settings,
  Clock,
  Target,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import type { StoredBrief } from "@/lib/briefs";

const EXPERIENCE_TYPE_LABELS: Record<string, string> = {
  treasure_hunt: "Treasure Hunt",
  virtual_tour: "Virtual Tour",
  interactive_story: "Interactive Story",
  competition: "Competition",
  brand_experience: "Brand Experience",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gv-neutral-600",
  in_progress: "bg-gv-warning-500",
  ready: "bg-gv-success",
};

export default function DashboardPage() {
  const { user } = useUser();
  const [briefs, setBriefs] = useState<StoredBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const metadata = user?.unsafeMetadata as {
    profileCompleted?: boolean;
    creatorType?: string;
  } | undefined;

  // Fetch briefs on mount
  useEffect(() => {
    async function fetchBriefs() {
      try {
        const response = await fetch("/api/briefs");
        if (response.ok) {
          const data = await response.json();
          setBriefs(data);
        }
      } catch (error) {
        console.error("Failed to fetch briefs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBriefs();
  }, []);

  // Delete (archive) a brief
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/briefs/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setBriefs((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete brief:", error);
    }
    setActiveMenu(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

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
              ? "Ready to create your next experience?"
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

        {/* Recent Projects / Briefs */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Your Projects</h2>

          {isLoading ? (
            <div className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-gv-neutral-400 animate-spin" />
            </div>
          ) : briefs.length === 0 ? (
            <div className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-12 text-center">
              <p className="text-gv-neutral-500">
                No projects yet. Start with Spark to create your first experience!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefs.map((brief) => (
                <div
                  key={brief.id}
                  className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-5 hover:border-gv-neutral-600 transition-all relative group"
                >
                  {/* Menu Button */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => setActiveMenu(activeMenu === brief.id ? null : brief.id)}
                      className="p-1.5 text-gv-neutral-500 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenu === brief.id && (
                      <div className="absolute right-0 top-8 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv shadow-lg z-10 py-1 min-w-[140px]">
                        <button
                          onClick={() => handleDelete(brief.id)}
                          className="w-full px-4 py-2 text-left text-sm text-gv-error hover:bg-gv-neutral-700 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`w-2 h-2 rounded-full ${STATUS_COLORS[brief.status] || STATUS_COLORS.draft}`}
                    />
                    <span className="text-xs text-gv-neutral-400 capitalize">
                      {brief.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-1 pr-8">
                    {brief.name || "Untitled Project"}
                  </h3>

                  {/* Tagline */}
                  {brief.tagline && (
                    <p className="text-gv-neutral-400 text-sm mb-3 line-clamp-2">
                      {brief.tagline}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-gv-neutral-500 mb-4">
                    {brief.experienceType && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {EXPERIENCE_TYPE_LABELS[brief.experienceType] || brief.experienceType}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(brief.updatedAt)}
                    </span>
                  </div>

                  {/* Completeness */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gv-neutral-400">Brief</span>
                      <span className="text-gv-neutral-300">{brief.completeness}%</span>
                    </div>
                    <div className="h-1.5 bg-gv-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gv-primary-500 transition-all"
                        style={{ width: `${brief.completeness}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/spark?brief=${brief.id}`}
                    className="block w-full py-2 text-center text-sm font-medium text-gv-primary-500 hover:text-gv-primary-400 bg-gv-primary-500/10 hover:bg-gv-primary-500/20 rounded-gv transition-colors"
                  >
                    Continue with Spark
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
