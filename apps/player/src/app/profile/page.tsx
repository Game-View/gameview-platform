"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Settings,
  Clock,
  Users,
  Heart,
  Play,
  CheckCircle,
  Calendar,
  Edit3,
  Youtube,
  Twitter,
  Instagram,
  Link2,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Compass,
} from "lucide-react";
import {
  mockCurrentUser,
  AVAILABLE_INTERESTS,
  getFollowedCreators,
  getWishlistExperiences,
  getPlayHistoryWithDetails,
  formatPlayTime,
  formatPlayCount,
  getCreatorById,
} from "@/lib/mock-data";
import { ExperienceCard } from "@/components/ExperienceCard";
import { CreatorCard } from "@/components/CreatorCard";

// Platform icons mapping
const platformIcons: Record<string, typeof Youtube> = {
  youtube: Youtube,
  twitter: Twitter,
  instagram: Instagram,
  tiktok: Play, // Using Play as TikTok placeholder
  twitch: Play, // Using Play as Twitch placeholder
};

const platformColors: Record<string, string> = {
  youtube: "text-red-500 bg-red-500/10",
  twitter: "text-blue-400 bg-blue-400/10",
  instagram: "text-pink-500 bg-pink-500/10",
  tiktok: "text-white bg-black",
  twitch: "text-purple-500 bg-purple-500/10",
};

const categoryIcons = {
  entertainment: Sparkles,
  education: GraduationCap,
  exploration: Compass,
};

type TabId = "activity" | "following" | "wishlist" | "interests";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("activity");
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(mockCurrentUser.interests);

  const user = mockCurrentUser;
  const followedCreators = getFollowedCreators();
  const wishlistExperiences = getWishlistExperiences();
  const playHistory = getPlayHistoryWithDetails();

  const userInterests = AVAILABLE_INTERESTS.filter((i) => user.interests.includes(i.id));

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "activity", label: "Activity", count: playHistory.length },
    { id: "following", label: "Following", count: followedCreators.length },
    { id: "wishlist", label: "Wishlist", count: wishlistExperiences.length },
    { id: "interests", label: "Interests" },
  ];

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gv-neutral-900/95 backdrop-blur border-b border-gv-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gv-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <Link
            href="/settings"
            className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-gv-neutral-800">
              <Image
                src={user.avatar}
                alt={user.displayName}
                width={128}
                height={128}
                className="object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-gv-neutral-800 rounded-full border border-gv-neutral-700 hover:bg-gv-neutral-700 transition-colors">
              <Edit3 className="h-4 w-4 text-gv-neutral-300" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
            <p className="text-gv-neutral-400">@{user.username}</p>

            {user.bio && (
              <p className="text-gv-neutral-300 mt-3 max-w-lg">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center gap-2 text-gv-neutral-400">
                <Clock className="h-4 w-4" />
                <span className="text-white font-medium">{formatPlayTime(user.totalPlayTimeMinutes)}</span>
                <span className="text-sm">played</span>
              </div>
              <div className="flex items-center gap-2 text-gv-neutral-400">
                <Play className="h-4 w-4" />
                <span className="text-white font-medium">{playHistory.length}</span>
                <span className="text-sm">experiences</span>
              </div>
              <div className="flex items-center gap-2 text-gv-neutral-400">
                <Users className="h-4 w-4" />
                <span className="text-white font-medium">{followedCreators.length}</span>
                <span className="text-sm">following</span>
              </div>
              <div className="flex items-center gap-2 text-gv-neutral-400">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Joined {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="mt-8 p-4 bg-gv-neutral-800/50 rounded-gv-lg border border-gv-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Connected Accounts
            </h2>
            <span className="text-xs text-gv-neutral-500">
              Find creators you follow & share your plays
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.connectedAccounts.map((account) => {
              const Icon = platformIcons[account.platform] || Link2;
              const colorClass = platformColors[account.platform] || "text-gv-neutral-400 bg-gv-neutral-700";
              return (
                <button
                  key={account.platform}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                    account.connected
                      ? colorClass
                      : "text-gv-neutral-500 bg-gv-neutral-800 border border-gv-neutral-700 border-dashed hover:border-gv-neutral-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="capitalize">
                    {account.connected ? account.username || account.platform : `Connect ${account.platform}`}
                  </span>
                  {account.connected && <CheckCircle className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gv-neutral-800 sticky top-14 bg-gv-neutral-900 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-white border-gv-primary-500"
                    : "text-gv-neutral-400 border-transparent hover:text-white"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-xs text-gv-neutral-500">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            {playHistory.length > 0 ? (
              <div className="space-y-4">
                {playHistory.map((entry) => {
                  const creator = getCreatorById(entry.experience.creatorId);
                  return (
                    <Link
                      key={`${entry.experienceId}-${entry.playedAt}`}
                      href={`/experience/${entry.experienceId}`}
                      className="flex gap-4 p-4 bg-gv-neutral-800/50 rounded-gv-lg border border-gv-neutral-700 hover:border-gv-neutral-600 transition-colors"
                    >
                      <div className="relative w-24 h-16 rounded-gv overflow-hidden shrink-0">
                        <Image
                          src={entry.experience.thumbnail}
                          alt={entry.experience.title}
                          fill
                          className="object-cover"
                        />
                        {entry.completed && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{entry.experience.title}</h3>
                        <p className="text-sm text-gv-neutral-400">
                          {creator?.displayName}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gv-neutral-500">
                          <span>{new Date(entry.playedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{formatPlayTime(entry.playTimeMinutes)} played</span>
                          {entry.completed && (
                            <>
                              <span>•</span>
                              <span className="text-green-400">Completed</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gv-neutral-500 self-center shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Play className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
                <p className="text-gv-neutral-400">No activity yet. Start playing experiences!</p>
                <Link
                  href="/"
                  className="mt-4 inline-block text-gv-primary-500 hover:text-gv-primary-400"
                >
                  Browse experiences →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Following Tab */}
        {activeTab === "following" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Creators You Follow</h2>
            {followedCreators.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {followedCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
                <p className="text-gv-neutral-400">You&apos;re not following any creators yet.</p>
                <Link
                  href="/"
                  className="mt-4 inline-block text-gv-primary-500 hover:text-gv-primary-400"
                >
                  Discover creators →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Your Wishlist</h2>
            {wishlistExperiences.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistExperiences.map((exp) => (
                  <ExperienceCard key={exp.id} experience={exp} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
                <p className="text-gv-neutral-400">Your wishlist is empty.</p>
                <Link
                  href="/"
                  className="mt-4 inline-block text-gv-primary-500 hover:text-gv-primary-400"
                >
                  Browse experiences →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Interests Tab */}
        {activeTab === "interests" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Interests</h2>
              <button
                onClick={() => setIsEditingInterests(!isEditingInterests)}
                className="text-sm text-gv-primary-500 hover:text-gv-primary-400"
              >
                {isEditingInterests ? "Done" : "Edit"}
              </button>
            </div>
            <p className="text-sm text-gv-neutral-400 mb-6">
              We use your interests to personalize your experience and recommend content you&apos;ll love.
            </p>

            {/* Category Sections */}
            {(["entertainment", "education", "exploration"] as const).map((category) => {
              const CategoryIcon = categoryIcons[category];
              const categoryInterests = AVAILABLE_INTERESTS.filter((i) => i.category === category);
              return (
                <div key={category} className="mb-8">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-gv-neutral-300 mb-3 capitalize">
                    <CategoryIcon className="h-4 w-4" />
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryInterests.map((interest) => {
                      const isSelected = selectedInterests.includes(interest.id);
                      return (
                        <button
                          key={interest.id}
                          onClick={() => isEditingInterests && toggleInterest(interest.id)}
                          disabled={!isEditingInterests}
                          className={`px-4 py-2 rounded-full text-sm transition-all ${
                            isSelected
                              ? "bg-gv-primary-500/20 text-gv-primary-400 border border-gv-primary-500/30"
                              : isEditingInterests
                              ? "bg-gv-neutral-800 text-gv-neutral-400 border border-gv-neutral-700 hover:border-gv-neutral-600"
                              : "bg-gv-neutral-800/50 text-gv-neutral-500 border border-transparent"
                          } ${isEditingInterests ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {interest.label}
                          {isSelected && <span className="ml-1">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {isEditingInterests && (
              <div className="mt-6 p-4 bg-gv-neutral-800/50 rounded-gv border border-gv-neutral-700">
                <p className="text-sm text-gv-neutral-400">
                  Selected {selectedInterests.length} interest{selectedInterests.length !== 1 ? "s" : ""}.
                  Changes will be saved automatically.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
