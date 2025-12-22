import { cn } from '../lib/utils';
import { Button } from './Button';
import { X, ChevronUp, ChevronDown, Play } from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  imageUrl?: string;
}

interface TutorialModalProps {
  steps: TutorialStep[];
  currentStep: number;
  totalSteps: number;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onClose?: () => void;
  onComplete?: () => void;
  className?: string;
}

/**
 * Floating tutorial modal for onboarding
 * Displays step-by-step guidance with video/image content
 */
export function TutorialModal({
  steps,
  currentStep,
  totalSteps,
  isExpanded = true,
  onExpandToggle,
  onClose,
  onComplete: _onComplete,
  className,
}: TutorialModalProps) {
  // onComplete available for future use when tutorial finishes
  void _onComplete;
  const step = steps[currentStep - 1];

  if (!step) return null;

  return (
    <div
      className={cn(
        'fixed left-4 bottom-4 z-50 w-80 rounded-gv-lg bg-gv-neutral-800/95 backdrop-blur-sm border border-gv-neutral-700 shadow-gv-lg overflow-hidden',
        'animate-slide-up',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gv-neutral-700">
        <button
          onClick={onExpandToggle}
          className="flex items-center gap-2 text-sm text-gv-neutral-300 hover:text-gv-neutral-100 transition-colors"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gv-neutral-700 text-xs">
            {currentStep}
          </span>
          <span>
            Video Tutorial Part {currentStep}/{totalSteps}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gv-neutral-400 hover:text-gv-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gv-neutral-100">{step.title}</h3>

          {/* Description */}
          <p className="text-sm text-gv-neutral-400">{step.description}</p>

          {/* Video/Image preview */}
          {(step.videoUrl || step.imageUrl) && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gv-neutral-900">
              {step.imageUrl && (
                <img
                  src={step.imageUrl}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              )}
              {step.videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors">
                    <Play className="w-5 h-5 text-gv-neutral-900 ml-1" fill="currentColor" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center gap-1 pt-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i < currentStep ? 'bg-gv-primary-500' : 'bg-gv-neutral-700'
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Full-screen tutorial overlay with blur backdrop
 */
interface TutorialOverlayProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  highlightSelector?: string;
}

export function TutorialOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}: TutorialOverlayProps) {
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gv-neutral-900/80 backdrop-blur-sm" />

      {/* Content card */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <div className="bg-gv-neutral-800 rounded-gv-xl border border-gv-neutral-700 shadow-gv-lg overflow-hidden">
          {/* Video/Image */}
          {(step.videoUrl || step.imageUrl) && (
            <div className="aspect-video bg-gv-neutral-900">
              {step.imageUrl && (
                <img
                  src={step.imageUrl}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}

          {/* Text content */}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-gv-neutral-400 mb-1">
                Step {currentStep} of {totalSteps}
              </p>
              <h2 className="text-xl font-semibold text-gv-neutral-100">{step.title}</h2>
            </div>
            <p className="text-gv-neutral-300">{step.description}</p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip tutorial
              </Button>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" size="sm" onClick={onPrevious}>
                    Previous
                  </Button>
                )}
                <Button size="sm" onClick={onNext}>
                  {currentStep === totalSteps ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
