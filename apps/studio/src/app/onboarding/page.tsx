"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import {
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
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import type {
  CreatorType,
  ExperienceLevel,
  CreationGoal,
  FootageStatus,
} from "@gameview/types";

const STEPS = [
  { id: "creator-type", title: "What do you do?" },
  { id: "experience", title: "Experience level" },
  { id: "goals", title: "Creation goals" },
  { id: "footage", title: "Venue footage" },
];

const CREATOR_OPTIONS: { value: CreatorType; label: string; icon: React.ReactNode }[] = [
  { value: "musician", label: "Musician / Artist", icon: <Music className="h-6 w-6" /> },
  { value: "content_creator", label: "Content Creator", icon: <Video className="h-6 w-6" /> },
  { value: "brand_agency", label: "Brand / Agency", icon: <Building2 className="h-6 w-6" /> },
  { value: "sports_entertainment", label: "Sports / Entertainment", icon: <Trophy className="h-6 w-6" /> },
  { value: "venue_events", label: "Venue / Events", icon: <MapPin className="h-6 w-6" /> },
  { value: "other", label: "Other", icon: <MoreHorizontal className="h-6 w-6" /> },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "new",
    label: "New to this",
    description: "I'm just getting started with interactive experiences",
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    value: "some_experience",
    label: "Some experience",
    description: "I've created digital content before, but new to 3D",
    icon: <Briefcase className="h-6 w-6" />,
  },
  {
    value: "professional",
    label: "Professional",
    description: "I work with interactive/immersive content regularly",
    icon: <Star className="h-6 w-6" />,
  },
];

const GOAL_OPTIONS: { value: CreationGoal; label: string; icon: React.ReactNode }[] = [
  { value: "fan_experiences", label: "Fan experiences", icon: <Sparkles className="h-5 w-5" /> },
  { value: "virtual_tours", label: "Virtual tours", icon: <Map className="h-5 w-5" /> },
  { value: "treasure_hunts", label: "Treasure hunts", icon: <Search className="h-5 w-5" /> },
  { value: "branded_content", label: "Branded content", icon: <Palette className="h-5 w-5" /> },
  { value: "still_exploring", label: "Still exploring", icon: <HelpCircle className="h-5 w-5" /> },
];

const FOOTAGE_OPTIONS: { value: FootageStatus; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "have_footage",
    label: "Yes, I have footage",
    description: "I have venue video ready to process",
    icon: <Camera className="h-6 w-6" />,
  },
  {
    value: "no_footage",
    label: "No, not yet",
    description: "I still need to capture my venue",
    icon: <CameraOff className="h-6 w-6" />,
  },
  {
    value: "need_guidance",
    label: "I need guidance",
    description: "Help me understand what's needed",
    icon: <BookOpen className="h-6 w-6" />,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [creatorType, setCreatorType] = useState<CreatorType | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [creationGoals, setCreationGoals] = useState<CreationGoal[]>([]);
  const [footageStatus, setFootageStatus] = useState<FootageStatus | null>(null);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return creatorType !== null;
      case 1:
        return experienceLevel !== null;
      case 2:
        return creationGoals.length > 0;
      case 3:
        return footageStatus !== null;
      default:
        return false;
    }
  };

  const toggleGoal = (goal: CreationGoal) => {
    setCreationGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !creatorType || !experienceLevel || !footageStatus) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Save to Supabase via API
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress?.emailAddress,
          displayName: user.fullName || user.firstName,
          creatorType,
          experienceLevel,
          creationGoals,
          footageStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || "Failed to save profile");
      }

      // Also update Clerk metadata for quick checks (non-blocking)
      try {
        await user.update({
          unsafeMetadata: {
            profileCompleted: true,
            creatorType,
            experienceLevel,
            creationGoals,
            footageStatus,
          },
        });
      } catch (clerkError) {
        // Log but don't fail - profile is already saved to database
        console.error("Failed to update Clerk metadata (non-blocking):", clerkError);
      }

      // Redirect based on goals
      if (creationGoals.includes("still_exploring")) {
        router.push("/sandbox");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gv-gradient flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐰</span>
          <span className="font-bold text-white text-xl tracking-wide">GAME VIEW</span>
          <span className="text-gv-primary-500 font-semibold">Studio</span>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep
                    ? "bg-gv-primary-500 text-white"
                    : index === currentStep
                    ? "bg-gv-primary-500/20 text-gv-primary-500 border-2 border-gv-primary-500"
                    : "bg-gv-neutral-700 text-gv-neutral-400"
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-0.5 mx-2 transition-colors ${
                    index < currentStep ? "bg-gv-primary-500" : "bg-gv-neutral-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-gv-neutral-400 text-sm">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
        </p>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="max-w-2xl w-full">
          {/* Step 1: Creator Type */}
          {currentStep === 0 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white text-center mb-2">
                What do you do?
              </h1>
              <p className="text-gv-neutral-400 text-center mb-8">
                This helps us personalize your experience
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {CREATOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCreatorType(option.value)}
                    className={`p-6 rounded-gv-lg border text-left transition-all ${
                      creatorType === option.value
                        ? "bg-gv-primary-500/10 border-gv-primary-500 text-white"
                        : "bg-gv-neutral-800/50 border-gv-neutral-700 text-gv-neutral-300 hover:border-gv-neutral-600"
                    }`}
                  >
                    <div className={`mb-3 ${creatorType === option.value ? "text-gv-primary-500" : "text-gv-neutral-400"}`}>
                      {option.icon}
                    </div>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Experience Level */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white text-center mb-2">
                How experienced are you?
              </h1>
              <p className="text-gv-neutral-400 text-center mb-8">
                We&apos;ll adjust our guidance accordingly
              </p>
              <div className="space-y-4">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExperienceLevel(option.value)}
                    className={`w-full p-6 rounded-gv-lg border text-left transition-all flex items-start gap-4 ${
                      experienceLevel === option.value
                        ? "bg-gv-primary-500/10 border-gv-primary-500"
                        : "bg-gv-neutral-800/50 border-gv-neutral-700 hover:border-gv-neutral-600"
                    }`}
                  >
                    <div className={`${experienceLevel === option.value ? "text-gv-primary-500" : "text-gv-neutral-400"}`}>
                      {option.icon}
                    </div>
                    <div>
                      <span className={`font-medium block ${experienceLevel === option.value ? "text-white" : "text-gv-neutral-300"}`}>
                        {option.label}
                      </span>
                      <span className="text-sm text-gv-neutral-500">{option.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Creation Goals */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white text-center mb-2">
                What do you want to create?
              </h1>
              <p className="text-gv-neutral-400 text-center mb-8">
                Select all that apply
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {GOAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleGoal(option.value)}
                    className={`p-5 rounded-gv-lg border text-left transition-all flex items-center gap-3 ${
                      creationGoals.includes(option.value)
                        ? "bg-gv-primary-500/10 border-gv-primary-500 text-white"
                        : "bg-gv-neutral-800/50 border-gv-neutral-700 text-gv-neutral-300 hover:border-gv-neutral-600"
                    }`}
                  >
                    <div className={`${creationGoals.includes(option.value) ? "text-gv-primary-500" : "text-gv-neutral-400"}`}>
                      {option.icon}
                    </div>
                    <span className="font-medium">{option.label}</span>
                    {creationGoals.includes(option.value) && (
                      <Check className="h-4 w-4 text-gv-primary-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Footage Status */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white text-center mb-2">
                Do you have venue footage?
              </h1>
              <p className="text-gv-neutral-400 text-center mb-8">
                This helps us plan your first project
              </p>
              <div className="space-y-4">
                {FOOTAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFootageStatus(option.value)}
                    className={`w-full p-6 rounded-gv-lg border text-left transition-all flex items-start gap-4 ${
                      footageStatus === option.value
                        ? "bg-gv-primary-500/10 border-gv-primary-500"
                        : "bg-gv-neutral-800/50 border-gv-neutral-700 hover:border-gv-neutral-600"
                    }`}
                  >
                    <div className={`${footageStatus === option.value ? "text-gv-primary-500" : "text-gv-neutral-400"}`}>
                      {option.icon}
                    </div>
                    <div>
                      <span className={`font-medium block ${footageStatus === option.value ? "text-white" : "text-gv-neutral-300"}`}>
                        {option.label}
                      </span>
                      <span className="text-sm text-gv-neutral-500">{option.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-gv-error/10 border border-gv-error/30 rounded-gv text-gv-error text-sm text-center">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-gv font-medium flex items-center gap-2 transition-colors ${
                currentStep === 0
                  ? "text-gv-neutral-600 cursor-not-allowed"
                  : "text-gv-neutral-300 hover:text-white"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className={`px-8 py-3 rounded-gv font-medium flex items-center gap-2 transition-colors ${
                canProceed() && !isSubmitting
                  ? "bg-gv-primary-500 hover:bg-gv-primary-600 text-white"
                  : "bg-gv-neutral-700 text-gv-neutral-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                "Saving..."
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  Complete Setup
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
