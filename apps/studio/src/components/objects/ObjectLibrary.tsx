"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Star,
  Sofa,
  Box,
  MousePointer,
  Palette,
  Volume2,
  Sparkles,
  User,
  Car,
  TreePine,
  Grid3X3,
  Upload,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import type { StoredObject, ObjectCategory } from "@/lib/objects";

// Category icons mapping
const categoryIcons: Record<ObjectCategory | "all", React.ReactNode> = {
  all: <Grid3X3 className="h-4 w-4" />,
  collectibles: <Star className="h-4 w-4" />,
  furniture: <Sofa className="h-4 w-4" />,
  props: <Box className="h-4 w-4" />,
  interactive: <MousePointer className="h-4 w-4" />,
  decorations: <Palette className="h-4 w-4" />,
  audio: <Volume2 className="h-4 w-4" />,
  effects: <Sparkles className="h-4 w-4" />,
  characters: <User className="h-4 w-4" />,
  vehicles: <Car className="h-4 w-4" />,
  nature: <TreePine className="h-4 w-4" />,
};

// Category labels
const categoryLabels: Record<ObjectCategory | "all", string> = {
  all: "All Objects",
  collectibles: "Collectibles",
  furniture: "Furniture",
  props: "Props",
  interactive: "Interactive",
  decorations: "Decorations",
  audio: "Audio",
  effects: "Effects",
  characters: "Characters",
  vehicles: "Vehicles",
  nature: "Nature",
};

interface ObjectLibraryProps {
  onSelectObject?: (object: StoredObject) => void;
  onDragStart?: (object: StoredObject) => void;
  onUploadClick?: () => void;
  selectedObjectId?: string | null;
  className?: string;
}

export function ObjectLibrary({
  onSelectObject,
  onDragStart,
  onUploadClick,
  selectedObjectId,
  className = "",
}: ObjectLibraryProps) {
  const [objects, setObjects] = useState<StoredObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ObjectCategory | "all">("all");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Fetch objects on mount
  useEffect(() => {
    async function fetchObjects() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/objects");
        if (!res.ok) {
          throw new Error("Failed to fetch objects");
        }
        const data = await res.json();
        setObjects(data);
      } catch (err) {
        console.error("Failed to fetch objects:", err);
        setError("Failed to load objects");
      } finally {
        setIsLoading(false);
      }
    }

    fetchObjects();
  }, []);

  // Filter objects based on search and category
  const filteredObjects = useMemo(() => {
    return objects.filter((obj) => {
      // Category filter
      if (selectedCategory !== "all" && obj.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = obj.name.toLowerCase().includes(query);
        const matchesDescription = obj.description?.toLowerCase().includes(query);
        const matchesTags = obj.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [objects, selectedCategory, searchQuery]);

  // Group objects by category for display
  const groupedObjects = useMemo(() => {
    if (selectedCategory !== "all") {
      return { [selectedCategory]: filteredObjects };
    }

    const groups: Record<string, StoredObject[]> = {};
    for (const obj of filteredObjects) {
      if (!groups[obj.category]) {
        groups[obj.category] = [];
      }
      groups[obj.category].push(obj);
    }
    return groups;
  }, [filteredObjects, selectedCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: objects.length };
    for (const obj of objects) {
      counts[obj.category] = (counts[obj.category] || 0) + 1;
    }
    return counts;
  }, [objects]);

  const handleObjectClick = (object: StoredObject) => {
    onSelectObject?.(object);
  };

  const handleDragStart = (e: React.DragEvent, object: StoredObject) => {
    e.dataTransfer.setData("application/json", JSON.stringify(object));
    e.dataTransfer.effectAllowed = "copy";
    onDragStart?.(object);
  };

  return (
    <div className={`flex flex-col h-full bg-gv-neutral-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gv-neutral-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Object Library</h2>
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gv-neutral-400" />
          <input
            type="text"
            placeholder="Search objects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 focus:outline-none focus:ring-2 focus:ring-gv-primary-500 focus:border-transparent text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gv-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3 border-b border-gv-neutral-700">
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="flex items-center justify-between w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white text-sm hover:border-gv-neutral-600 transition-colors"
          >
            <span className="flex items-center gap-2">
              {categoryIcons[selectedCategory]}
              {categoryLabels[selectedCategory]}
              <span className="text-gv-neutral-500">({categoryCounts[selectedCategory] || 0})</span>
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showCategoryMenu ? "rotate-180" : ""}`} />
          </button>

          {showCategoryMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv shadow-lg z-10 max-h-64 overflow-y-auto">
              {(Object.keys(categoryLabels) as Array<ObjectCategory | "all">).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowCategoryMenu(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-gv-neutral-700 transition-colors ${
                    selectedCategory === cat ? "bg-gv-neutral-700 text-white" : "text-gv-neutral-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {categoryIcons[cat]}
                    {categoryLabels[cat]}
                  </span>
                  <span className="text-gv-neutral-500">{categoryCounts[cat] || 0}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Objects Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 text-gv-primary-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gv-neutral-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-gv-primary-500 text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className="text-center py-8">
            <Box className="h-12 w-12 mx-auto text-gv-neutral-600 mb-3" />
            <p className="text-gv-neutral-400 text-sm">
              {searchQuery ? "No objects match your search" : "No objects in this category"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedObjects).map(([category, categoryObjects]) => (
              <div key={category}>
                {selectedCategory === "all" && (
                  <h3 className="flex items-center gap-2 text-sm font-medium text-gv-neutral-400 mb-3">
                    {categoryIcons[category as ObjectCategory]}
                    {categoryLabels[category as ObjectCategory]}
                    <span className="text-gv-neutral-600">({categoryObjects.length})</span>
                  </h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categoryObjects.map((object) => (
                    <ObjectCard
                      key={object.id}
                      object={object}
                      isSelected={selectedObjectId === object.id}
                      onClick={() => handleObjectClick(object)}
                      onDragStart={(e) => handleDragStart(e, object)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="px-4 py-2 border-t border-gv-neutral-700 text-xs text-gv-neutral-500">
        {filteredObjects.length} object{filteredObjects.length !== 1 ? "s" : ""} available
      </div>
    </div>
  );
}

// Object card component
interface ObjectCardProps {
  object: StoredObject;
  isSelected?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

function ObjectCard({ object, isSelected, onClick, onDragStart }: ObjectCardProps) {
  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      className={`group relative aspect-square bg-gv-neutral-800 rounded-gv border-2 cursor-pointer transition-all overflow-hidden ${
        isSelected
          ? "border-gv-primary-500 ring-2 ring-gv-primary-500/30"
          : "border-transparent hover:border-gv-neutral-600"
      }`}
    >
      {/* Thumbnail */}
      {object.thumbnailUrl ? (
        <img
          src={object.thumbnailUrl}
          alt={object.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gv-neutral-700 to-gv-neutral-800">
          {categoryIcons[object.category] || <Box className="h-8 w-8 text-gv-neutral-500" />}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
        <div className="w-full">
          <p className="text-white text-xs font-medium truncate">{object.name}</p>
          {object.interactionType && (
            <p className="text-gv-primary-400 text-[10px] mt-0.5 capitalize">
              {object.interactionType}
            </p>
          )}
        </div>
      </div>

      {/* Category badge */}
      <div className="absolute top-1.5 right-1.5 p-1 bg-black/50 rounded text-gv-neutral-300">
        {categoryIcons[object.category]}
      </div>

      {/* Drag indicator */}
      <div className="absolute inset-0 border-2 border-dashed border-gv-primary-500 opacity-0 group-active:opacity-100 pointer-events-none" />
    </div>
  );
}
