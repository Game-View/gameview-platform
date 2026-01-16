"use client";

import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { PlaybackMode, type PlayStats } from "@/components/playback";
import { type SceneData, type GameConfig, defaultGameConfig } from "@/lib/player-runtime";

export default function PlayExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const experienceId = params.id as string;

  // Fetch experience data with game data
  const { data: experience, isLoading, error } = trpc.experience.get.useQuery(
    { id: experienceId },
    { enabled: !!experienceId }
  );

  // Check purchase status for paid experiences
  const { data: purchaseCheck, isLoading: purchaseLoading } = trpc.stripe.checkPurchase.useQuery(
    { experienceId },
    { enabled: !!experienceId }
  );

  // Parse scenes data from experience
  const scenes: SceneData[] = useMemo(() => {
    if (!experience?.scenesData) {
      // Fallback: create basic scene from plyUrl if no scenesData
      if (experience?.plyUrl) {
        return [{
          id: "default",
          name: experience.title,
          splatUrl: experience.plyUrl,
          thumbnailUrl: experience.thumbnailUrl ?? null,
          placedObjects: [],
          interactions: [],
          cameraPosition: null,
          cameraTarget: null,
          audioConfig: null,
        }];
      }
      return [];
    }
    return experience.scenesData as SceneData[];
  }, [experience]);

  // Parse game config from experience
  const gameConfig: GameConfig | null = useMemo(() => {
    if (!experience?.gameConfig) return defaultGameConfig;
    return experience.gameConfig as GameConfig;
  }, [experience]);

  // Track play completion via API
  const completeMutation = trpc.playHistory.complete.useMutation();

  // Handle play completion
  const handleComplete = useCallback(async (stats: PlayStats) => {
    try {
      await completeMutation.mutateAsync({
        experienceId,
        playTimeSeconds: Math.floor(stats.timeElapsed / 1000),
        score: stats.score,
        collectibles: stats.collectibles,
        hasWon: stats.hasWon,
      });
      console.log("Play session recorded:", stats);
    } catch (error) {
      // Don't block the UI if tracking fails (e.g., user not logged in)
      console.error("Failed to record play session:", error);
    }
  }, [experienceId, completeMutation]);

  // Handle exit
  const handleExit = useCallback(() => {
    router.push(`/experience/${experienceId}`);
  }, [router, experienceId]);

  // Loading state
  if (isLoading || purchaseLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-gv-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading experience...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !experience) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Experience Not Found</h1>
          <p className="text-gv-neutral-400 mb-6">
            The experience you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Purchase verification for paid experiences
  const isPaid = Number(experience.price) > 0;
  const hasAccess = purchaseCheck?.hasAccess ?? !isPaid;

  if (isPaid && !hasAccess) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-gv-neutral-800 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-gv-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Purchase Required</h1>
          <p className="text-gv-neutral-400 mb-6">
            This experience costs ${Number(experience.price).toFixed(2)}. Purchase it to start playing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/experience/${experienceId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              Purchase Now
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Browse Experiences
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No 3D content
  if (!experience.plyUrl && scenes.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{experience.title}</h1>
          <p className="text-gv-neutral-400 mb-6">
            This experience is still being processed. Please check back soon!
          </p>
          <Link
            href={`/experience/${experienceId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  // Render interactive playback mode
  return (
    <PlaybackMode
      experienceId={experienceId}
      experienceTitle={experience.title}
      scenes={scenes}
      gameConfig={gameConfig}
      onExit={handleExit}
      onComplete={handleComplete}
    />
  );
}
