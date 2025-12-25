"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  GraduationCap,
  Compass,
  ChevronRight,
} from "lucide-react";
import { AVAILABLE_INTERESTS } from "@/lib/mock-data";

type OnboardingStep = "interests" | "categories" | "complete";

const categoryInfo = {
  entertainment: {
    icon: Sparkles,
    color: "text-gv-primary-500",
    bgColor: "bg-gv-primary-500/10",
    borderColor: "border-gv-primary-500/30",
    title: "Entertainment",
    description: "Concerts, sports, gaming, comedy, and more",
  },
  education: {
    icon: GraduationCap,
    color: "text-gv-accent-500",
    bgColor: "bg-gv-accent-500/10",
    borderColor: "border-gv-accent-500/30",
    title: "Education",
    description: "Science, history, nature, and learning",
  },
  exploration: {
    icon: Compass,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    title: "Exploration",
    description: "Travel, architecture, culture, and adventure",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("categories");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleNext = () => {
    if (step === "categories" && selectedCategories.length > 0) {
      setStep("interests");
    } else if (step === "interests") {
      setStep("complete");
      // In real app, would save preferences here
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  };

  const handleBack = () => {
    if (step === "interests") {
      setStep("categories");
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  // Get interests for selected categories
  const availableInterests = AVAILABLE_INTERESTS.filter((interest) =>
    selectedCategories.includes(interest.category)
  );

  const canProceed =
    (step === "categories" && selectedCategories.length > 0) ||
    (step === "interests" && selectedInterests.length >= 3);

  return (
    <div className="min-h-screen bg-gv-neutral-900 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐰</span>
          <span className="font-bold text-white text-xl tracking-wide">GAME VIEW</span>
        </Link>
        {step !== "complete" && (
          <button
            onClick={handleSkip}
            className="text-sm text-gv-neutral-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        )}
      </header>

      {/* Progress Bar */}
      {step !== "complete" && (
        <div className="px-6 pb-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div
                className={`flex-1 h-1 rounded-full ${
                  step === "categories" || step === "interests"
                    ? "bg-gv-primary-500"
                    : "bg-gv-neutral-700"
                }`}
              />
              <div
                className={`flex-1 h-1 rounded-full ${
                  step === "interests" ? "bg-gv-primary-500" : "bg-gv-neutral-700"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          {/* Step 1: Categories */}
          {step === "categories" && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3">
                What do you want to explore?
              </h1>
              <p className="text-gv-neutral-400 mb-8">
                Select the types of experiences that interest you most
              </p>

              <div className="grid gap-4 mb-8">
                {(["entertainment", "education", "exploration"] as const).map(
                  (category) => {
                    const info = categoryInfo[category];
                    const Icon = info.icon;
                    const isSelected = selectedCategories.includes(category);

                    return (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`relative p-6 rounded-gv-lg border-2 text-left transition-all ${
                          isSelected
                            ? `${info.bgColor} ${info.borderColor}`
                            : "bg-gv-neutral-800/50 border-gv-neutral-700 hover:border-gv-neutral-600"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-3 rounded-gv ${
                              isSelected ? info.bgColor : "bg-gv-neutral-700"
                            }`}
                          >
                            <Icon
                              className={`h-6 w-6 ${
                                isSelected ? info.color : "text-gv-neutral-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {info.title}
                            </h3>
                            <p className="text-sm text-gv-neutral-400">
                              {info.description}
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? `${info.borderColor} ${info.bgColor}`
                                : "border-gv-neutral-600"
                            }`}
                          >
                            {isSelected && (
                              <Check className={`h-4 w-4 ${info.color}`} />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={!canProceed}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all ${
                  canProceed
                    ? "bg-gv-primary-500 hover:bg-gv-primary-600 text-white"
                    : "bg-gv-neutral-700 text-gv-neutral-500 cursor-not-allowed"
                }`}
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === "interests" && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3">
                Pick your interests
              </h1>
              <p className="text-gv-neutral-400 mb-8">
                Choose at least 3 interests to personalize your experience
              </p>

              {/* Grouped by Category */}
              <div className="space-y-8 mb-8">
                {selectedCategories.map((category) => {
                  const info = categoryInfo[category as keyof typeof categoryInfo];
                  const Icon = info.icon;
                  const interests = AVAILABLE_INTERESTS.filter(
                    (i) => i.category === category
                  );

                  return (
                    <div key={category}>
                      <h3 className="flex items-center justify-center gap-2 text-sm font-medium text-gv-neutral-400 mb-4">
                        <Icon className={`h-4 w-4 ${info.color}`} />
                        {info.title}
                      </h3>
                      <div className="flex flex-wrap justify-center gap-3">
                        {interests.map((interest) => {
                          const isSelected = selectedInterests.includes(interest.id);
                          return (
                            <button
                              key={interest.id}
                              onClick={() => toggleInterest(interest.id)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? `${info.bgColor} ${info.color} border ${info.borderColor}`
                                  : "bg-gv-neutral-800 text-gv-neutral-300 border border-gv-neutral-700 hover:border-gv-neutral-600"
                              }`}
                            >
                              {interest.label}
                              {isSelected && <span className="ml-1.5">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-6 py-3 text-gv-neutral-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all ${
                    canProceed
                      ? "bg-gv-primary-500 hover:bg-gv-primary-600 text-white"
                      : "bg-gv-neutral-700 text-gv-neutral-500 cursor-not-allowed"
                  }`}
                >
                  {selectedInterests.length < 3 ? (
                    `Select ${3 - selectedInterests.length} more`
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gv-neutral-500 mt-4">
                {selectedInterests.length} interest{selectedInterests.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === "complete" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gv-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-gv-primary-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                You&apos;re all set!
              </h1>
              <p className="text-gv-neutral-400 mb-6">
                We&apos;ll show you experiences tailored to your interests.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto mb-8">
                {selectedInterests.slice(0, 6).map((interestId) => {
                  const interest = AVAILABLE_INTERESTS.find((i) => i.id === interestId);
                  if (!interest) return null;
                  const info = categoryInfo[interest.category as keyof typeof categoryInfo];
                  return (
                    <span
                      key={interestId}
                      className={`px-3 py-1 rounded-full text-sm ${info.bgColor} ${info.color}`}
                    >
                      {interest.label}
                    </span>
                  );
                })}
                {selectedInterests.length > 6 && (
                  <span className="px-3 py-1 rounded-full text-sm bg-gv-neutral-800 text-gv-neutral-400">
                    +{selectedInterests.length - 6} more
                  </span>
                )}
              </div>
              <p className="text-sm text-gv-neutral-500">
                Taking you to your personalized home...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-gv-neutral-600">
          You can change your interests anytime in{" "}
          <Link href="/profile" className="text-gv-primary-500 hover:text-gv-primary-400">
            Profile Settings
          </Link>
        </p>
      </footer>
    </div>
  );
}
