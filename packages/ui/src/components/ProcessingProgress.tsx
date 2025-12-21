import * as React from 'react';
import type { ProcessingStage, ProcessingProgress as ProgressType } from '@gameview/types';
import { Progress } from './Progress';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { cn } from '../lib/utils';

const stageLabels: Record<ProcessingStage, string> = {
  idle: 'Ready',
  extracting_frames: 'Extracting Frames',
  running_colmap: 'Running COLMAP',
  running_brush: 'Training 3D Gaussian Splat',
  exporting: 'Exporting',
  completed: 'Completed',
  failed: 'Failed',
};

const stageIcons: Record<ProcessingStage, string> = {
  idle: '⏸️',
  extracting_frames: '🎬',
  running_colmap: '📐',
  running_brush: '🎨',
  exporting: '📦',
  completed: '✅',
  failed: '❌',
};

interface ProcessingProgressProps {
  progress: ProgressType;
  className?: string;
}

export function ProcessingProgress({ progress, className }: ProcessingProgressProps) {
  const { stage, progress: percent, message, currentStep, totalSteps } = progress;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>{stageIcons[stage]}</span>
          <span>{stageLabels[stage]}</span>
          {totalSteps && currentStep && (
            <span className="text-sm font-normal text-gv-neutral-500">
              (Step {currentStep}/{totalSteps})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={percent} className="h-3" />
          <div className="flex justify-between text-sm text-gv-neutral-500">
            <span>{message || 'Processing...'}</span>
            <span>{Math.round(percent)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
