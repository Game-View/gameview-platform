"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  Filter,
  X,
  Sparkles,
  GraduationCap,
  Compass,
  ChevronDown,
  Users,
  Play,
} from "lucide-react";
import {
  search,
  searchExperiences,
  searchCreators,
  getPopularSearchTerms,
  type Experience,
  type Creator,
} from "@/lib/mock-data";
import { ExperienceCard } from "@/components/ExperienceCard";
import { CreatorCard } from "@/components/CreatorCard";

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: null },
  { id: "entertainment", label: "Entertainment", icon: Sparkles },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "exploration", label: "Exploration", icon: Compass },
];

const PRICE_FILTERS = [
  { id: "all", label: "All Prices" },
  { id: "free", label: "Free Only" },
  { id: "paid", label: "Paid Only" },
];

const SORT_OPTIONS = [
  { id: "relevance", label: "Most Relevant" },
  { id: "popular", label: "Most Popular" },
  { id: "recent", label: "Newest First" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
];

type TabId = "all" | "experiences" | "creators";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [category, setCategory] = useState("all");
  const [priceType, setPriceType] = useState<"free" | "paid" | "all">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "popular" | "recent" | "price_low" | "price_high">("relevance");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Results
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const popularTerms = getPopularSearchTerms();

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      setExperiences([]);
      setCreators([]);
      setHasSearched(false);
      return;
    }

    const filters = {
      category: category !== "all" ? category : undefined,
      priceType: priceType,
      sortBy: sortBy,
      verified: verifiedOnly,
    };

    const expResults = searchExperiences(query, filters);
    const creatorResults = searchCreators(query, { category: filters.category, verified: filters.verified });

    setExperiences(expResults);
    setCreators(creatorResults);
    setHasSearched(true);
  }, [query, category, priceType, sortBy, verifiedOnly]);

  // Perform search when query or filters change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      const params = new URLSearchParams();
      params.set("q", query);
      if (category !== "all") params.set("cat", category);
      if (priceType !== "all") params.set("price", priceType);
      if (sortBy !== "relevance") params.set("sort", sortBy);
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  }, [query, category, priceType, sortBy, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
  };

  const clearFilters = () => {
    setCategory("all");
    setPriceType("all");
    setSortBy("relevance");
    setVerifiedOnly(false);
  };

  const hasActiveFilters = category !== "all" || priceType !== "all" || sortBy !== "relevance" || verifiedOnly;

  const totalResults = experiences.length + creators.length;

  // Filter results based on active tab
  const showExperiences = activeTab === "all" || activeTab === "experiences";
  const showCreators = activeTab === "all" || activeTab === "creators";

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gv-neutral-800 bg-gv-neutral-900/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Back */}
          <Link
            href="/"
            className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gv-neutral-500" />
            <input
              type="text"
              placeholder="Search experiences, creators..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-10 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-full text-white text-sm placeholder:text-gv-neutral-500 focus:outline-none focus:border-gv-primary-500 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gv-neutral-500 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-gv-primary-500/20 text-gv-primary-400 border border-gv-primary-500/30"
                : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-gv-primary-500" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t border-gv-neutral-800 bg-gv-neutral-900/95">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex flex-wrap gap-4">
                {/* Category */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gv-neutral-500">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-sm text-white focus:outline-none focus:border-gv-primary-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gv-neutral-500">Price</label>
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value as "free" | "paid" | "all")}
                    className="px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-sm text-white focus:outline-none focus:border-gv-primary-500"
                  >
                    {PRICE_FILTERS.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gv-neutral-500">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-sm text-white focus:outline-none focus:border-gv-primary-500"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verified Toggle */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gv-neutral-500">Creators</label>
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`px-3 py-2 rounded-gv text-sm font-medium transition-colors ${
                      verifiedOnly
                        ? "bg-gv-primary-500/20 text-gv-primary-400 border border-gv-primary-500/30"
                        : "bg-gv-neutral-800 text-gv-neutral-400 border border-gv-neutral-700 hover:border-gv-neutral-600"
                    }`}
                  >
                    Verified Only
                  </button>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm text-gv-primary-500 hover:text-gv-primary-400 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* No Query State */}
        {!query.trim() && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gv-neutral-700 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-3">
              Search Game View
            </h1>
            <p className="text-gv-neutral-400 mb-8 max-w-md mx-auto">
              Find immersive experiences, discover creators, and explore new worlds.
            </p>

            {/* Popular Searches */}
            <div>
              <p className="text-sm text-gv-neutral-500 mb-3">Popular Searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularTerms.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleQuickSearch(term)}
                    className="px-4 py-2 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-gv-neutral-300 rounded-full text-sm transition-colors capitalize"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {query.trim() && hasSearched && (
          <>
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {totalResults > 0 ? (
                    <>
                      {totalResults} result{totalResults !== 1 ? "s" : ""} for &quot;{query}&quot;
                    </>
                  ) : (
                    <>No results for &quot;{query}&quot;</>
                  )}
                </h1>
                {hasActiveFilters && (
                  <p className="text-sm text-gv-neutral-500 mt-1">
                    Filtered results
                  </p>
                )}
              </div>

              {/* Tabs */}
              {totalResults > 0 && (
                <div className="flex gap-1 bg-gv-neutral-800/50 p-1 rounded-full">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      activeTab === "all"
                        ? "bg-gv-neutral-700 text-white"
                        : "text-gv-neutral-400 hover:text-white"
                    }`}
                  >
                    All ({totalResults})
                  </button>
                  <button
                    onClick={() => setActiveTab("experiences")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      activeTab === "experiences"
                        ? "bg-gv-neutral-700 text-white"
                        : "text-gv-neutral-400 hover:text-white"
                    }`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Experiences ({experiences.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("creators")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      activeTab === "creators"
                        ? "bg-gv-neutral-700 text-white"
                        : "text-gv-neutral-400 hover:text-white"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Creators ({creators.length})
                  </button>
                </div>
              )}
            </div>

            {/* No Results */}
            {totalResults === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gv-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gv-neutral-600" />
                </div>
                <p className="text-gv-neutral-400 mb-4">
                  We couldn&apos;t find anything matching your search.
                </p>
                <p className="text-sm text-gv-neutral-500">
                  Try different keywords or{" "}
                  <button
                    onClick={clearFilters}
                    className="text-gv-primary-500 hover:text-gv-primary-400"
                  >
                    clear your filters
                  </button>
                </p>
              </div>
            )}

            {/* Creators Section */}
            {showCreators && creators.length > 0 && (
              <section className="mb-10">
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-gv-neutral-400" />
                      Creators
                    </h2>
                    {creators.length > 4 && (
                      <button
                        onClick={() => setActiveTab("creators")}
                        className="text-sm text-gv-primary-500 hover:text-gv-primary-400"
                      >
                        See all {creators.length} →
                      </button>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(activeTab === "all" ? creators.slice(0, 4) : creators).map((creator) => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              </section>
            )}

            {/* Experiences Section */}
            {showExperiences && experiences.length > 0 && (
              <section>
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Play className="h-5 w-5 text-gv-neutral-400" />
                      Experiences
                    </h2>
                    {experiences.length > 6 && (
                      <button
                        onClick={() => setActiveTab("experiences")}
                        className="text-sm text-gv-primary-500 hover:text-gv-primary-400"
                      >
                        See all {experiences.length} →
                      </button>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(activeTab === "all" ? experiences.slice(0, 6) : experiences).map((exp) => (
                    <ExperienceCard key={exp.id} experience={exp} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
