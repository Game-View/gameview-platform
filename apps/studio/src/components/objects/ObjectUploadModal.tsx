"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  FileBox,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import type { ObjectCategory, InteractionType, CreateObjectInput } from "@/lib/objects";

const categories: { value: ObjectCategory; label: string }[] = [
  { value: "collectibles", label: "Collectibles" },
  { value: "furniture", label: "Furniture" },
  { value: "props", label: "Props" },
  { value: "interactive", label: "Interactive" },
  { value: "decorations", label: "Decorations" },
  { value: "audio", label: "Audio" },
  { value: "effects", label: "Effects" },
  { value: "characters", label: "Characters" },
  { value: "vehicles", label: "Vehicles" },
  { value: "nature", label: "Nature" },
];

const interactionTypes: { value: InteractionType; label: string }[] = [
  { value: "none", label: "None (Static)" },
  { value: "collectible", label: "Collectible" },
  { value: "trigger", label: "Trigger Zone" },
  { value: "physics", label: "Physics Object" },
  { value: "animation", label: "Animated" },
  { value: "audio", label: "Audio Source" },
  { value: "teleport", label: "Teleport" },
  { value: "door", label: "Door" },
  { value: "switch", label: "Switch" },
  { value: "pickup", label: "Pickup" },
  { value: "checkpoint", label: "Checkpoint" },
  { value: "spawn", label: "Spawn Point" },
];

interface ObjectUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ObjectUploadModal({ isOpen, onClose, onSuccess }: ObjectUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "props" as ObjectCategory,
    interactionType: "none" as InteractionType,
    tags: "",
    isPublic: false,
  });

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleModelSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [".glb", ".gltf", ".obj", ".fbx"];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!validTypes.includes(ext)) {
        setError(`Invalid file type. Supported formats: ${validTypes.join(", ")}`);
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("File too large. Maximum size is 50MB.");
        return;
      }

      setModelFile(file);
      setError(null);

      // Auto-fill name from filename if empty
      if (!formData.name) {
        const name = file.name.slice(0, file.name.lastIndexOf(".")).replace(/[-_]/g, " ");
        setFormData((prev) => ({ ...prev, name: name.charAt(0).toUpperCase() + name.slice(1) }));
      }
    }
  }, [formData.name]);

  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Thumbnail must be an image file.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Thumbnail too large. Maximum size is 5MB.");
        return;
      }

      setThumbnailFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelFile) {
      setError("Please select a 3D model file.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter a name for the object.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Step 1: Upload model file to storage (simulated for now)
      setUploadProgress(20);

      // In production, you would upload to Supabase Storage or similar
      // For now, we'll create a placeholder URL
      const modelUrl = `/uploads/objects/${crypto.randomUUID()}/${modelFile.name}`;

      setUploadProgress(50);

      // Step 2: Upload thumbnail if provided
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        thumbnailUrl = `/uploads/objects/thumbnails/${crypto.randomUUID()}/${thumbnailFile.name}`;
      }

      setUploadProgress(70);

      // Step 3: Create object in database
      const objectData: CreateObjectInput = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        modelUrl,
        thumbnailUrl,
        interactionType: formData.interactionType === "none" ? undefined : formData.interactionType,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        isPublic: formData.isPublic,
      };

      const response = await fetch("/api/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(objectData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create object");
      }

      setUploadProgress(100);
      setSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;

    setFormData({
      name: "",
      description: "",
      category: "props",
      interactionType: "none",
      tags: "",
      isPublic: false,
    });
    setModelFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-gv-neutral-900 border border-gv-neutral-700 rounded-gv-lg w-full max-w-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gv-neutral-700">
          <h2 className="text-lg font-semibold text-white">Upload 3D Object</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-1 text-gv-neutral-400 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Model File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gv-neutral-300 mb-2">
              3D Model File *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.obj,.fbx"
              onChange={handleModelSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full p-6 border-2 border-dashed rounded-gv transition-colors ${
                modelFile
                  ? "border-gv-primary-500 bg-gv-primary-500/10"
                  : "border-gv-neutral-600 hover:border-gv-neutral-500"
              }`}
            >
              {modelFile ? (
                <div className="flex items-center gap-3">
                  <FileBox className="h-8 w-8 text-gv-primary-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{modelFile.name}</p>
                    <p className="text-sm text-gv-neutral-400">
                      {(modelFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-gv-neutral-500 mb-2" />
                  <p className="text-gv-neutral-300">Click to select a 3D model</p>
                  <p className="text-sm text-gv-neutral-500 mt-1">
                    Supports GLB, GLTF, OBJ, FBX (max 50MB)
                  </p>
                </div>
              )}
            </button>
          </div>

          {/* Thumbnail Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gv-neutral-300 mb-2">
              Thumbnail Image (optional)
            </label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              className="hidden"
            />
            <div className="flex gap-3">
              {thumbnailPreview && (
                <div className="w-20 h-20 rounded-gv overflow-hidden bg-gv-neutral-800 flex-shrink-0">
                  <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="flex-1 p-4 border-2 border-dashed border-gv-neutral-600 hover:border-gv-neutral-500 rounded-gv transition-colors"
              >
                <ImageIcon className="h-5 w-5 mx-auto text-gv-neutral-500 mb-1" />
                <p className="text-sm text-gv-neutral-400">
                  {thumbnailFile ? "Change image" : "Add thumbnail"}
                </p>
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gv-neutral-300 mb-2">
              Object Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter object name"
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 focus:outline-none focus:ring-2 focus:ring-gv-primary-500"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gv-neutral-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this object..."
              rows={2}
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 focus:outline-none focus:ring-2 focus:ring-gv-primary-500 resize-none"
            />
          </div>

          {/* Category & Interaction Type */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gv-neutral-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value as ObjectCategory }))
                }
                className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white focus:outline-none focus:ring-2 focus:ring-gv-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gv-neutral-300 mb-2">
                Interaction
              </label>
              <select
                value={formData.interactionType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    interactionType: e.target.value as InteractionType,
                  }))
                }
                className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white focus:outline-none focus:ring-2 focus:ring-gv-primary-500"
              >
                {interactionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gv-neutral-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., wooden, medieval, prop"
              className="w-full px-3 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv text-white placeholder:text-gv-neutral-500 focus:outline-none focus:ring-2 focus:ring-gv-primary-500"
            />
          </div>

          {/* Public checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                className="w-4 h-4 rounded border-gv-neutral-600 bg-gv-neutral-800 text-gv-primary-500 focus:ring-gv-primary-500"
              />
              <span className="text-sm text-gv-neutral-300">
                Make this object public (visible to all users)
              </span>
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-gv flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-gv flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-400">Object uploaded successfully!</p>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gv-neutral-400 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gv-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gv-primary-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gv-neutral-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-gv-neutral-300 hover:text-white disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || !modelFile || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 disabled:bg-gv-neutral-700 disabled:text-gv-neutral-500 text-white rounded-gv transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Object
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
