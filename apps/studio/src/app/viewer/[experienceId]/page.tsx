"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ExternalLink, Download } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import for the 3D viewer
const GaussianSplats = dynamic(
  () => import("@/components/viewer/GaussianSplats").then((mod) => mod.GaussianSplats),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gv-neutral-900">
        <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin" />
      </div>
    ),
  }
);

interface ExperienceData {
  id: string;
  title: string;
  description: string;
  plyUrl: string | null;
  camerasJson: string | null;
  thumbnailUrl: string | null;
  status: string;
  createdAt: string;
}

export default function ExperienceViewerPage() {
  const params = useParams();
  const router = useRouter();
  const experienceId = params.experienceId as string;

  const [experience, setExperience] = useState<ExperienceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExperience() {
      try {
        const response = await fetch(
          `/api/trpc/experience.get?batch=1&input=${encodeURIComponent(
            JSON.stringify({ "0": { json: { id: experienceId } } })
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch experience");
        }

        const data = await response.json();
        const result = Array.isArray(data) ? data[0] : data;

        if (result?.error) {
          throw new Error(result.error.message || "Experience not found");
        }

        if (result?.result?.data?.json) {
          setExperience(result.result.data.json);
        } else {
          throw new Error("Experience not found");
        }
      } catch (err) {
        console.error("Failed to fetch experience:", err);
        setError(err instanceof Error ? err.message : "Failed to load experience");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExperience();
  }, [experienceId]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gv-neutral-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gv-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gv-neutral-400">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gv-neutral-900">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Cannot Load Experience</h1>
          <p className="text-gv-neutral-400 mb-6">{error || "Experience not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!experience.plyUrl) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gv-neutral-900">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Processing Not Complete</h1>
          <p className="text-gv-neutral-400 mb-6">
            This experience is still being processed. Please check back later.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white font-medium rounded-gv transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-16 bg-gv-neutral-900 border-b border-gv-neutral-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800 rounded-gv transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-white font-semibold">{experience.title}</h1>
            <p className="text-xs text-gv-neutral-400">
              Created {new Date(experience.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {experience.plyUrl && (
            <a
              href={experience.plyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gv-neutral-800 hover:bg-gv-neutral-700 text-white rounded-gv transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Download PLY
            </a>
          )}
          <button
            onClick={() => {
              // Open in player app if available
              const playerUrl = process.env.NEXT_PUBLIC_PLAYER_URL;
              if (playerUrl) {
                window.open(`${playerUrl}/experience/${experienceId}/play`, "_blank");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Player
          </button>
        </div>
      </header>

      {/* 3D Viewer */}
      <main className="flex-1 relative">
        <GaussianSplats url={experience.plyUrl} />

        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-gv p-3 text-white text-sm">
          <p className="font-medium mb-1">Controls</p>
          <ul className="text-gv-neutral-300 text-xs space-y-0.5">
            <li>Click + drag to rotate</li>
            <li>Scroll to zoom</li>
            <li>Right-click + drag to pan</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
