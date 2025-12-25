"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Compass,
  SlidersHorizontal,
  Grid,
  List,
} from "lucide-react";
import {
  getExperiencesByCategory,
  mockCreators,
  type Experience,
} from "@/lib/mock-data";
import { ExperienceCard } from "@/components/ExperienceCard";
import { CreatorCard } from "@/components/CreatorCard";

const CATEGORIES: Record<string, { label: string; icon: typeof Sparkles; color: string; description: string }> = {
  entertainment: {
    label: "Entertainment",
    icon: Sparkles,
    color: "text-gv-primary-500",
    description: "Immersive games, interactive stories, and thrilling adventures",
  },
  education: {
    label: "Education",
    icon: GraduationCap,
    color: "text-gv-accent-500",
    description: "Learn through exploration with interactive educational experiences",
  },
  exploration: {
    label: "Exploration",
    icon: Compass,
    color: "text-gv-warning-500",
    description: "Discover new worlds, travel to amazing places, and explore the unknown",
  },
};

type SortOption = "popular" | "newest" | "price-low" | "price-high";

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"experiences" | "creators">("experiences");

  const category = CATEGORIES[categoryId];
  const experiences = getExperiencesByCategory(categoryId);
  const creators = mockCreators.filter((c) => c.category === categoryId);

  // Filter and sort experiences
  let filteredExperiences = experiences;
  if (showFreeOnly) {
    filteredExperiences = filteredExperiences.filter((e) => e.price === 0);
  }

  // Sort experiences
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
            The category you're looking for doesn't exist.
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
            <div className={`p-3 rounded-gv-lg bg-gv-neutral-800 ${category.color}`}>
              <CategoryIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{category.label}</h1>
              <p className="text-gv-neutral-400 mt-1">{category.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 text-sm text-gv-neutral-400">
            <span>{experiences.length} experiences</span>
            <span>•</span>
            <span>{creators.length} creators</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gv-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("experiences")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "experiences"
                  ? "text-white border-gv-primary-500"
                  : "text-gv-neutral-400 border-transparent hover:text-white"
              }`}
            >
              Experiences ({experiences.length})
            </button>
            <button
              onClick={() => setActiveTab("creators")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "creators"
                  ? "text-white border-gv-primary-500"
                  : "text-gv-neutral-400 border-transparent hover:text-white"
              }`}
            >
              Creators ({creators.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "experiences" ? (
          <>
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
        ) : (
          <>
            {/* Creators Grid */}
            {creators.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {creators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CategoryIcon className={`h-12 w-12 mx-auto mb-4 ${category.color} opacity-50`} />
                <p className="text-gv-neutral-400">
                  No creators found in this category.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
