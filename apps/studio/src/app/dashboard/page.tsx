"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useUser, UserButton } from "@/lib/auth";
import Link from "next/link";
import {
  Sparkles,
  FolderOpen,
  Settings,
  Clock,
  Target,
  Trash2,
  Archive,
  MoreVertical,
  Loader2,
  Search,
  X,
  Wrench,
  Video,
} from "lucide-react";
import type { StoredBrief } from "@/lib/briefs";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "@/stores/toast-store";
import {
  NewProductionModal,
  ProductionProgressList,
  type Production,
} from "@/components/production";

const EXPERIENCE_TYPE_LABELS: Record<string, string> = {
  treasure_hunt: "Treasure Hunt",
  virtual_tour: "Virtual Tour",
  interactive_story: "Interactive Story",
  competition: "Competition",
  brand_experience: "Brand Experience",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gv-neutral-600",
  in_progress: "bg-gv-warning-500",
  ready: "bg-gv-success",
  archived: "bg-gv-neutral-500",
};

type FilterStatus = "all" | "draft" | "in_progress" | "ready" | "archived";

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All Projects" },
  { value: "draft", label: "Drafts" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "archived", label: "Archived" },
];

export default function DashboardPage() {
  const { user } = useUser();
  const [briefs, setBriefs] = useState<StoredBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    briefId: string | null;
    briefName: string;
  }>({ isOpen: false, briefId: null, briefName: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  // New Production modal state
  const [showNewProductionModal, setShowNewProductionModal] = useState(false);
  const [productions, setProductions] = useState<Production[]>([]);

  const metadata = user?.unsafeMetadata as {
    profileCompleted?: boolean;
    creatorType?: string;
  } | undefined;

  // Fetch briefs and productions on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch briefs and productions in parallel
        const [briefsRes, productionsRes] = await Promise.all([
          fetch("/api/briefs"),
          fetch("/api/trpc/production.list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ json: { limit: 50 } }),
          }),
        ]);

        if (briefsRes.ok) {
          const briefsData = await briefsRes.json();
          setBriefs(briefsData);
        }

        if (productionsRes.ok) {
          const prodData = await productionsRes.json();
          if (prodData.result?.data?.json?.items) {
            const items = prodData.result.data.json.items;
            // Map database items to Production type
            const mappedProductions: Production[] = items.map((item: {
              id: string;
              name: string;
              status: string;
              stage?: string;
              progress: number;
              createdAt: string;
              completedAt?: string;
              videoCount: number;
              preset: "fast" | "balanced" | "high";
              error?: string;
              thumbnailUrl?: string;
            }) => ({
              id: item.id,
              name: item.name,
              status: item.stage || item.status,
              progress: item.progress,
              stageProgress: item.progress,
              createdAt: item.createdAt,
              completedAt: item.completedAt,
              videoCount: item.videoCount,
              preset: item.preset,
              errorMessage: item.error,
              thumbnailUrl: item.thumbnailUrl,
            }));
            setProductions(mappedProductions);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load projects", "Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Track SSE subscriptions to avoid duplicates
  const subscribedIdsRef = useRef<Set<string>>(new Set());

  // Subscribe to Server-Sent Events for real-time progress
  const subscribeToProgress = useCallback((productionId: string) => {
    const eventSource = new EventSource(`/api/productions/progress/${productionId}`);

    eventSource.onmessage = (event) => {
      try {
        const progress = JSON.parse(event.data);
        setProductions((prev) =>
          prev.map((p) =>
            p.id === productionId
              ? {
                  ...p,
                  status: progress.stage,
                  progress: progress.progress,
                  stageProgress: progress.progress,
                  ...(progress.stage === "completed" && {
                    completedAt: new Date().toISOString(),
                  }),
                }
              : p
          )
        );

        if (progress.stage === "completed") {
          toast.success("Production complete", "Your 3D scene is ready!");
          eventSource.close();
          subscribedIdsRef.current.delete(productionId);
        } else if (progress.stage === "failed") {
          toast.error("Production failed", progress.message || "Please try again.");
          eventSource.close();
          subscribedIdsRef.current.delete(productionId);
        }
      } catch {
        // Ignore heartbeats and invalid messages
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      subscribedIdsRef.current.delete(productionId);
    };
  }, []);

  // Subscribe to SSE for in-progress productions
  useEffect(() => {
    productions.forEach((prod) => {
      const isActive = !["completed", "failed", "cancelled"].includes(prod.status);
      const alreadySubscribed = subscribedIdsRef.current.has(prod.id);

      if (isActive && !alreadySubscribed) {
        subscribedIdsRef.current.add(prod.id);
        subscribeToProgress(prod.id);
      }
    });
  }, [productions, subscribeToProgress]);

  // Filter and search briefs
  const filteredBriefs = useMemo(() => {
    return briefs.filter((brief) => {
      // Filter by status
      if (filterStatus !== "all" && brief.status !== filterStatus) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (brief.name || "").toLowerCase();
        const tagline = (brief.tagline || "").toLowerCase();
        const concept = (brief.concept || "").toLowerCase();

        return name.includes(query) || tagline.includes(query) || concept.includes(query);
      }

      return true;
    });
  }, [briefs, filterStatus, searchQuery]);

  // Count by status for tabs
  const statusCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      all: briefs.length,
      draft: 0,
      in_progress: 0,
      ready: 0,
      archived: 0,
    };
    briefs.forEach((brief) => {
      if (brief.status in counts) {
        counts[brief.status as FilterStatus]++;
      }
    });
    return counts;
  }, [briefs]);

  // Open delete confirmation
  const openDeleteModal = (brief: StoredBrief) => {
    setDeleteModal({
      isOpen: true,
      briefId: brief.id,
      briefName: brief.name || "Untitled Project",
    });
    setActiveMenu(null);
  };

  // Delete (permanently remove) a brief
  const handleDelete = async () => {
    if (!deleteModal.briefId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/briefs/${deleteModal.briefId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setBriefs((prev) => prev.filter((b) => b.id !== deleteModal.briefId));
        toast.success("Project deleted", `"${deleteModal.briefName}" has been removed.`);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete brief:", error);
      toast.error("Delete failed", "Could not delete the project. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, briefId: null, briefName: "" });
    }
  };

  // Archive a brief
  const handleArchive = async (brief: StoredBrief) => {
    const newStatus = brief.status === "archived" ? "draft" : "archived";
    try {
      const response = await fetch(`/api/briefs/${brief.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setBriefs((prev) =>
          prev.map((b) => (b.id === brief.id ? { ...b, status: newStatus } : b))
        );
        toast.success(
          newStatus === "archived" ? "Project archived" : "Project restored",
          newStatus === "archived"
            ? `"${brief.name || "Untitled"}" moved to archive.`
            : `"${brief.name || "Untitled"}" restored to drafts.`
        );
      }
    } catch (error) {
      console.error("Failed to archive brief:", error);
      toast.error("Action failed", "Could not update the project. Please try again.");
    }
    setActiveMenu(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Handle new production creation - calls real tRPC API when available
  const handleCreateProduction = async (settings: {
    name: string;
    preset: "fast" | "balanced" | "high";
    videos: Array<{ id: string; name: string; size: number; url?: string; path?: string }>;
  }) => {
    // Check if we have uploaded URLs (real upload) or mock data (simulated)
    const hasRealUploads = settings.videos.every((v) => v.url && !v.url.startsWith("/mock"));

    if (hasRealUploads) {
      // Use real tRPC API
      try {
        const response = await fetch("/api/trpc/production.create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            json: {
              name: settings.name,
              preset: settings.preset,
              sourceVideos: settings.videos.map((v) => ({
                url: v.url!,
                filename: v.name,
                size: v.size,
              })),
            },
          }),
        });

        const data = await response.json();
        console.log("[Production] API Response:", JSON.stringify(data, null, 2));

        // Check for tRPC error response
        if (data.error) {
          console.error("[Production] tRPC Error:", data.error);
          toast.error("Production failed", data.error.message || "Failed to create production");
          return;
        }

        if (data.result?.data?.json) {
          const production = data.result.data.json;
          const newProduction: Production = {
            id: production.id,
            name: production.name,
            status: "queued",
            progress: 0,
            stageProgress: 0,
            createdAt: production.createdAt,
            videoCount: production.videoCount,
            preset: production.preset,
          };

          setProductions((prev) => [newProduction, ...prev]);
          toast.success("Production started", `"${settings.name}" is now processing.`);

          // Subscribe to SSE for real-time progress
          subscribeToProgress(production.id);
          return;
        } else {
          // Unexpected response format
          console.error("[Production] Unexpected response format:", data);
          toast.error("Production failed", "Unexpected response from server. Check console for details.");
          return;
        }
      } catch (error) {
        console.error("Failed to create production via API:", error);
        toast.error("Production failed", error instanceof Error ? error.message : "Network error");
        return;
      }
    }

    // Simulation mode - only for local development with mock uploads
    // In production, if we reach here it means real uploads failed somehow
    if (process.env.NODE_ENV === "production") {
      toast.error("Production failed", "Videos were uploaded but production could not be started. Please try again.");
      return;
    }

    // Development simulation mode
    console.log("[Production] Running in simulation mode (development only)");
    const newProduction: Production = {
      id: `prod_${Date.now()}`,
      name: settings.name,
      status: "queued",
      progress: 0,
      stageProgress: 0,
      createdAt: new Date().toISOString(),
      videoCount: settings.videos.length,
      preset: settings.preset,
    };

    setProductions((prev) => [newProduction, ...prev]);
    toast.success("Production started (dev mode)", `"${settings.name}" is simulating processing.`);
    simulateProductionProgress(newProduction.id);
  };

  // Simulate production progress (placeholder for real backend integration)
  const simulateProductionProgress = (productionId: string) => {
    const stages: Array<Production["status"]> = [
      "frame_extraction",
      "colmap",
      "brush_processing",
      "metadata_generation",
      "completed",
    ];
    let stageIndex = 0;
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 5;
      const stageProgress = (progress % 25) * 4;

      if (progress >= 25 * (stageIndex + 1) && stageIndex < stages.length - 1) {
        stageIndex++;
      }

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setProductions((prev) =>
          prev.map((p) =>
            p.id === productionId
              ? {
                  ...p,
                  status: "completed",
                  progress: 100,
                  stageProgress: 100,
                  completedAt: new Date().toISOString(),
                }
              : p
          )
        );
        toast.success("Production complete", "Your 3D scene is ready!");
        return;
      }

      setProductions((prev) =>
        prev.map((p) =>
          p.id === productionId
            ? {
                ...p,
                status: stages[stageIndex],
                progress: Math.floor(progress),
                stageProgress: Math.floor(stageProgress),
              }
            : p
        )
      );
    }, 500);
  };

  // Handle production actions
  const handleViewProduction = (id: string) => {
    // Navigate to editor with this production
    window.location.href = `/project/${id}`;
  };

  const handleRetryProduction = async (id: string) => {
    try {
      // Call tRPC to retry the production
      const response = await fetch("/api/trpc/production.retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { id } }),
      });

      if (response.ok) {
        setProductions((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: "queued" as const, progress: 0, stageProgress: 0, errorMessage: undefined }
              : p
          )
        );
        // Subscribe to SSE for progress updates
        subscribeToProgress(id);
        toast.success("Retry started", "The production is being reprocessed.");
      } else {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to retry");
      }
    } catch (error) {
      console.error("Failed to retry production:", error);
      toast.error("Retry failed", error instanceof Error ? error.message : "Could not retry. Please try again.");
    }
  };

  const handleDeleteProduction = async (id: string) => {
    try {
      // Call tRPC to delete from database
      const response = await fetch("/api/trpc/production.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { id } }),
      });

      if (response.ok) {
        setProductions((prev) => prev.filter((p) => p.id !== id));
        toast.success("Production deleted", "The production has been removed.");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete production:", error);
      toast.error("Delete failed", "Could not delete the production. Please try again.");
    }
  };

  const handleCancelProduction = async (id: string) => {
    try {
      // Call tRPC to cancel the production
      const response = await fetch("/api/trpc/production.cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { id } }),
      });

      if (response.ok) {
        setProductions((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: "cancelled" as const, progress: 0 }
              : p
          )
        );
        // Remove from SSE subscriptions
        subscribedIdsRef.current.delete(id);
        toast.success("Production cancelled", "The production has been stopped.");
      } else {
        throw new Error("Failed to cancel");
      }
    } catch (error) {
      console.error("Failed to cancel production:", error);
      toast.error("Cancel failed", "Could not cancel the production. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Header */}
      <header className="border-b border-gv-neutral-800 bg-gv-neutral-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐰</span>
            <span className="font-bold text-white text-xl tracking-wide">GAME VIEW</span>
            <span className="text-gv-primary-500 font-semibold">Studio</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Keyboard shortcut hint */}
            <button
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-sm text-gv-neutral-400 hover:text-white hover:border-gv-neutral-600 transition-colors"
              onClick={() => {
                // Trigger command palette via keyboard event
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Quick actions</span>
              <kbd className="ml-1 px-1.5 py-0.5 bg-gv-neutral-700 rounded text-xs">⌘K</kbd>
            </button>
            <Link
              href="/settings"
              className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-gv-neutral-400">
            {metadata?.creatorType
              ? "Ready to create your next experience?"
              : "Let's build something amazing together."}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link
            href="/spark"
            className="group p-6 bg-gv-primary-500/10 border border-gv-primary-500/30 rounded-gv-lg hover:border-gv-primary-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-gv bg-gv-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-gv-primary-500/30 transition-colors">
              <Sparkles className="h-6 w-6 text-gv-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Start with Spark</h3>
            <p className="text-gv-neutral-400 text-sm">
              Describe your vision and let AI help you build it
            </p>
          </Link>

          <button
            onClick={() => setShowNewProductionModal(true)}
            className="group p-6 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg hover:border-gv-neutral-600 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-gv bg-gv-neutral-700 flex items-center justify-center mb-4 group-hover:bg-gv-neutral-600 transition-colors">
              <Video className="h-6 w-6 text-gv-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">New Production</h3>
            <p className="text-gv-neutral-400 text-sm">
              Transform video footage into a 3D scene
            </p>
          </button>

          <button className="group p-6 bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg hover:border-gv-neutral-600 transition-all text-left">
            <div className="w-12 h-12 rounded-gv bg-gv-neutral-700 flex items-center justify-center mb-4 group-hover:bg-gv-neutral-600 transition-colors">
              <FolderOpen className="h-6 w-6 text-gv-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Open Project</h3>
            <p className="text-gv-neutral-400 text-sm">
              Continue working on an existing project
            </p>
          </button>
        </div>

        {/* Active Productions Section */}
        {productions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-6">
              Active Productions
            </h2>
            <ProductionProgressList
              productions={productions}
              onView={handleViewProduction}
              onRetry={handleRetryProduction}
              onDelete={handleDeleteProduction}
              onCancel={handleCancelProduction}
            />
          </div>
        )}

        {/* Projects Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">Your Projects</h2>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gv-neutral-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white text-sm placeholder:text-gv-neutral-500 focus:outline-none focus:border-gv-primary-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gv-neutral-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-gv whitespace-nowrap transition-colors ${
                  filterStatus === option.value
                    ? "bg-gv-primary-500/20 text-gv-primary-400 border border-gv-primary-500/30"
                    : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800"
                }`}
              >
                {option.label}
                {statusCounts[option.value] > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gv-neutral-700">
                    {statusCounts[option.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-gv-neutral-400 animate-spin" />
            </div>
          ) : filteredBriefs.length === 0 ? (
            <div className="bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-12 text-center">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
                  <p className="text-gv-neutral-400 mb-2">
                    No projects match &ldquo;{searchQuery}&rdquo;
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-gv-primary-500 hover:text-gv-primary-400 text-sm"
                  >
                    Clear search
                  </button>
                </>
              ) : filterStatus !== "all" ? (
                <>
                  <FolderOpen className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
                  <p className="text-gv-neutral-400 mb-2">
                    No {filterStatus.replace("_", " ")} projects
                  </p>
                  <button
                    onClick={() => setFilterStatus("all")}
                    className="text-gv-primary-500 hover:text-gv-primary-400 text-sm"
                  >
                    View all projects
                  </button>
                </>
              ) : (
                <>
                  <Sparkles className="h-12 w-12 text-gv-neutral-600 mx-auto mb-4" />
                  <p className="text-gv-neutral-400 mb-4">
                    No projects yet. Start with Spark to create your first experience!
                  </p>
                  <Link
                    href="/spark"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv text-sm font-medium transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Start with Spark
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBriefs.map((brief) => (
                <div
                  key={brief.id}
                  className={`bg-gv-neutral-800/50 border border-gv-neutral-700 rounded-gv-lg p-5 hover:border-gv-neutral-600 transition-all relative group ${
                    brief.status === "archived" ? "opacity-60" : ""
                  }`}
                >
                  {/* Menu Button */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => setActiveMenu(activeMenu === brief.id ? null : brief.id)}
                      className="p-1.5 text-gv-neutral-500 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenu === brief.id && (
                      <div className="absolute right-0 top-8 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv shadow-lg z-10 py-1 min-w-[160px]">
                        <button
                          onClick={() => handleArchive(brief)}
                          className="w-full px-4 py-2 text-left text-sm text-gv-neutral-300 hover:bg-gv-neutral-700 flex items-center gap-2"
                        >
                          <Archive className="h-4 w-4" />
                          {brief.status === "archived" ? "Restore" : "Archive"}
                        </button>
                        <button
                          onClick={() => openDeleteModal(brief)}
                          className="w-full px-4 py-2 text-left text-sm text-gv-error hover:bg-gv-neutral-700 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`w-2 h-2 rounded-full ${STATUS_COLORS[brief.status] || STATUS_COLORS.draft}`}
                    />
                    <span className="text-xs text-gv-neutral-400 capitalize">
                      {brief.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-1 pr-8">
                    {brief.name || "Untitled Project"}
                  </h3>

                  {/* Tagline */}
                  {brief.tagline && (
                    <p className="text-gv-neutral-400 text-sm mb-3 line-clamp-2">
                      {brief.tagline}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-gv-neutral-500 mb-4">
                    {brief.experienceType && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {EXPERIENCE_TYPE_LABELS[brief.experienceType] || brief.experienceType}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(brief.updatedAt)}
                    </span>
                  </div>

                  {/* Completeness */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gv-neutral-400">Brief</span>
                      <span className="text-gv-neutral-300">{brief.completeness}%</span>
                    </div>
                    <div className="h-1.5 bg-gv-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gv-primary-500 transition-all"
                        style={{ width: `${brief.completeness}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/spark?brief=${brief.id}`}
                      className="flex-1 py-2 text-center text-sm font-medium text-gv-primary-500 hover:text-gv-primary-400 bg-gv-primary-500/10 hover:bg-gv-primary-500/20 rounded-gv transition-colors"
                    >
                      Continue with Spark
                    </Link>
                    {brief.completeness >= 50 && (
                      <Link
                        href={`/project/${brief.id}`}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gv-neutral-700 hover:bg-gv-neutral-600 rounded-gv transition-colors"
                      >
                        <Wrench className="h-4 w-4" />
                        Build
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, briefId: null, briefName: "" })}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteModal.briefName}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      {/* New Production Modal */}
      <NewProductionModal
        isOpen={showNewProductionModal}
        onClose={() => setShowNewProductionModal(false)}
        onSubmit={handleCreateProduction}
      />
    </div>
  );
}
