"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Music,
  Video,
  Building2,
  Trophy,
  MapPin,
  MoreHorizontal,
  GraduationCap,
  Briefcase,
  Star,
  Sparkles,
  Map,
  Search,
  Palette,
  HelpCircle,
  Camera,
  CameraOff,
  BookOpen,
  Check,
  Loader2,
} from "lucide-react";
import type {
  CreatorType,
  ExperienceLevel,
  CreationGoal,
  FootageStatus,
} from "@gameview/types";

const CREATOR_OPTIONS: { value: CreatorType; label: string; icon: React.ReactNode }[] = [
  { value: "musician", label: "Musician / Artist", icon: <Music className="h-5 w-5" /> },
  { value: "content_creator", label: "Content Creator", icon: <Video className="h-5 w-5" /> },
  { value: "brand_agency", label: "Brand / Agency", icon: <Building2 className="h-5 w-5" /> },
  { value: "sports_entertainment", label: "Sports / Entertainment", icon: <Trophy className="h-5 w-5" /> },
  { value: "venue_events", label: "Venue / Events", icon: <MapPin className="h-5 w-5" /> },
  { value: "other", label: "Other", icon: <MoreHorizontal className="h-5 w-5" /> },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; icon: React.ReactNode }[] = [
  { value: "new", label: "New to this", icon: <GraduationCap className="h-5 w-5" /> },
  { value: "some_experience", label: "Some experience", icon: <Briefcase className="h-5 w-5" /> },
  { value: "professional", label: "Professional", icon: <Star className="h-5 w-5" /> },
];

const GOAL_OPTIONS: { value: CreationGoal; label: string; icon: React.ReactNode }[] = [
  { value: "fan_experiences", label: "Fan experiences", icon: <Sparkles className="h-4 w-4" /> },
  { value: "virtual_tours", label: "Virtual tours", icon: <Map className="h-4 w-4" /> },
  { value: "treasure_hunts", label: "Treasure hunts", icon: <Search className="h-4 w-4" /> },
  { value: "branded_content", label: "Branded content", icon: <Palette className="h-4 w-4" /> },
  { value: "still_exploring", label: "Still exploring", icon: <HelpCircle className="h-4 w-4" /> },
];

const FOOTAGE_OPTIONS: { value: FootageStatus; label: string; icon: React.ReactNode }[] = [
  { value: "have_footage", label: "Yes, I have footage", icon: <Camera className="h-5 w-5" /> },
  { value: "no_footage", label: "No, not yet", icon: <CameraOff className="h-5 w-5" /> },
  { value: "need_guidance", label: "I need guidance", icon: <BookOpen className="h-5 w-5" /> },
];

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  // Form state
  const [creatorType, setCreatorType] = useState<CreatorType | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [creationGoals, setCreationGoals] = useState<CreationGoal[]>([]);
  const [footageStatus, setFootageStatus] = useState<FootageStatus | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current profile from Clerk metadata
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.unsafeMetadata as {
        creatorType?: CreatorType;
        experienceLevel?: ExperienceLevel;
        creationGoals?: CreationGoal[];
        footageStatus?: FootageStatus;
      } | undefined;

      if (metadata) {
        setCreatorType(metadata.creatorType || null);
        setExperienceLevel(metadata.experienceLevel || null);
        setCreationGoals(metadata.creationGoals || []);
        setFootageStatus(metadata.footageStatus || null);
      }
    }
  }, [isLoaded, user]);

  const toggleGoal = (goal: CreationGoal) => {
    setCreationGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSave = async () => {
    if (!user || !creatorType || !experienceLevel || !footageStatus || creationGoals.length === 0) {
      setError("Please complete all fields");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Update Supabase via API
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorType,
          experienceLevel,
          creationGoals,
          footageStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Update Clerk metadata
      await user.update({
        unsafeMetadata: {
          profileCompleted: true,
          creatorType,
          experienceLevel,
          creationGoals,
          footageStatus,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gv-neutral-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Header */}
      <header className="border-b border-gv-neutral-800 bg-gv-neutral-900">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 text-gv-neutral-400 hover:text-white transition-colors -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold text-white">Settings</h1>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Profile</h2>

          <div className="space-y-8">
            {/* Creator Type */}
            <div>
              <label className="block text-sm font-medium text-gv-neutral-300 mb-3">
                What do you do?
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {CREATOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCreatorType(option.value)}
                    className={`p-4 rounded-gv border text-left transition-all flex items-center gap-3 ${
                      creatorType === option.value
                        ? "bg-gv-primary-500/10 border-gv-primary-500 text-white"
                        : "bg-gv-neutral-800/50 border-gv-neutral-700 text-gv-neutral-300 hover:border-gv-neutral-600"
                    }`}
                  >
                    <div className={creatorType === option.value ? "text-gv-primary-500" : "text-gv-neutral-400"}>
                      {option.icon}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gv-neutral-300 mb-3">
                Experience level
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExperienceLevel(option.value)}
                    className={`p-4 rounded-gv border text-left transition-all flex items-center gap-3 ${
                      experienceLevel === option.value
                        ? "bg-gv-primary-500/10 border-gv-primary-500 text-white"
                        : "bg-gv-neutral-800/50 border-gv-neutral-700 text-gv-neutral-300 hover:border-gv-neutral-600"
                    }`}
                  >
                    <div className={experienceLevel === option.value ? "text-gv-primary-500" : "text-gv-neutral-400"}>
                      {option.icon}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Creation Goals */}
            <div>
              <label className="block text-sm font-medium text-gv-neutral-300 mb-3">
                Creation goals
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleGoal(option.value)}
                    className={`px-4 py-2 rounded-full border text-sm transition-all flex items-center gap-2 ${
                      creationGoals.includes(option.value)
                        ? "bg-gv-primary-500/10 border-gv-primary-500 text-white"
                        : "bg-gv-neutral-800/50 border-gv-neutral-700 text-gv-neutral-300 hover:border-gv-neutral-600"
                    }`}
                  >
                    {option.icon}
                    {option.label}
                    {creationGoals.includes(option.value) && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Footage Status */}
            <div>
              <label className="block text-sm font-medium text-gv-neutral-300 mb-3">
                Venue footage
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {FOOTAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFootageStatus(option.value)}
                    className={`p-4 rounded-gv border text-left transition-all flex items-center gap-3 ${
                      footageStatus === option.value
                        ? "bg-gv-primary-500/10 border-gv-primary-500 text-white"
                        : "bg-gv-neutral-800/50 border-gv-neutral-700 text-gv-neutral-300 hover:border-gv-neutral-600"
                    }`}
                  >
                    <div className={footageStatus === option.value ? "text-gv-primary-500" : "text-gv-neutral-400"}>
                      {option.icon}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-gv-error/10 border border-gv-error/30 rounded-gv text-gv-error text-sm">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 p-4 bg-gv-success/10 border border-gv-success/30 rounded-gv text-gv-success text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            Changes saved successfully!
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-3 rounded-gv font-medium flex items-center gap-2 transition-colors ${
              isSaving
                ? "bg-gv-neutral-700 text-gv-neutral-400 cursor-not-allowed"
                : "bg-gv-primary-500 hover:bg-gv-primary-600 text-white"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
