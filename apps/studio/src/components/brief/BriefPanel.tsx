"use client";

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
} from "lucide-react";
import type { ExtractedBrief } from "@/app/api/brief/extract/route";

interface BriefPanelProps {
  brief: ExtractedBrief | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  savedBriefId?: string | null;
}

const EXPERIENCE_TYPE_LABELS: Record<string, string> = {
  treasure_hunt: "Treasure Hunt",
  virtual_tour: "Virtual Tour",
  interactive_story: "Interactive Story",
  competition: "Competition",
  brand_experience: "Brand Experience",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  progressive: "Progressive",
};

const PLAYER_MODE_LABELS: Record<string, string> = {
  single: "Single Player",
  multiplayer: "Multiplayer",
  competitive: "Competitive",
};

export function BriefPanel({
  brief,
  isLoading,
  error,
  onClose,
  onRefresh,
  onSave,
  isSaving,
  isSaved,
  savedBriefId,
}: BriefPanelProps) {
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
            {(brief.name || brief.tagline) && (
              <div>
                {brief.name && (
                  <h3 className="text-xl font-bold text-white mb-1">{brief.name}</h3>
                )}
                {brief.tagline && (
                  <p className="text-gv-neutral-400 text-sm italic">{brief.tagline}</p>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              {brief.experienceType && (
                <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                  <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                    <Gamepad2 className="h-4 w-4" />
                    <span className="text-xs">Type</span>
                  </div>
                  <p className="text-sm text-white">
                    {EXPERIENCE_TYPE_LABELS[brief.experienceType] || brief.experienceType}
                  </p>
                </div>
              )}

              {brief.targetAudience && (
                <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                  <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Audience</span>
                  </div>
                  <p className="text-sm text-white truncate">{brief.targetAudience}</p>
                </div>
              )}

              {brief.duration && (
                <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                  <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Duration</span>
                  </div>
                  <p className="text-sm text-white">{brief.duration}</p>
                </div>
              )}

              {brief.difficulty && (
                <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                  <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-xs">Difficulty</span>
                  </div>
                  <p className="text-sm text-white">
                    {DIFFICULTY_LABELS[brief.difficulty] || brief.difficulty}
                  </p>
                </div>
              )}

              {brief.playerMode && (
                <div className="bg-gv-neutral-800/50 rounded-gv p-3">
                  <div className="flex items-center gap-2 text-gv-neutral-400 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Player Mode</span>
                  </div>
                  <p className="text-sm text-white">
                    {PLAYER_MODE_LABELS[brief.playerMode] || brief.playerMode}
                  </p>
                </div>
              )}
            </div>

            {/* Concept */}
            {brief.concept && (
              <Section title="Concept">
                <p className="text-sm text-gv-neutral-300">{brief.concept}</p>
              </Section>
            )}

            {/* Setting */}
            {brief.setting && (
              <Section title="Setting" icon={<MapPin className="h-4 w-4" />}>
                <p className="text-sm text-gv-neutral-300">{brief.setting}</p>
              </Section>
            )}

            {/* Narrative */}
            {brief.narrative && (
              <Section title="Story/Theme">
                <p className="text-sm text-gv-neutral-300">{brief.narrative}</p>
              </Section>
            )}

            {/* Interactive Elements */}
            {brief.interactiveElements.length > 0 && (
              <Section title="Interactive Elements">
                <div className="flex flex-wrap gap-2">
                  {brief.interactiveElements.map((element, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gv-primary-500/10 border border-gv-primary-500/30 rounded text-xs text-gv-primary-400"
                    >
                      {element}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Content Status */}
            {brief.contentStatus && (
              <Section title="360° Content" icon={<Camera className="h-4 w-4" />}>
                <div className="flex items-center gap-2 mb-2">
                  {brief.contentStatus === "has_content" ? (
                    <CheckCircle2 className="h-4 w-4 text-gv-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gv-warning-500" />
                  )}
                  <span className="text-sm text-gv-neutral-300">
                    {brief.contentStatus === "has_content" && "Has existing footage"}
                    {brief.contentStatus === "needs_capture" && "Needs to capture footage"}
                    {brief.contentStatus === "needs_guidance" && "Needs capture guidance"}
                  </span>
                </div>
                {brief.contentDescription && (
                  <p className="text-sm text-gv-neutral-400">{brief.contentDescription}</p>
                )}
              </Section>
            )}

            {/* Missing Elements */}
            {brief.missingElements.length > 0 && (
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

            {/* Suggested Questions */}
            {brief.suggestedNextQuestions.length > 0 && brief.completeness < 100 && (
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
