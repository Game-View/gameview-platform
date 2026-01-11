"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import {
  ArrowLeft,
  Loader2,
  X,
  Trophy,
  Clock,
  Star,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// Dynamic import for GaussianSplats (client-side only)
const GaussianSplats = dynamic(
  () =>
    import("@/components/viewer/GaussianSplats").then(
      (mod) => mod.GaussianSplats
    ),
  { ssr: false }
);

interface GameState {
  score: number;
  collectibles: number;
  timeRemaining: number;
  isPlaying: boolean;
  isComplete: boolean;
}

export default function PlayExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const experienceId = params.id as string;

  // Fetch experience data
  const { data: experience, isLoading, error } = trpc.experience.get.useQuery(
    { id: experienceId },
    { enabled: !!experienceId }
  );

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    collectibles: 0,
    timeRemaining: 300, // 5 minutes default
    isPlaying: false,
    isComplete: false,
  });

  // Scene loading state
  const [sceneLoading, setSceneLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [sceneError, setSceneError] = useState<string | null>(null);

  // Timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start the game
  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      isComplete: false,
      score: 0,
      collectibles: 0,
      timeRemaining: 300,
    }));
  }, []);

  // Pause the game
  const pauseGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  // Resume the game
  const resumeGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  // Reset the game
  const resetGame = useCallback(() => {
    setGameState({
      score: 0,
      collectibles: 0,
      timeRemaining: 300,
      isPlaying: false,
      isComplete: false,
    });
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState.isPlaying && gameState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeRemaining <= 1) {
            return { ...prev, timeRemaining: 0, isPlaying: false, isComplete: true };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.timeRemaining]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (isLoading) {
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

  // No 3D content
  if (!experience.plyUrl) {
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

  return (
    <div className="fixed inset-0 bg-black">
      {/* 3D Canvas */}
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1.6, 5]} fov={75} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Gaussian Splats */}
        <GaussianSplats
          url={experience.plyUrl}
          onLoad={() => {
            setSceneLoading(false);
            if (!gameState.isPlaying && !gameState.isComplete) {
              // Auto-start when loaded
              startGame();
            }
          }}
          onError={(err) => {
            setSceneError(err.message);
            setSceneLoading(false);
          }}
          onProgress={(progress) => setLoadProgress(progress)}
        />

        {/* Orbit Controls for now - first person in future */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Loading Overlay */}
      {sceneLoading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-gv-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Loading 3D Scene...</p>
            <div className="w-48 h-2 bg-gv-neutral-800 rounded-full overflow-hidden mx-auto">
              <div
                className="h-full bg-gv-primary-500 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="text-gv-neutral-400 text-sm mt-2">{loadProgress.toFixed(0)}%</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {sceneError && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">Failed to Load Scene</h2>
            <p className="text-gv-neutral-400 mb-6">{sceneError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      {!sceneLoading && !sceneError && (
        <>
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-40">
            {/* Back Button */}
            <Link
              href={`/experience/${experienceId}`}
              className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Exit</span>
            </Link>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-lg font-bold text-white">{experience.title}</h1>
            </div>

            {/* Pause Button */}
            <button
              onClick={gameState.isPlaying ? pauseGame : resumeGame}
              className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-colors"
            >
              {gameState.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Game Stats */}
          <div className="absolute top-16 left-4 z-40 space-y-2">
            {/* Score */}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-bold">{gameState.score}</span>
            </div>

            {/* Collectibles */}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
              <Trophy className="h-5 w-5 text-gv-primary-400" />
              <span className="text-white font-bold">{gameState.collectibles}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
              <Clock className="h-5 w-5 text-green-400" />
              <span className="text-white font-bold font-mono">
                {formatTime(gameState.timeRemaining)}
              </span>
            </div>
          </div>

          {/* Controls Help */}
          <div className="absolute bottom-4 left-4 z-40">
            <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
              <p className="text-gv-neutral-400 text-sm">
                <span className="text-white">Drag</span> to look around |{" "}
                <span className="text-white">Scroll</span> to zoom
              </p>
            </div>
          </div>
        </>
      )}

      {/* Game Complete Overlay */}
      {gameState.isComplete && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center bg-gv-neutral-900 border border-gv-neutral-700 rounded-2xl p-8 max-w-md mx-4">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Time&apos;s Up!</h2>
            <p className="text-gv-neutral-400 mb-6">Great job exploring!</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gv-neutral-800 rounded-lg p-4">
                <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{gameState.score}</p>
                <p className="text-sm text-gv-neutral-400">Score</p>
              </div>
              <div className="bg-gv-neutral-800 rounded-lg p-4">
                <Trophy className="h-8 w-8 text-gv-primary-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{gameState.collectibles}</p>
                <p className="text-sm text-gv-neutral-400">Collected</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetGame}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
                Play Again
              </button>
              <Link
                href={`/experience/${experienceId}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
              >
                Done
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Paused Overlay */}
      {!gameState.isPlaying && !gameState.isComplete && !sceneLoading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Paused</h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={resumeGame}
                className="flex items-center gap-2 px-8 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                <Play className="h-5 w-5" />
                Resume
              </button>
              <Link
                href={`/experience/${experienceId}`}
                className="px-8 py-3 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white font-medium rounded-lg transition-colors"
              >
                Exit
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
