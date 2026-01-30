"use client";

import dynamic from "next/dynamic";
import { useState, useRef } from "react";

// Dynamic import for standalone viewer (no SSR)
const StandaloneGaussianViewer = dynamic(
  () => import("@/components/viewer/StandaloneGaussianViewer"),
  { ssr: false }
);

// Default test URL (may not exist)
const DEFAULT_PLY_URL = "https://tgkhjgemsarkmoflcrhj.supabase.co/storage/v1/object/public/production-outputs/cmk1vyalq0003jx04yju1f0vh/scene.ply";

export default function TestViewerPage() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plyUrl, setPlyUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke old blob URL if exists
      if (plyUrl && plyUrl.startsWith("blob:")) {
        URL.revokeObjectURL(plyUrl);
      }

      // Create blob URL for the local file
      const blobUrl = URL.createObjectURL(file);
      setPlyUrl(blobUrl);
      setFileName(file.name);
      setLoaded(false);
      setError(null);
      console.log("[TestPage] Local file selected:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2), "MB");
    }
  };

  const loadDefaultUrl = () => {
    if (plyUrl && plyUrl.startsWith("blob:")) {
      URL.revokeObjectURL(plyUrl);
    }
    setPlyUrl(DEFAULT_PLY_URL);
    setFileName("Remote PLY");
    setLoaded(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute top-4 left-4 z-20 bg-black/80 text-white px-4 py-2 rounded max-w-md">
        <h1 className="text-lg font-bold">Standalone Viewer Test</h1>
        <p className="text-sm text-gray-400">No R3F - Library handles everything</p>

        {!plyUrl && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-yellow-400">Select a PLY file to test:</p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Choose Local File
              </button>
              <button
                onClick={loadDefaultUrl}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
              >
                Use Remote URL
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ply,.splat"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {plyUrl && (
          <div className="mt-2">
            <p className="text-sm text-gray-300">File: {fileName}</p>
            {loaded && <p className="text-green-400 text-sm">✓ Scene loaded</p>}
            {error && <p className="text-red-400 text-sm">✗ {error}</p>}
            <button
              onClick={() => {
                if (plyUrl.startsWith("blob:")) {
                  URL.revokeObjectURL(plyUrl);
                }
                setPlyUrl(null);
                setFileName(null);
                setLoaded(false);
                setError(null);
              }}
              className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              Load Different File
            </button>
          </div>
        )}
      </div>

      {plyUrl && (
        <StandaloneGaussianViewer
          url={plyUrl}
          onLoad={() => {
            console.log("[TestPage] Scene loaded!");
            setLoaded(true);
          }}
          onError={(err) => {
            console.error("[TestPage] Error:", err);
            setError(String(err));
          }}
          onProgress={(p) => {
            console.log("[TestPage] Progress:", Math.round(p * 100) + "%");
          }}
        />
      )}
    </div>
  );
}
