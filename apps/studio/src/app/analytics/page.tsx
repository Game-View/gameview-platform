"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import {
  BarChart3,
  Play,
  Trophy,
  Users,
  Clock,
  TrendingUp,
  Target,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Star,
  Medal,
} from "lucide-react";

export default function AnalyticsPage() {
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);

  // Fetch overview stats
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.overview.useQuery();

  // Fetch experience rankings
  const { data: rankings, isLoading: rankingsLoading } = trpc.analytics.rankings.useQuery();

  // Fetch selected experience details
  const { data: experienceStats, isLoading: experienceLoading } = trpc.analytics.experience.useQuery(
    { experienceId: selectedExperience! },
    { enabled: !!selectedExperience }
  );

  const isLoading = overviewLoading || rankingsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gv-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gv-neutral-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Show experience detail view
  if (selectedExperience && experienceStats) {
    return (
      <ExperienceDetailView
        data={experienceStats}
        onBack={() => setSelectedExperience(null)}
      />
    );
  }

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
              <BarChart3 className="h-6 w-6 text-gv-primary-500" />
              Analytics
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Play className="h-5 w-5" />}
              label="Total Plays"
              value={overview?.totalPlays.toLocaleString() ?? "0"}
              color="blue"
            />
            <StatCard
              icon={<Trophy className="h-5 w-5" />}
              label="Completions"
              value={overview?.completions.toLocaleString() ?? "0"}
              subValue={`${overview?.completionRate ?? 0}% rate`}
              color="green"
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Unique Players"
              value={overview?.uniquePlayers.toLocaleString() ?? "0"}
              color="purple"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Total Play Time"
              value={formatPlayTime(overview?.totalPlayTime ?? 0)}
              color="orange"
            />
          </div>
        </section>

        {/* Secondary Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Wins"
              value={overview?.wins.toLocaleString() ?? "0"}
              subValue={`${overview?.winRate ?? 0}% win rate`}
              color="yellow"
            />
            <StatCard
              icon={<Star className="h-5 w-5" />}
              label="Published"
              value={overview?.publishedCount.toString() ?? "0"}
              subValue={`of ${overview?.experienceCount ?? 0} total`}
              color="pink"
            />
          </div>
        </section>

        {/* Plays Over Time Chart */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Plays Over Time (Last 30 Days)</h2>
          <div className="bg-gv-dark border border-gv-neutral-800 rounded-xl p-6">
            {overview?.playsOverTime && overview.playsOverTime.length > 0 ? (
              <SimpleBarChart data={overview.playsOverTime} />
            ) : (
              <div className="text-center py-12 text-gv-neutral-400">
                No play data yet. Publish an experience and share it to see stats!
              </div>
            )}
          </div>
        </section>

        {/* Experience Rankings */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Experience Performance</h2>
          {rankings && rankings.length > 0 ? (
            <div className="bg-gv-dark border border-gv-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gv-darker border-b border-gv-neutral-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                        Total Plays
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                        Completions
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                        Completion Rate
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                        Players
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gv-neutral-800">
                    {rankings.map((exp, index) => (
                      <tr
                        key={exp.id}
                        className="hover:bg-gv-neutral-900/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedExperience(exp.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                              {index === 0 ? (
                                <Medal className="h-6 w-6 text-yellow-400" />
                              ) : index === 1 ? (
                                <Medal className="h-6 w-6 text-gray-400" />
                              ) : index === 2 ? (
                                <Medal className="h-6 w-6 text-amber-600" />
                              ) : (
                                <span className="text-gv-neutral-500 font-medium">{index + 1}</span>
                              )}
                            </div>
                            {exp.thumbnailUrl ? (
                              <img
                                src={exp.thumbnailUrl}
                                alt={exp.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gv-neutral-800 flex items-center justify-center">
                                <Play className="h-5 w-5 text-gv-neutral-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white">{exp.title}</p>
                              {exp.publishedAt && (
                                <p className="text-xs text-gv-neutral-400">
                                  Published {new Date(exp.publishedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-white">{exp.totalPlays.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-green-400">{exp.completions.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gv-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gv-primary-500 rounded-full"
                                style={{ width: `${exp.completionRate}%` }}
                              />
                            </div>
                            <span className="text-sm text-gv-neutral-400">{exp.completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-purple-400">{exp.uniquePlayers.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-gv-neutral-400 hover:text-white transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gv-dark border border-gv-neutral-800 rounded-xl p-12 text-center">
              <BarChart3 className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No experiences yet</h3>
              <p className="text-gv-neutral-400 mb-6">
                Publish your first experience to start seeing analytics
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: "blue" | "green" | "purple" | "orange" | "yellow" | "pink";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
    purple: "bg-purple-500/10 text-purple-400",
    orange: "bg-orange-500/10 text-orange-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
    pink: "bg-pink-500/10 text-pink-400",
  };

  return (
    <div className="bg-gv-dark border border-gv-neutral-800 rounded-xl p-6">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gv-neutral-400">{label}</p>
      {subValue && <p className="text-xs text-gv-neutral-500 mt-1">{subValue}</p>}
    </div>
  );
}

// Simple Bar Chart Component (SVG-based)
function SimpleBarChart({ data }: { data: { date: string; plays: number }[] }) {
  const maxPlays = Math.max(...data.map((d) => d.plays), 1);
  const chartHeight = 200;

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gv-neutral-500">
        <span>{maxPlays}</span>
        <span>{Math.floor(maxPlays / 2)}</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="ml-14">
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {data.map((d, i) => {
            const barWidth = 100 / data.length;
            const barHeight = (d.plays / maxPlays) * (chartHeight - 20);
            const x = i * barWidth + barWidth * 0.1;
            const y = chartHeight - barHeight - 20;

            return (
              <g key={d.date}>
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth * 0.8}%`}
                  height={barHeight}
                  rx={3}
                  className="fill-gv-primary-500/80 hover:fill-gv-primary-400 transition-colors cursor-pointer"
                />
                {/* Show value on hover */}
                <title>{`${d.date}: ${d.plays} plays`}</title>
              </g>
            );
          })}
          {/* X-axis line */}
          <line
            x1="0"
            y1={chartHeight - 20}
            x2="100%"
            y2={chartHeight - 20}
            className="stroke-gv-neutral-700"
          />
        </svg>

        {/* X-axis labels (show every 5th day) */}
        <div className="flex justify-between text-xs text-gv-neutral-500 mt-2 px-1">
          {data
            .filter((_, i) => i % 5 === 0 || i === data.length - 1)
            .map((d) => (
              <span key={d.date}>{new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            ))}
        </div>
      </div>
    </div>
  );
}

// Experience Detail View Component
function ExperienceDetailView({
  data,
  onBack,
}: {
  data: NonNullable<ReturnType<typeof trpc.analytics.experience.useQuery>["data"]>;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-gv-darker">
      {/* Header */}
      <header className="border-b border-gv-neutral-800 bg-gv-dark/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gv-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Overview</span>
            </button>
            <div className="h-6 w-px bg-gv-neutral-700" />
            <h1 className="text-xl font-bold text-white">{data.experience.title}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Play className="h-5 w-5" />} label="Total Plays" value={data.stats.totalPlays.toLocaleString()} color="blue" />
            <StatCard
              icon={<Trophy className="h-5 w-5" />}
              label="Completions"
              value={data.stats.completions.toLocaleString()}
              subValue={`${data.stats.completionRate}% rate`}
              color="green"
            />
            <StatCard icon={<Users className="h-5 w-5" />} label="Unique Players" value={data.stats.uniquePlayers.toLocaleString()} color="purple" />
            <StatCard icon={<Clock className="h-5 w-5" />} label="Avg Play Time" value={formatPlayTime(data.stats.avgPlayTime)} color="orange" />
          </div>
        </section>

        {/* Secondary Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Wins"
              value={data.stats.wins.toLocaleString()}
              subValue={`${data.stats.winRate}% win rate`}
              color="yellow"
            />
            <StatCard icon={<Star className="h-5 w-5" />} label="High Score" value={data.stats.highScore.toLocaleString()} color="pink" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg Score" value={data.stats.avgScore.toLocaleString()} color="blue" />
          </div>
        </section>

        {/* Plays Over Time Chart */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Plays Over Time (Last 30 Days)</h2>
          <div className="bg-gv-dark border border-gv-neutral-800 rounded-xl p-6">
            <SimpleBarChart data={data.playsOverTime} />
          </div>
        </section>

        {/* Top Scores */}
        {data.topScores.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Top Scores</h2>
            <div className="bg-gv-dark border border-gv-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gv-darker border-b border-gv-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                      Play Time
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gv-neutral-400 uppercase tracking-wider">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gv-neutral-800">
                  {data.topScores.map((score, index) => (
                    <tr key={`${score.userId}-${index}`} className="hover:bg-gv-neutral-900/50">
                      <td className="px-6 py-4">
                        {index === 0 ? (
                          <Medal className="h-5 w-5 text-yellow-400" />
                        ) : index === 1 ? (
                          <Medal className="h-5 w-5 text-gray-400" />
                        ) : index === 2 ? (
                          <Medal className="h-5 w-5 text-amber-600" />
                        ) : (
                          <span className="text-gv-neutral-500">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {score.avatarUrl ? (
                            <img src={score.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gv-neutral-700 flex items-center justify-center text-xs">
                              {score.displayName?.[0] || "?"}
                            </div>
                          )}
                          <span className="text-white">{score.displayName || "Anonymous"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-yellow-400">{score.score.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-gv-neutral-400">
                        {formatPlayTime(score.playTime)}
                      </td>
                      <td className="px-6 py-4 text-right text-gv-neutral-400">
                        {score.completedAt ? new Date(score.completedAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Helper function to format play time
function formatPlayTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
