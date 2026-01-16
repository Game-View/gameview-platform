"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import {
  Play,
  Trophy,
  Users,
  Target,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Eye,
  ExternalLink,
  BarChart3,
} from "lucide-react";

/**
 * My Experiences Page - Sprint 19.3
 * Shows creator's experiences with play stats
 */
export default function MyExperiencesPage() {
  const { data, isLoading, error } = trpc.experience.myExperiences.useQuery({
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gv-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gv-neutral-400">Loading your experiences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gv-darker flex items-center justify-center">
        <div className="text-center">
          <p className="text-gv-error mb-4">Failed to load experiences</p>
          <p className="text-gv-neutral-400 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const experiences = data?.experiences ?? [];

  return (
    <div className="min-h-screen bg-gv-darker">
      {/* Header */}
      <header className="border-b border-gv-neutral-800 bg-gv-dark/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gv-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gv-neutral-700" />
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="h-6 w-6 text-gv-primary-500" />
              My Experiences
            </h1>
          </div>
          <Link
            href="/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-white text-sm rounded-lg transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {experiences.length === 0 ? (
          <div className="bg-gv-dark border border-gv-neutral-800 rounded-xl p-12 text-center">
            <Eye className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No experiences yet</h3>
            <p className="text-gv-neutral-400 mb-6">
              Create and publish your first experience to see it here with stats
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <ExperienceStatsCard key={exp.id} experience={exp} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Experience Stats Card
function ExperienceStatsCard({
  experience,
}: {
  experience: {
    id: string;
    title: string;
    status: string;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
    stats: {
      totalPlays: number;
      completions: number;
      wins: number;
      completionRate: number;
      winRate: number;
    };
  };
}) {
  const { stats } = experience;
  const isPublished = experience.status === "PUBLISHED";

  return (
    <div className="bg-gv-dark border border-gv-neutral-800 rounded-xl overflow-hidden hover:border-gv-neutral-700 transition-colors">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="sm:w-48 flex-shrink-0">
          {experience.thumbnailUrl ? (
            <img
              src={experience.thumbnailUrl}
              alt={experience.title}
              className="w-full h-32 sm:h-full object-cover"
            />
          ) : (
            <div className="w-full h-32 sm:h-full bg-gv-neutral-800 flex items-center justify-center">
              <Play className="h-8 w-8 text-gv-neutral-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{experience.title}</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    isPublished
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gv-neutral-700 text-gv-neutral-400"
                  }`}
                >
                  {experience.status}
                </span>
                {experience.publishedAt && (
                  <span className="text-xs text-gv-neutral-500">
                    Published {new Date(experience.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/viewer/${experience.id}`}
                className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
                title="View in Studio"
              >
                <Eye className="h-5 w-5" />
              </Link>
              {isPublished && (
                <Link
                  href={`${process.env.NEXT_PUBLIC_PLAYER_URL || ""}/experience/${experience.id}`}
                  target="_blank"
                  className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
                  title="Open in Player"
                >
                  <ExternalLink className="h-5 w-5" />
                </Link>
              )}
              <Link
                href={`/analytics?experience=${experience.id}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gv-primary-400 hover:text-gv-primary-300 transition-colors"
              >
                Details <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatBadge
              icon={<Play className="h-4 w-4" />}
              label="Plays"
              value={stats.totalPlays.toLocaleString()}
              color="blue"
            />
            <StatBadge
              icon={<Trophy className="h-4 w-4" />}
              label="Completions"
              value={stats.completions.toLocaleString()}
              color="green"
            />
            <StatBadge
              icon={<Target className="h-4 w-4" />}
              label="Wins"
              value={stats.wins.toLocaleString()}
              color="yellow"
            />
            <StatBadge
              icon={<Users className="h-4 w-4" />}
              label="Completion Rate"
              value={`${stats.completionRate}%`}
              color="purple"
            />
            <StatBadge
              icon={<Trophy className="h-4 w-4" />}
              label="Win Rate"
              value={`${stats.winRate}%`}
              color="orange"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Badge Component
function StatBadge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "green" | "yellow" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div className="text-center sm:text-left">
      <div className={`flex items-center justify-center sm:justify-start gap-1 mb-1 ${colorClasses[color]}`}>
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <p className="text-xs text-gv-neutral-500">{label}</p>
    </div>
  );
}
