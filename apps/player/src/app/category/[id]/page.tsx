"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Compass,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Clock,
  Heart,
  CheckCircle,
} from "lucide-react";
import {
  getExperiencesByCategory,
  getFollowedCreatorsByCategory,
  getExperiencesFromFollowedCreators,
  getMoreLikeRecommendations,
  getPopularInCategory,
  getNewInCategory,
  getCreatorsToDiscover,
  getCreatorById,
  mockCreators,
  type Creator,
} from "@/lib/mock-data";
import { ExperienceCard } from "@/components/ExperienceCard";
import { CreatorCard } from "@/components/CreatorCard";

const CATEGORIES: Record<string, { label: string; icon: typeof Sparkles; color: string; bgColor: string; description: string }> = {
  entertainment: {
    label: "Entertainment",
    icon: Sparkles,
    color: "text-gv-primary-500",
    bgColor: "bg-gv-primary-500/10",
    description: "Immersive games, interactive stories, and thrilling adventures",
  },
  education: {
    label: "Education",
    icon: GraduationCap,
    color: "text-gv-accent-500",
    bgColor: "bg-gv-accent-500/10",
    description: "Learn through exploration with interactive educational experiences",
  },
  exploration: {
    label: "Exploration",
    icon: Compass,
    color: "text-gv-warning-500",
    bgColor: "bg-gv-warning-500/10",
    description: "Discover new worlds, travel to amazing places, and explore the unknown",
  },
};

type SortOption = "popular" | "newest" | "price-low" | "price-high";

// Section component for consistent styling
function Section({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
  showViewAll,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof TrendingUp;
  iconColor?: string;
  children: React.ReactNode;
  showViewAll?: boolean;
  viewAllHref?: string;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 rounded-gv ${iconColor || "bg-gv-neutral-800 text-gv-neutral-400"}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-gv-neutral-400">{subtitle}</p>}
          </div>
        </div>
        {showViewAll && viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-gv-primary-500 hover:text-gv-primary-400 flex items-center gap-1"
          >
            See All <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

// Followed creator row with their experiences
function BecauseYouFollowSection({ creator, categoryId }: { creator: Creator; categoryId: string }) {
  const experiences = getExperiencesFromFollowedCreators(categoryId).filter(
    (e) => e.creatorId === creator.id
  );

  if (experiences.length === 0) return null;

  return (
    <Section
      title={`Because you follow ${creator.displayName}`}
      icon={Heart}
      iconColor="bg-gv-primary-500/10 text-gv-primary-500"
    >
      <div className="mb-4">
        <Link
          href={`/creator/${creator.username}`}
          className="inline-flex items-center gap-3 p-3 bg-gv-neutral-800/50 rounded-gv-lg hover:bg-gv-neutral-800 transition-colors"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image src={creator.avatar} alt={creator.displayName} fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white">{creator.displayName}</span>
              {creator.isVerified && (
                <CheckCircle className="h-4 w-4 text-gv-primary-500" fill="currentColor" />
              )}
            </div>
            <p className="text-xs text-gv-neutral-400">
              {experiences.length} experience{experiences.length !== 1 ? "s" : ""} in this category
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gv-neutral-500 ml-auto" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiences.slice(0, 3).map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} showCreator={false} />
        ))}
      </div>
    </Section>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [activeTab, setActiveTab] = useState<"for-you" | "browse">("for-you");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const category = CATEGORIES[categoryId];
  const allExperiences = getExperiencesByCategory(categoryId);
  const allCreators = mockCreators.filter((c) => c.category === categoryId);

  // Personalization data
  const followedCreators = getFollowedCreatorsByCategory(categoryId);
  const moreLikeRecommendations = getMoreLikeRecommendations(categoryId, 6);
  const popularExperiences = getPopularInCategory(categoryId, 6);
  const newExperiences = getNewInCategory(categoryId, 6);
  const creatorsToDiscover = getCreatorsToDiscover(categoryId, 4);

  // For "Browse All" tab - filter and sort
  let filteredExperiences = allExperiences;
  if (showFreeOnly) {
    filteredExperiences = filteredExperiences.filter((e) => e.price === 0);
  }
  const sortedExperiences = [...filteredExperiences].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "popular":
      default:
        return b.playCount - a.playCount;
    }
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-gv-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Category Not Found</h1>
          <p className="text-gv-neutral-400 mb-6">
            The category you&apos;re looking for doesn&apos;t exist.
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

  const CategoryIcon = category.icon;
  const hasPersonalization = followedCreators.length > 0 || moreLikeRecommendations.length > 0;

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

      {/* Category Header */}
      <div className="bg-gradient-to-b from-gv-neutral-800/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-gv-lg ${category.bgColor} ${category.color}`}>
              <CategoryIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{category.label}</h1>
              <p className="text-gv-neutral-400 mt-1">{category.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 text-sm text-gv-neutral-400">
            <span>{allExperiences.length} experiences</span>
            <span>•</span>
            <span>{allCreators.length} creators</span>
            {followedCreators.length > 0 && (
              <>
                <span>•</span>
                <span className="text-gv-primary-500">
                  Following {followedCreators.length} creator{followedCreators.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gv-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("for-you")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "for-you"
                  ? "text-white border-gv-primary-500"
                  : "text-gv-neutral-400 border-transparent hover:text-white"
              }`}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "browse"
                  ? "text-white border-gv-primary-500"
                  : "text-gv-neutral-400 border-transparent hover:text-white"
              }`}
            >
              Browse All
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "for-you" ? (
          <>
            {/* Personalized "For You" Tab */}

            {/* Because You Follow sections - one per followed creator */}
            {followedCreators.map((creator) => (
              <BecauseYouFollowSection key={creator.id} creator={creator} categoryId={categoryId} />
            ))}

            {/* More Like What You've Played */}
            {moreLikeRecommendations.length > 0 && (
              <Section
                title="More Like What You've Played"
                subtitle="Based on your play history"
                icon={Sparkles}
                iconColor="bg-gv-accent-500/10 text-gv-accent-500"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {moreLikeRecommendations.map((exp) => (
                    <ExperienceCard key={exp.id} experience={exp} />
                  ))}
                </div>
              </Section>
            )}

            {/* Popular in Category */}
            {popularExperiences.length > 0 && (
              <Section
                title={`Popular in ${category.label}`}
                subtitle="Most played experiences"
                icon={TrendingUp}
                iconColor="bg-gv-warning-500/10 text-gv-warning-500"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularExperiences.map((exp) => (
                    <ExperienceCard key={exp.id} experience={exp} />
                  ))}
                </div>
              </Section>
            )}

            {/* New Releases */}
            {newExperiences.length > 0 && (
              <Section
                title="New Releases"
                subtitle="Recently published"
                icon={Clock}
                iconColor="bg-gv-neutral-700 text-gv-neutral-300"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {newExperiences.map((exp) => (
                    <ExperienceCard key={exp.id} experience={exp} />
                  ))}
                </div>
              </Section>
            )}

            {/* Creators to Discover */}
            {creatorsToDiscover.length > 0 && (
              <Section
                title="Creators to Discover"
                subtitle={`Popular ${category.label.toLowerCase()} creators you're not following`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {creatorsToDiscover.map((creator) => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              </Section>
            )}

            {/* Empty state if no personalization */}
            {!hasPersonalization && popularExperiences.length === 0 && (
              <div className="text-center py-12">
                <CategoryIcon className={`h-12 w-12 mx-auto mb-4 ${category.color} opacity-50`} />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nothing personalized yet
                </h3>
                <p className="text-gv-neutral-400 mb-4">
                  Follow some creators or play some experiences to get personalized recommendations.
                </p>
                <button
                  onClick={() => setActiveTab("browse")}
                  className="text-gv-primary-500 hover:text-gv-primary-400"
                >
                  Browse all {category.label.toLowerCase()} experiences →
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Browse All Tab */}

            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                {/* Free Only Toggle */}
                <button
                  onClick={() => setShowFreeOnly(!showFreeOnly)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    showFreeOnly
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-gv-neutral-800 text-gv-neutral-400 border border-gv-neutral-700 hover:text-white"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${showFreeOnly ? "bg-green-400" : "bg-gv-neutral-600"}`} />
                  Free Only
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gv-neutral-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-gv-neutral-800 border border-gv-neutral-700 text-white text-sm rounded-gv px-3 py-2 focus:outline-none focus:border-gv-primary-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-sm text-gv-neutral-400 mb-6">
              Showing {sortedExperiences.length} {showFreeOnly ? "free " : ""}experience
              {sortedExperiences.length !== 1 ? "s" : ""}
            </p>

            {/* All Creators Row */}
            {allCreators.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gv-neutral-400 mb-3">
                  {category.label} Creators
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {allCreators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.username}`}
                      className="flex items-center gap-2 px-3 py-2 bg-gv-neutral-800 hover:bg-gv-neutral-700 rounded-full shrink-0 transition-colors"
                    >
                      <div className="relative w-6 h-6 rounded-full overflow-hidden">
                        <Image src={creator.avatar} alt={creator.displayName} fill className="object-cover" />
                      </div>
                      <span className="text-sm text-white whitespace-nowrap">{creator.displayName}</span>
                      {creator.isVerified && (
                        <CheckCircle className="h-3.5 w-3.5 text-gv-primary-500" fill="currentColor" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Grid */}
            {sortedExperiences.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedExperiences.map((exp) => (
                  <ExperienceCard key={exp.id} experience={exp} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CategoryIcon className={`h-12 w-12 mx-auto mb-4 ${category.color} opacity-50`} />
                <p className="text-gv-neutral-400">
                  No {showFreeOnly ? "free " : ""}experiences found in this category.
                </p>
                {showFreeOnly && (
                  <button
                    onClick={() => setShowFreeOnly(false)}
                    className="mt-4 text-gv-primary-500 hover:text-gv-primary-400 text-sm"
                  >
                    Show all experiences
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
