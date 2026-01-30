"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamic import for standalone viewer (no SSR)
const StandaloneGaussianViewer = dynamic(
  () => import("@/components/viewer/StandaloneGaussianViewer"),
  { ssr: false }
);

// The same PLY URL we've been testing with
const TEST_PLY_URL = "https://tgkhjgemsarkmoflcrhj.supabase.co/storage/v1/object/public/ction-outputs/cmkygjjg0300031704raquf3p0/scene.ply";

export default function TestViewerPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute top-4 left-4 z-20 bg-black/80 text-white px-4 py-2 rounded">
        <h1 className="text-lg font-bold">Standalone Viewer Test</h1>
        <p className="text-sm text-gray-400">No R3F - Library handles everything</p>
        {loaded && <p className="text-green-400 text-sm mt-1">✓ Scene loaded</p>}
      </div>

      <StandaloneGaussianViewer
        url={TEST_PLY_URL}
        onLoad={() => {
          console.log("[TestPage] Scene loaded!");
          setLoaded(true);
        }}
        onError={(err) => {
          console.error("[TestPage] Error:", err);
        }}
        onProgress={(p) => {
          console.log("[TestPage] Progress:", Math.round(p * 100) + "%");
        }}
      />
    </div>
  );
}
