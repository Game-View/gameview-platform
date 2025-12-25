"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Play,
  Sparkles,
  GraduationCap,
  Compass,
  ChevronRight,
  ChevronLeft,
  User,
} from "lucide-react";
import {
  mockExperiences,
  mockCreators,
  getFeaturedCreators,
  getTrendingExperiences,
  getFreeExperiences,
  getExperiencesByCategory,
  formatPlayCount,
  formatDuration,
  type Experience,
  type Creator,
} from "@/lib/mock-data";
import { ExperienceCard } from "@/components/ExperienceCard";
import { CreatorCard } from "@/components/CreatorCard";

const CATEGORIES = [
  { id: "entertainment", label: "Entertainment", icon: Sparkles, color: "text-gv-primary-500" },
  { id: "education", label: "Education", icon: GraduationCap, color: "text-gv-accent-500" },
  { id: "exploration", label: "Exploration", icon: Compass, color: "text-gv-warning-500" },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const featuredCreators = getFeaturedCreators(4);
  const trendingExperiences = getTrendingExperiences(6);
  const freeExperiences = getFreeExperiences().slice(0, 6);

  // Get experiences for active category or show trending
  const displayExperiences = activeCategory
    ? getExperiencesByCategory(activeCategory)
    : trendingExperiences;

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gv-neutral-800 bg-gv-neutral-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🐰</span>
            <span className="font-bold text-white text-xl tracking-wide hidden sm:inline">GAME VIEW</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gv-neutral-500" />
            <input
              type="text"
              placeholder="Search experiences, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-full text-white text-sm placeholder:text-gv-neutral-500 focus:outline-none focus:border-gv-primary-500 transition-colors"
            />
          </form>

          {/* Auth buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/sign-in"
              className="hidden sm:block px-4 py-2 text-sm text-gv-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white text-sm font-medium rounded-full transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gv-primary-500/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Step Into Amazing Worlds
            </h1>
            <p className="text-lg text-gv-neutral-400 mb-8">
              Discover immersive 360° experiences from talented creators. Free to play.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="#free-experiences"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-full transition-colors"
              >
                <Play className="h-5 w-5" />
                Play Free Now
              </Link>
              <Link
                href="#creators"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-white font-medium rounded-full transition-colors border border-gv-neutral-700"
              >
                <User className="h-5 w-5" />
                Discover Creators
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="border-b border-gv-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                activeCategory === null
                  ? "bg-gv-primary-500/20 text-gv-primary-400 border border-gv-primary-500/30"
                  : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800"
              }`}
            >
              Trending
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-gv-primary-500/20 text-gv-primary-400 border border-gv-primary-500/30"
                    : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800"
                }`}
              >
                <cat.icon className={`h-4 w-4 ${activeCategory === cat.id ? cat.color : ""}`} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Featured Creators */}
        <section id="creators">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Featured Creators</h2>
            <Link
              href="/creators"
              className="text-sm text-gv-primary-500 hover:text-gv-primary-400 flex items-center gap-1"
            >
              See All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {featuredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </section>

        {/* Experience Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {activeCategory
                ? `${CATEGORIES.find((c) => c.id === activeCategory)?.label} Experiences`
                : "Trending Now"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayExperiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        </section>

        {/* Free to Play Section */}
        <section id="free-experiences" className="bg-gv-neutral-800/50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8 rounded-gv-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">FREE</span>
                Free to Play
              </h2>
              <p className="text-gv-neutral-400 text-sm mt-1">
                Jump in and play - no payment required
              </p>
            </div>
            <Link
              href="/free"
              className="text-sm text-gv-primary-500 hover:text-gv-primary-400 flex items-center gap-1"
            >
              See All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeExperiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        </section>

        {/* Categories Browse */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const catExperiences = getExperiencesByCategory(cat.id);
              const catCreators = mockCreators.filter((c) => c.category === cat.id);
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className="group relative overflow-hidden rounded-gv-lg border border-gv-neutral-700 hover:border-gv-neutral-600 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gv-neutral-800 to-gv-neutral-900" />
                  <div className="relative p-6">
                    <cat.icon className={`h-10 w-10 ${cat.color} mb-4`} />
                    <h3 className="text-lg font-semibold text-white mb-1">{cat.label}</h3>
                    <p className="text-sm text-gv-neutral-400">
                      {catExperiences.length} experiences • {catCreators.length} creators
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-gv-neutral-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Creator CTA */}
        <section className="text-center py-12 border-t border-gv-neutral-800">
          <h2 className="text-2xl font-bold text-white mb-3">Are You a Creator?</h2>
          <p className="text-gv-neutral-400 mb-6 max-w-xl mx-auto">
            Build and share your own immersive 360° experiences. Reach audiences worldwide and earn from your creations.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3000"}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-full transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            Start Creating
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gv-neutral-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐰</span>
              <span className="font-bold text-white">GAME VIEW</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gv-neutral-400">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/creators" className="hover:text-white transition-colors">Creators</Link>
              <Link href="/guidelines" className="hover:text-white transition-colors">Guidelines</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-gv-neutral-500">
              © 2024 Game View Technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
