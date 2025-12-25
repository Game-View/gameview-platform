"use client";

import { useState, useRef, useEffect } from "react";
import {
  Music,
  Volume2,
  VolumeX,
  Upload,
  Search,
  Play,
  Pause,
  Plus,
  Loader2,
  Mic,
  Radio,
  Wind,
  Sparkles,
} from "lucide-react";
import {
  type AudioAsset,
  type AudioCategory,
  audioCategoryLabels,
  formatDuration,
} from "@/lib/audio";

interface AudioLibraryProps {
  onSelectAudio: (audio: AudioAsset) => void;
  selectedAudioId?: string;
  onUploadClick?: () => void;
  className?: string;
}

// Category icons
const categoryIcons: Record<AudioCategory, React.ReactNode> = {
  ambient: <Wind className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  sfx: <Sparkles className="h-4 w-4" />,
  voice: <Mic className="h-4 w-4" />,
  directional: <Radio className="h-4 w-4" />,
};

export function AudioLibrary({
  onSelectAudio,
  selectedAudioId,
  onUploadClick,
  className = "",
}: AudioLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AudioCategory | "all">("all");
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch audio assets
  useEffect(() => {
    async function fetchAudio() {
      try {
        const res = await fetch("/api/audio");
        if (res.ok) {
          const data = await res.json();
          setAudioAssets(data);
        }
      } catch (error) {
        console.error("Failed to fetch audio:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAudio();
  }, []);

  // Filter audio
  const filteredAudio = audioAssets.filter((audio) => {
    const matchesSearch =
      searchQuery === "" ||
      audio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audio.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || audio.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedAudio = filteredAudio.reduce(
    (acc, audio) => {
      if (!acc[audio.category]) {
        acc[audio.category] = [];
      }
      acc[audio.category].push(audio);
      return acc;
    },
    {} as Record<AudioCategory, AudioAsset[]>
  );

  // Handle audio preview
  const handlePlayPause = (audio: AudioAsset) => {
    if (playingId === audio.id) {
      // Stop current audio
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.src = audio.url;
        audioRef.current.play();
        setPlayingId(audio.id);
      }
    }
  };

  // Handle audio end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setPlayingId(null);
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  const categories: (AudioCategory | "all")[] = ["all", "ambient", "music", "sfx", "voice"];

  return (
    <div className={`bg-gv-neutral-900 flex flex-col h-full ${className}`}>
      {/* Hidden audio element for preview */}
      <audio ref={audioRef} />

      {/* Header */}
      <div className="p-4 border-b border-gv-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-gv-primary-400" />
            Audio Library
          </h2>
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gv-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audio..."
            className="w-full pl-9 pr-4 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 text-sm focus:outline-none focus:ring-1 focus:ring-gv-primary-500"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 p-2 border-b border-gv-neutral-800 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-gv whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? "bg-gv-primary-500/20 text-gv-primary-400 border border-gv-primary-500/50"
                : "bg-gv-neutral-800/50 text-gv-neutral-400 border border-transparent hover:text-white"
            }`}
          >
            {category !== "all" && categoryIcons[category]}
            {category === "all" ? "All" : audioCategoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Audio List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-gv-primary-500 animate-spin" />
          </div>
        ) : filteredAudio.length === 0 ? (
          <div className="text-center py-12">
            <VolumeX className="h-12 w-12 mx-auto text-gv-neutral-600 mb-3" />
            <p className="text-gv-neutral-400 text-sm">No audio found</p>
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 text-sm bg-gv-neutral-800 hover:bg-gv-neutral-700 text-white rounded-gv transition-colors"
              >
                <Plus className="h-4 w-4" />
                Upload Audio
              </button>
            )}
          </div>
        ) : selectedCategory === "all" ? (
          // Grouped view
          <div className="space-y-4">
            {Object.entries(groupedAudio).map(([category, assets]) => (
              <div key={category}>
                <h3 className="text-xs font-medium text-gv-neutral-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                  {categoryIcons[category as AudioCategory]}
                  {audioCategoryLabels[category as AudioCategory]}
                  <span className="text-gv-neutral-500">({assets.length})</span>
                </h3>
                <div className="space-y-1">
                  {assets.map((audio) => (
                    <AudioItem
                      key={audio.id}
                      audio={audio}
                      isSelected={audio.id === selectedAudioId}
                      isPlaying={audio.id === playingId}
                      onSelect={() => onSelectAudio(audio)}
                      onPlayPause={() => handlePlayPause(audio)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat view
          <div className="space-y-1">
            {filteredAudio.map((audio) => (
              <AudioItem
                key={audio.id}
                audio={audio}
                isSelected={audio.id === selectedAudioId}
                isPlaying={audio.id === playingId}
                onSelect={() => onSelectAudio(audio)}
                onPlayPause={() => handlePlayPause(audio)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual audio item
interface AudioItemProps {
  audio: AudioAsset;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlayPause: () => void;
}

function AudioItem({ audio, isSelected, isPlaying, onSelect, onPlayPause }: AudioItemProps) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-gv cursor-pointer transition-colors ${
        isSelected
          ? "bg-gv-primary-500/20 border border-gv-primary-500/50"
          : "hover:bg-gv-neutral-800/50 border border-transparent"
      }`}
      onClick={onSelect}
    >
      {/* Play/Pause button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlayPause();
        }}
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          isPlaying
            ? "bg-gv-primary-500 text-white"
            : "bg-gv-neutral-700 text-gv-neutral-300 hover:bg-gv-neutral-600"
        }`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>

      {/* Audio info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{audio.name}</p>
        <div className="flex items-center gap-2 text-xs text-gv-neutral-400">
          <span>{formatDuration(audio.duration)}</span>
          {audio.tags.length > 0 && (
            <>
              <span>•</span>
              <span className="truncate">{audio.tags.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
      </div>

      {/* Category indicator */}
      <div className="flex-shrink-0 text-gv-neutral-500">
        {categoryIcons[audio.category]}
      </div>
    </div>
  );
}

// Audio upload modal component
interface AudioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (audio: AudioAsset) => void;
}

export function AudioUploadModal({ isOpen, onClose, onSuccess }: AudioUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AudioCategory>("sfx");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"];
    if (!validTypes.includes(selectedFile.type)) {
      alert("Please select a valid audio file (MP3, WAV, OGG, M4A)");
      return;
    }

    setFile(selectedFile);
    setName(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension

    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Get duration
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file || !name.trim()) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("category", category);
      formData.append("tags", tags);
      formData.append("duration", duration.toString());

      const res = await fetch("/api/audio/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const audio = await res.json();
      onSuccess(audio);
      handleClose();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload audio");
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up
  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setName("");
    setCategory("sfx");
    setTags("");
    setPreviewUrl(null);
    setDuration(0);
    onClose();
  };

  if (!isOpen) return null;

  const categories: AudioCategory[] = ["ambient", "music", "sfx", "voice", "directional"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gv-neutral-900 border border-gv-neutral-700 rounded-gv-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-gv-neutral-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-gv-primary-400" />
            Upload Audio
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File input */}
          {!file ? (
            <label className="block p-8 border-2 border-dashed border-gv-neutral-700 rounded-gv text-center cursor-pointer hover:border-gv-neutral-600 transition-colors">
              <Music className="h-12 w-12 mx-auto text-gv-neutral-500 mb-3" />
              <p className="text-white font-medium mb-1">Click to select audio file</p>
              <p className="text-sm text-gv-neutral-400">MP3, WAV, OGG, M4A (max 50MB)</p>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="p-4 bg-gv-neutral-800 rounded-gv">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gv-primary-500/20 rounded-gv flex items-center justify-center">
                  <Music className="h-5 w-5 text-gv-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gv-neutral-400">
                    {formatDuration(duration)} • {(file.size / (1024 * 1024)).toFixed(1)}MB
                  </p>
                </div>
              </div>

              {/* Audio preview */}
              {previewUrl && (
                <audio
                  ref={audioPreviewRef}
                  src={previewUrl}
                  controls
                  className="w-full h-10"
                />
              )}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm text-gv-neutral-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Audio name..."
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-gv-neutral-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AudioCategory)}
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {audioCategoryLabels[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-gv-neutral-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., nature, birds, outdoor"
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gv-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gv-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv disabled:opacity-50 transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
