"use client";

import { useState } from "react";
import {
  X,
  Sparkles,
  Users,
  MapPin,
  Clock,
  Target,
  Gamepad2,
  Camera,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  Check,
  Pencil,
  Eye,
} from "lucide-react";
import type { ExtractedBrief } from "@/app/api/brief/extract/route";
import { EditableText, EditableSelect, EditableTags } from "./EditableField";

interface BriefPanelProps {
  brief: ExtractedBrief | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onSave?: () => void;
  onBriefUpdate?: (updates: Partial<ExtractedBrief>) => void;
  isSaving?: boolean;
  isSaved?: boolean;
  savedBriefId?: string | null;
}

const EXPERIENCE_TYPE_OPTIONS = [
  { value: "treasure_hunt", label: "Treasure Hunt" },
  { value: "virtual_tour", label: "Virtual Tour" },
  { value: "interactive_story", label: "Interactive Story" },
  { value: "competition", label: "Competition" },
  { value: "brand_experience", label: "Brand Experience" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "progressive", label: "Progressive" },
];

const PLAYER_MODE_OPTIONS = [
  { value: "single", label: "Single Player" },
  { value: "multiplayer", label: "Multiplayer" },
  { value: "competitive", label: "Competitive" },
];

const CONTENT_STATUS_OPTIONS = [
  { value: "has_content", label: "Has existing footage" },
  { value: "needs_capture", label: "Needs to capture footage" },
  { value: "needs_guidance", label: "Needs capture guidance" },
];

export function BriefPanel({
  brief,
  isLoading,
  error,
  onClose,
  onRefresh,
  onSave,
  onBriefUpdate,
  isSaving,
  isSaved,
  savedBriefId,
}: BriefPanelProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  const handleFieldUpdate = (field: keyof ExtractedBrief, value: unknown) => {
    if (onBriefUpdate) {
      onBriefUpdate({ [field]: value });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gv-neutral-900 border-l border-gv-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gv-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gv-primary-500" />
          <h2 className="font-semibold text-white">Project Brief</h2>
          {savedBriefId && (
            <span className="px-2 py-0.5 bg-gv-success/10 text-gv-success text-xs rounded-full">
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {brief && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-2 transition-colors ${
                isEditMode
                  ? "text-gv-primary-500 bg-gv-primary-500/10"
                  : "text-gv-neutral-400 hover:text-white"
              }`}
              title={isEditMode ? "View mode" : "Edit mode"}
            >
              {isEditMode ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gv-neutral-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh brief"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gv-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && brief && (
        <div className="px-4 py-2 bg-gv-primary-500/10 border-b border-gv-primary-500/20">
          <p className="text-xs text-gv-primary-400">
            Click on any field to edit. Changes auto-save.
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && !brief && (
          <div className="flex flex-col items-center justify-center py-12 text-gv-neutral-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">Analyzing conversation...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-gv-error/10 border border-gv-error/30 rounded-gv text-gv-error text-sm">
            {error}
          </div>
        )}

        {brief && (
          <div className="space-y-6">
            {/* Completeness Indicator */}
            <div className="bg-gv-neutral-800/50 rounded-gv p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gv-neutral-400">Brief Completeness</span>
                <span className="text-sm font-medium text-white">{brief.completeness}%</span>
              </div>
              <div className="h-2 bg-gv-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gv-primary-500 transition-all duration-500"
                  style={{ width: `${brief.completeness}%` }}
                />
              </div>
            </div>

            {/* Project Name & Tagline */}
            <div>
              <EditableText
                value={brief.name}
                placeholder="Project name..."
                onSave={(value) => handleFieldUpdate("name", value)}
                isEditing={isEditMode}
                className="text-xl font-bold text-white mb-1 block"
              />
              <EditableText
                value={brief.tagline}
                placeholder="Add a catchy tagline..."
                onSave={(value) => handleFieldUpdate("tagline", value)}
                isEditing={isEditMode}
                className="text-gv-neutral-400 text-sm italic block"
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                  <Gamepad2 className="h-4 w-4" />
                  <span className="text-xs">Type</span>
                </div>
                <EditableSelect
                  value={brief.experienceType}
                  options={EXPERIENCE_TYPE_OPTIONS}
                  placeholder="Select type"
                  onSave={(value) => handleFieldUpdate("experienceType", value)}
                  isEditing={isEditMode}
                  className="text-sm text-white"
                />
              </div>

              <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Audience</span>
                </div>
                <EditableText
                  value={brief.targetAudience}
                  placeholder="Target audience"
                  onSave={(value) => handleFieldUpdate("targetAudience", value)}
                  isEditing={isEditMode}
                  className="text-sm text-white"
                />
              </div>

              <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Duration</span>
                </div>
                <EditableText
                  value={brief.duration}
                  placeholder="e.g., 30 mins"
                  onSave={(value) => handleFieldUpdate("duration", value)}
                  isEditing={isEditMode}
                  className="text-sm text-white"
                />
              </div>

              <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs">Difficulty</span>
                </div>
                <EditableSelect
                  value={brief.difficulty}
                  options={DIFFICULTY_OPTIONS}
                  placeholder="Select difficulty"
                  onSave={(value) => handleFieldUpdate("difficulty", value)}
                  isEditing={isEditMode}
                  className="text-sm text-white"
                />
              </div>

              <div className="bg-gv-neutral-800/50 rounded-gv p-3 col-span-2">
                <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Player Mode</span>
                </div>
                <EditableSelect
                  value={brief.playerMode}
                  options={PLAYER_MODE_OPTIONS}
                  placeholder="Select mode"
                  onSave={(value) => handleFieldUpdate("playerMode", value)}
                  isEditing={isEditMode}
                  className="text-sm text-white"
                />
              </div>
            </div>

            {/* Concept */}
            <Section title="Concept">
              <EditableText
                value={brief.concept}
                placeholder="Describe the core concept..."
                onSave={(value) => handleFieldUpdate("concept", value)}
                isEditing={isEditMode}
                multiline
                className="text-sm text-gv-neutral-300"
              />
            </Section>

            {/* Setting */}
            <Section title="Setting" icon={<MapPin className="h-4 w-4" />}>
              <EditableText
                value={brief.setting}
                placeholder="Where does this take place?"
                onSave={(value) => handleFieldUpdate("setting", value)}
                isEditing={isEditMode}
                multiline
                className="text-sm text-gv-neutral-300"
              />
            </Section>

            {/* Narrative */}
            <Section title="Story/Theme">
              <EditableText
                value={brief.narrative}
                placeholder="What's the story or theme?"
                onSave={(value) => handleFieldUpdate("narrative", value)}
                isEditing={isEditMode}
                multiline
                className="text-sm text-gv-neutral-300"
              />
            </Section>

            {/* Interactive Elements */}
            <Section title="Interactive Elements">
              <EditableTags
                values={brief.interactiveElements}
                placeholder="No elements added"
                onSave={(values) => handleFieldUpdate("interactiveElements", values)}
                isEditing={isEditMode}
              />
            </Section>

            {/* Content Status */}
            <Section title="360° Content" icon={<Camera className="h-4 w-4" />}>
              <div className="space-y-2">
                {!isEditMode ? (
                  brief.contentStatus && (
                    <div className="flex items-center gap-2">
                      {brief.contentStatus === "has_content" ? (
                        <CheckCircle2 className="h-4 w-4 text-gv-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gv-warning-500" />
                      )}
                      <span className="text-sm text-gv-neutral-300">
                        {CONTENT_STATUS_OPTIONS.find((o) => o.value === brief.contentStatus)?.label}
                      </span>
                    </div>
                  )
                ) : (
                  <EditableSelect
                    value={brief.contentStatus}
                    options={CONTENT_STATUS_OPTIONS}
                    placeholder="Content status"
                    onSave={(value) => handleFieldUpdate("contentStatus", value)}
                    isEditing={isEditMode}
                    className="text-sm text-gv-neutral-300"
                  />
                )}
                <EditableText
                  value={brief.contentDescription}
                  placeholder="Describe your content..."
                  onSave={(value) => handleFieldUpdate("contentDescription", value)}
                  isEditing={isEditMode}
                  multiline
                  className="text-sm text-gv-neutral-400"
                />
              </div>
            </Section>

            {/* Missing Elements - Not editable, AI-generated */}
            {brief.missingElements.length > 0 && !isEditMode && (
              <Section title="Still Needed" variant="warning">
                <ul className="space-y-1">
                  {brief.missingElements.map((element, index) => (
                    <li
                      key={index}
                      className="text-sm text-gv-neutral-400 flex items-start gap-2"
                    >
                      <span className="text-gv-warning-500 mt-1">•</span>
                      {element}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Suggested Questions - Not editable, AI-generated */}
            {brief.suggestedNextQuestions.length > 0 && brief.completeness < 100 && !isEditMode && (
              <Section title="Suggested Next Questions" variant="info">
                <ul className="space-y-2">
                  {brief.suggestedNextQuestions.map((question, index) => (
                    <li
                      key={index}
                      className="text-sm text-gv-neutral-300 bg-gv-neutral-800/50 rounded-gv p-2"
                    >
                      {question}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {brief && (
        <div className="p-4 border-t border-gv-neutral-800 space-y-3">
          {/* Save Button */}
          {onSave && !savedBriefId && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="w-full py-3 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-gv font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <Check className="h-4 w-4 text-gv-success" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Brief
                </>
              )}
            </button>
          )}

          {/* Build Experience CTA */}
          {brief.completeness >= 80 && (
            <button className="w-full py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv font-medium transition-colors">
              Start Building Experience
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  variant?: "default" | "warning" | "info";
  children: React.ReactNode;
}

function Section({ title, icon, variant = "default", children }: SectionProps) {
  const borderColor = {
    default: "border-gv-neutral-700",
    warning: "border-gv-warning-500/30",
    info: "border-gv-info/30",
  }[variant];

  return (
    <div className={`border-l-2 ${borderColor} pl-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-gv-neutral-400">{icon}</span>}
        <h4 className="text-sm font-medium text-gv-neutral-300">{title}</h4>
      </div>
      {children}
    </div>
  );
}
