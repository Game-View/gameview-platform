"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Clock,
  Users,
  Star,
  Share2,
  Heart,
  CheckCircle,
  Sparkles,
  GraduationCap,
  Compass,
  Shield,
  Calendar,
} from "lucide-react";
import {
  getExperienceById,
  getCreatorById,
  getExperiencesByCategory,
  formatPlayCount,
  formatDuration,
} from "@/lib/mock-data";
import { ExperienceCard } from "@/components/ExperienceCard";

const categoryIcons = {
  entertainment: Sparkles,
  education: GraduationCap,
  exploration: Compass,
};

const categoryColors = {
  entertainment: "text-gv-primary-500",
  education: "text-gv-accent-500",
  exploration: "text-gv-warning-500",
};

const ageRatingColors: Record<string, string> = {
  "E": "bg-green-500/20 text-green-400",
  "E10+": "bg-green-500/20 text-green-400",
  "T": "bg-yellow-500/20 text-yellow-400",
  "M": "bg-orange-500/20 text-orange-400",
};

export default function ExperienceDetailPage() {
  const params = useParams();
  const experienceId = params.id as string;

  const experience = getExperienceById(experienceId);
  const creator = experience ? getCreatorById(experience.creatorId) : null;
  const similarExperiences = experience
    ? getExperiencesByCategory(experience.category)
        .filter((e) => e.id !== experience.id)
        .slice(0, 4)
    : [];

  if (!experience) {
    return (
      <div className="min-h-screen bg-gv-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Experience Not Found</h1>
          <p className="text-gv-neutral-400 mb-6">
            The experience you're looking for doesn't exist.
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

  const CategoryIcon = categoryIcons[experience.category as keyof typeof categoryIcons];
  const categoryColor = categoryColors[experience.category as keyof typeof categoryColors];
  const ageRatingColor = ageRatingColors[experience.ageRating] || "bg-gv-neutral-700 text-gv-neutral-300";

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Back Navigation */}
      <div className="sticky top-0 z-50 bg-gv-neutral-900/95 backdrop-blur border-b border-gv-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gv-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gv-neutral-400 hover:text-white transition-colors">
              <Heart className="h-5 w-5" />
            </button>
            <button className="p-2 text-gv-neutral-400 hover:text-white transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="aspect-video max-h-[500px] relative overflow-hidden">
          <Image
            src={experience.thumbnail}
            alt={experience.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gv-neutral-900 via-gv-neutral-900/20 to-transparent" />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-20 h-20 rounded-full bg-gv-primary-500 hover:bg-gv-primary-600 flex items-center justify-center shadow-gv-glow transition-all hover:scale-110">
              <Play className="h-8 w-8 text-white ml-1" fill="white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title & Meta */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {/* Category Badge */}
                {CategoryIcon && (
                  <span className={`flex items-center gap-1 text-sm ${categoryColor}`}>
                    <CategoryIcon className="h-4 w-4" />
                    <span className="capitalize">{experience.category}</span>
                  </span>
                )}
                {/* Age Rating */}
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${ageRatingColor}`}>
                  {experience.ageRating}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {experience.title}
              </h1>

              {/* Creator Link */}
              {creator && (
                <Link
                  href={`/creator/${creator.username}`}
                  className="inline-flex items-center gap-2 text-gv-neutral-300 hover:text-white transition-colors"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={creator.avatar}
                      alt={creator.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium">{creator.displayName}</span>
                  {creator.isVerified && (
                    <CheckCircle className="h-4 w-4 text-gv-primary-500" fill="currentColor" />
                  )}
                </Link>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 py-4 border-y border-gv-neutral-800 mb-6">
              <div className="flex items-center gap-2 text-gv-neutral-400">
                <Users className="h-4 w-4" />
                <span>{formatPlayCount(experience.playCount)} plays</span>
              </div>
              <div className="flex items-center gap-2 text-gv-neutral-400">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(experience.duration)}</span>
              </div>
              {experience.rating && (
                <div className="flex items-center gap-2 text-gv-neutral-400">
                  <Star className="h-4 w-4 fill-gv-warning-500 text-gv-warning-500" />
                  <span>{experience.rating.toFixed(1)} rating</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gv-neutral-400">
                <Calendar className="h-4 w-4" />
                <span>{new Date(experience.releaseDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">About This Experience</h2>
              <p className="text-gv-neutral-300 leading-relaxed">
                {experience.description}
              </p>
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {experience.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tag/${tag}`}
                    className="px-3 py-1.5 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-gv-neutral-300 text-sm rounded-full transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Content Guidelines Notice */}
            <div className="flex items-start gap-3 p-4 bg-gv-neutral-800/50 rounded-gv-lg border border-gv-neutral-700">
              <Shield className="h-5 w-5 text-gv-accent-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-white text-sm mb-1">
                  Community Guidelines
                </h3>
                <p className="text-xs text-gv-neutral-400">
                  This experience has been reviewed and meets Game View's content guidelines.
                  Age rating: {experience.ageRating}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Price & Play Card */}
              <div className="bg-gv-neutral-800 rounded-gv-lg border border-gv-neutral-700 p-6">
                <div className="text-center mb-6">
                  {experience.price === 0 ? (
                    <div>
                      <span className="text-3xl font-bold text-green-400">Free to Play</span>
                      <p className="text-sm text-gv-neutral-400 mt-1">
                        No payment required
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-white">
                        ${experience.price.toFixed(2)}
                      </span>
                      <p className="text-sm text-gv-neutral-400 mt-1">
                        One-time purchase
                      </p>
                    </div>
                  )}
                </div>

                <button className="w-full py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-semibold rounded-gv-lg flex items-center justify-center gap-2 transition-colors shadow-gv-glow">
                  <Play className="h-5 w-5" fill="white" />
                  {experience.price === 0 ? "Play Now" : "Purchase & Play"}
                </button>

                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white text-sm rounded-gv flex items-center justify-center gap-2 transition-colors">
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </button>
                  <button className="flex-1 py-2 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white text-sm rounded-gv flex items-center justify-center gap-2 transition-colors">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* Creator Card */}
              {creator && (
                <Link
                  href={`/creator/${creator.username}`}
                  className="block bg-gv-neutral-800 rounded-gv-lg border border-gv-neutral-700 p-4 hover:border-gv-neutral-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={creator.avatar}
                        alt={creator.displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-white truncate">
                          {creator.displayName}
                        </span>
                        {creator.isVerified && (
                          <CheckCircle className="h-4 w-4 text-gv-primary-500 shrink-0" fill="currentColor" />
                        )}
                      </div>
                      <p className="text-sm text-gv-neutral-400">
                        {formatPlayCount(creator.followers)} followers
                      </p>
                    </div>
                  </div>
                  {creator.tagline && (
                    <p className="text-sm text-gv-neutral-400 mt-3 line-clamp-2">
                      {creator.tagline}
                    </p>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Similar Experiences */}
        {similarExperiences.length > 0 && (
          <section className="py-12 border-t border-gv-neutral-800 mt-12">
            <h2 className="text-xl font-semibold text-white mb-6">
              More {experience.category.charAt(0).toUpperCase() + experience.category.slice(1)} Experiences
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarExperiences.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
