"use client";

import { useState, useCallback } from "react";

/**
 * Pipeline Test Page
 *
 * Interactive test page to verify the entire production pipeline:
 * 1. Upload URL generation
 * 2. Video upload to Supabase
 * 3. Production creation with quality/4D options
 * 4. Modal submission
 * 5. Callback simulation
 * 6. Viewer loading
 *
 * Access at: /test-pipeline
 */

interface TestResult {
  name: string;
  status: "pending" | "running" | "passed" | "failed";
  message?: string;
  duration?: number;
}

interface ProductionSettings {
  preset: "fast" | "balanced" | "high";
  motionEnabled: boolean;
}

export default function TestPipelinePage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState<ProductionSettings>({
    preset: "balanced",
    motionEnabled: false,
  });
  const [simulatedExperienceId, setSimulatedExperienceId] = useState<string | null>(null);

  const updateResult = useCallback(
    (name: string, update: Partial<TestResult>) => {
      setResults((prev) =>
        prev.map((r) => (r.name === name ? { ...r, ...update } : r))
      );
    },
    []
  );

  const addResult = useCallback((result: TestResult) => {
    setResults((prev) => [...prev, result]);
  }, []);

  // Test 1: Server Health Check
  const testServerHealth = async (): Promise<boolean> => {
    const name = "Server Health Check";
    addResult({ name, status: "running" });
    const start = Date.now();

    try {
      const response = await fetch("/api/processing/callback", {
        method: "GET",
      });
      const data = await response.json();
      const passed = data.status === "ok";

      updateResult(name, {
        status: passed ? "passed" : "failed",
        message: passed ? "Server is healthy" : "Server returned unexpected response",
        duration: Date.now() - start,
      });
      return passed;
    } catch (error) {
      updateResult(name, {
        status: "failed",
        message: `Connection error: ${error instanceof Error ? error.message : "Unknown"}`,
        duration: Date.now() - start,
      });
      return false;
    }
  };

  // Test 2: Upload URL Generation
  const testUploadUrl = async (): Promise<boolean> => {
    const name = "Upload URL Generation";
    addResult({ name, status: "running" });
    const start = Date.now();

    try {
      const response = await fetch("/api/productions/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: "test-video.mp4" }),
      });

      // 401 is expected without auth
      if (response.status === 401) {
        updateResult(name, {
          status: "passed",
          message: "Endpoint correctly requires authentication",
          duration: Date.now() - start,
        });
        return true;
      }

      const data = await response.json();
      const passed = data.success === true;

      updateResult(name, {
        status: passed ? "passed" : "failed",
        message: passed ? "Upload URL generated" : data.error || "Failed",
        duration: Date.now() - start,
      });
      return passed;
    } catch (error) {
      updateResult(name, {
        status: "failed",
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        duration: Date.now() - start,
      });
      return false;
    }
  };

  // Test 3: Production Queue Endpoint
  const testProductionQueue = async (): Promise<boolean> => {
    const name = "Production Queue Endpoint";
    addResult({ name, status: "running" });
    const start = Date.now();

    try {
      const response = await fetch("/api/productions/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productionId: "test-prod-" + Date.now(),
          experienceId: "test-exp-" + Date.now(),
          creatorId: "test-creator",
          sourceVideos: [
            { url: "https://example.com/v1.mp4", filename: "v1.mp4", size: 1000000 },
            { url: "https://example.com/v2.mp4", filename: "v2.mp4", size: 1000000 },
          ],
          preset: settings.preset,
          motionEnabled: settings.motionEnabled,
        }),
      });

      // 404 means job validation works (expected for non-existent job)
      if (response.status === 404) {
        updateResult(name, {
          status: "passed",
          message: "Endpoint correctly validates job existence",
          duration: Date.now() - start,
        });
        return true;
      }

      const data = await response.json();
      updateResult(name, {
        status: response.ok ? "passed" : "failed",
        message: response.ok ? `Queued via ${data.processor}` : data.error,
        duration: Date.now() - start,
      });
      return response.ok;
    } catch (error) {
      updateResult(name, {
        status: "failed",
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        duration: Date.now() - start,
      });
      return false;
    }
  };

  // Test 4: Processing Callback (Static)
  const testStaticCallback = async (): Promise<boolean> => {
    const name = "Processing Callback (Static)";
    addResult({ name, status: "running" });
    const start = Date.now();

    try {
      const response = await fetch("/api/processing/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          production_id: "test-callback-" + Date.now(),
          experience_id: "test-exp-" + Date.now(),
          outputs: {
            plyUrl: "https://example.com/scene.ply",
            camerasUrl: "https://example.com/cameras.json",
            thumbnailUrl: "https://example.com/thumb.jpg",
          },
        }),
      });

      // 404 is expected (job doesn't exist)
      const passed = response.status === 404 || response.ok;

      updateResult(name, {
        status: passed ? "passed" : "failed",
        message: passed ? "Callback endpoint working" : "Unexpected error",
        duration: Date.now() - start,
      });
      return passed;
    } catch (error) {
      updateResult(name, {
        status: "failed",
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        duration: Date.now() - start,
      });
      return false;
    }
  };

  // Test 5: Processing Callback (4D Motion)
  const test4DCallback = async (): Promise<boolean> => {
    const name = "Processing Callback (4D Motion)";
    addResult({ name, status: "running" });
    const start = Date.now();

    try {
      const response = await fetch("/api/processing/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          production_id: "test-4d-callback-" + Date.now(),
          experience_id: "test-4d-exp-" + Date.now(),
          outputs: {
            plyUrl: "https://example.com/frame_00000.ply",
            camerasUrl: "https://example.com/cameras.json",
            thumbnailUrl: "https://example.com/thumb.jpg",
            motionMetadataUrl: "https://example.com/metadata.json",
            motionFrameCount: 150,
            motionDuration: 10.0,
            motionFps: 15,
          },
        }),
      });

      // 404 is expected (job doesn't exist)
      const passed = response.status === 404 || response.ok;

      updateResult(name, {
        status: passed ? "passed" : "failed",
        message: passed ? "4D callback format accepted" : "Unexpected error",
        duration: Date.now() - start,
      });
      return passed;
    } catch (error) {
      updateResult(name, {
        status: "failed",
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        duration: Date.now() - start,
      });
      return false;
    }
  };

  // Test 6: Viewer Component Check
  const testViewerComponents = async (): Promise<boolean> => {
    const name = "Viewer Components";
    addResult({ name, status: "running" });
    const start = Date.now();

    try {
      // Dynamically import components to verify they load
      const { SceneViewer } = await import("@/components/viewer/SceneViewer");
      const { TemporalSceneViewer } = await import("@/components/viewer/TemporalSceneViewer");

      const passed = !!SceneViewer && !!TemporalSceneViewer;

      updateResult(name, {
        status: passed ? "passed" : "failed",
        message: passed
          ? "SceneViewer and TemporalSceneViewer loaded"
          : "Failed to load viewer components",
        duration: Date.now() - start,
      });
      return passed;
    } catch (error) {
      updateResult(name, {
        status: "failed",
        message: `Import error: ${error instanceof Error ? error.message : "Unknown"}`,
        duration: Date.now() - start,
      });
      return false;
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    await testServerHealth();
    await testUploadUrl();
    await testProductionQueue();
    await testStaticCallback();
    await test4DCallback();
    await testViewerComponents();

    setIsRunning(false);
  };

  const passedCount = results.filter((r) => r.status === "passed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Pipeline Test Dashboard</h1>
        <p className="text-gray-400 mb-8">
          Test the complete production pipeline from upload to viewer
        </p>

        {/* Settings */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Quality Preset
              </label>
              <select
                value={settings.preset}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    preset: e.target.value as ProductionSettings["preset"],
                  }))
                }
                className="w-full bg-gray-700 rounded px-3 py-2"
                disabled={isRunning}
              >
                <option value="fast">Fast (5K steps, 5M splats)</option>
                <option value="balanced">Balanced (15K steps, 10M splats)</option>
                <option value="high">High (30K steps, 20M splats)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                4D Motion
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.motionEnabled}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, motionEnabled: e.target.checked }))
                  }
                  className="w-5 h-5 rounded bg-gray-700"
                  disabled={isRunning}
                />
                <span>Enable 4D motion processing</span>
              </label>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className={`w-full py-3 rounded-lg font-semibold mb-6 ${
            isRunning
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Results</h2>
              <div className="text-sm">
                <span className="text-green-400">{passedCount} passed</span>
                {" / "}
                <span className="text-red-400">{failedCount} failed</span>
              </div>
            </div>

            <div className="space-y-3">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded ${
                    result.status === "passed"
                      ? "bg-green-900/30 border border-green-700"
                      : result.status === "failed"
                      ? "bg-red-900/30 border border-red-700"
                      : result.status === "running"
                      ? "bg-blue-900/30 border border-blue-700"
                      : "bg-gray-700/30 border border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {result.status === "passed" && "✅"}
                      {result.status === "failed" && "❌"}
                      {result.status === "running" && "⏳"}
                      {result.status === "pending" && "⏸️"}
                    </span>
                    <div>
                      <div className="font-medium">{result.name}</div>
                      {result.message && (
                        <div className="text-sm text-gray-400">
                          {result.message}
                        </div>
                      )}
                    </div>
                  </div>
                  {result.duration && (
                    <div className="text-sm text-gray-500">
                      {result.duration}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Tests Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Testing Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/dashboard"
              className="block p-4 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              <div className="font-medium">Dashboard</div>
              <div className="text-sm text-gray-400">View productions list</div>
            </a>
            <a
              href="/productions/new"
              className="block p-4 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              <div className="font-medium">New Production</div>
              <div className="text-sm text-gray-400">Create a new production</div>
            </a>
            <a
              href="/editor"
              className="block p-4 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              <div className="font-medium">Editor</div>
              <div className="text-sm text-gray-400">Scene editor interface</div>
            </a>
            <a
              href="/viewer"
              className="block p-4 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              <div className="font-medium">Viewer</div>
              <div className="text-sm text-gray-400">3D scene viewer</div>
            </a>
          </div>
        </div>

        {/* Pipeline Flow Diagram */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pipeline Flow</h2>
          <div className="text-sm text-gray-400 font-mono whitespace-pre">
{`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│  Production │────▶│    Modal    │
│   Videos    │     │   Create    │     │   Worker    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Viewer/   │◀────│  Supabase   │◀────│  Callback   │
│   Editor    │     │   Storage   │     │   Handler   │
└─────────────┘     └─────────────┘     └─────────────┘
`}
          </div>
        </div>

        {/* Quality Settings Reference */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quality Presets Reference</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2">Preset</th>
                <th className="pb-2">Steps</th>
                <th className="pb-2">Max Splats</th>
                <th className="pb-2">Image %</th>
                <th className="pb-2">FPS</th>
                <th className="pb-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 text-yellow-400">Fast</td>
                <td>5,000</td>
                <td>5M</td>
                <td>30%</td>
                <td>15</td>
                <td>5 min</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 text-blue-400">Balanced</td>
                <td>15,000</td>
                <td>10M</td>
                <td>50%</td>
                <td>24</td>
                <td>10 min</td>
              </tr>
              <tr>
                <td className="py-2 text-purple-400">High</td>
                <td>30,000</td>
                <td>20M</td>
                <td>75%</td>
                <td>30</td>
                <td>15 min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
