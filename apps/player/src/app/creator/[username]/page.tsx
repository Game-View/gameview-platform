"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Users,
  Play,
  Eye,
  Sparkles,
  GraduationCap,
  Compass,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  getCreatorByUsername,
  getExperiencesByCreator,
  getSeriesByCreator,
  formatPlayCount,
  type Experience,
  type Series,
} from "@/lib/mock-data";
import { ExperienceCard } from "@/components/ExperienceCard";

const categoryIcons = {
  entertainment: Sparkles,
  education: GraduationCap,
  exploration: Compass,
};

const categoryColors = {
  entertainment: "text-gv-primary-500 bg-gv-primary-500/10",
  education: "text-gv-accent-500 bg-gv-accent-500/10",
  exploration: "text-gv-warning-500 bg-gv-warning-500/10",
};

function SeriesSection({ series, experiences }: { series: Series; experiences: Experience[] }) {
  const seriesExperiences = experiences.filter((e) => series.experienceIds.includes(e.id));

  if (seriesExperiences.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {series.title}
            <span className="text-sm font-normal text-gv-neutral-500">
              ({seriesExperiences.length} experience{seriesExperiences.length !== 1 ? "s" : ""})
            </span>
          </h3>
          {series.description && (
            <p className="text-sm text-gv-neutral-400 mt-1">{series.description}</p>
          )}
        </div>
        <Link
          href={`/series/${series.id}`}
          className="text-sm text-gv-primary-500 hover:text-gv-primary-400 flex items-center gap-1"
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {seriesExperiences.slice(0, 3).map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} showCreator={false} />
        ))}
      </div>
    </div>
  );
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [activeTab, setActiveTab] = useState<"all" | "series">("all");

  const creator = getCreatorByUsername(username);
  const experiences = creator ? getExperiencesByCreator(creator.id) : [];
  const series = creator ? getSeriesByCreator(creator.id) : [];

  // Calculate total plays across all experiences
  const totalPlays = experiences.reduce((sum, exp) => sum + exp.playCount, 0);

  if (!creator) {
    return (
      <div className="min-h-screen bg-gv-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Creator Not Found</h1>
          <p className="text-gv-neutral-400 mb-6">
            The creator you're looking for doesn't exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-full transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[creator.category as keyof typeof categoryIcons];
  const categoryColor = categoryColors[creator.category as keyof typeof categoryColors];

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Back Navigation */}
      <div className="sticky top-0 z-50 bg-gv-neutral-900/95 backdrop-blur border-b border-gv-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-gv-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-gv-neutral-700 to-gv-neutral-800">
        {creator.banner && (
          <Image
            src={creator.banner}
            alt=""
            fill
            className="object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gv-neutral-900 via-transparent to-transparent" />
      </div>

      {/* Creator Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 sm:-mt-20 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-gv-neutral-900 shrink-0">
              <Image
                src={creator.avatar}
                alt={creator.displayName}
                fill
                className="object-cover"
              />
            </div>

            {/* Name & Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {creator.displayName}
                </h1>
                {creator.isVerified && (
                  <CheckCircle className="h-6 w-6 text-gv-primary-500" fill="currentColor" />
                )}
                {CategoryIcon && (
                  <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${categoryColor}`}>
                    <CategoryIcon className="h-3.5 w-3.5" />
                    <span className="capitalize">{creator.category}</span>
                  </span>
                )}
              </div>
              <p className="text-gv-neutral-400">@{creator.username}</p>
            </div>

            {/* Follow Button */}
            <button className="px-6 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-full transition-colors shrink-0">
              Follow
            </button>
          </div>

          {/* Tagline */}
          {creator.tagline && (
            <p className="text-gv-neutral-300 mt-4 max-w-2xl">
              {creator.tagline}
            </p>
          )}

          {/* Bio */}
          {creator.bio && (
            <p className="text-gv-neutral-400 mt-2 max-w-2xl">
              {creator.bio}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex flex-wrap gap-6 mt-6 py-4 border-t border-gv-neutral-800">
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {formatPlayCount(creator.followers)}
              </div>
              <div className="text-sm text-gv-neutral-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {experiences.length}
              </div>
              <div className="text-sm text-gv-neutral-500">Experiences</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {series.length}
              </div>
              <div className="text-sm text-gv-neutral-500">Series</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {formatPlayCount(totalPlays)}
              </div>
              <div className="text-sm text-gv-neutral-500">Total Plays</div>
            </div>
          </div>

          {/* Social Links */}
          {creator.socialLinks && Object.keys(creator.socialLinks).length > 0 && (
            <div className="flex gap-3 mt-4">
              {Object.entries(creator.socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-gv-neutral-300 text-sm rounded-full transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="capitalize">{platform}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gv-neutral-800 mb-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "all"
                  ? "text-white border-gv-primary-500"
                  : "text-gv-neutral-400 border-transparent hover:text-white"
              }`}
            >
              All Experiences
            </button>
            <button
              onClick={() => setActiveTab("series")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "series"
                  ? "text-white border-gv-primary-500"
                  : "text-gv-neutral-400 border-transparent hover:text-white"
              }`}
            >
              Series ({series.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pb-12">
          {activeTab === "series" && series.length > 0 ? (
            // Series View
            <div>
              {series.map((s) => (
                <SeriesSection key={s.id} series={s} experiences={experiences} />
              ))}

              {/* Uncategorized experiences */}
              {(() => {
                const categorizedIds = series.flatMap((s) => s.experienceIds);
                const uncategorized = experiences.filter(
                  (e) => !categorizedIds.includes(e.id)
                );
                if (uncategorized.length === 0) return null;
                return (
                  <div className="mt-10">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Other Experiences
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {uncategorized.map((exp) => (
                        <ExperienceCard key={exp.id} experience={exp} showCreator={false} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            // All Experiences Grid
            <div>
              {experiences.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {experiences.map((exp) => (
                    <ExperienceCard key={exp.id} experience={exp} showCreator={false} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Play className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
                  <p className="text-gv-neutral-400">
                    No experiences published yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
