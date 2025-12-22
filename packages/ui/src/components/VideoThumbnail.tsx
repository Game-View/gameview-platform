import { cn, formatDuration } from '../lib/utils';
import { Play, Film, X } from 'lucide-react';

export interface VideoThumbnailProps {
  name: string;
  duration?: number;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  fps?: number;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  onPlay?: () => void;
  className?: string;
}

export function VideoThumbnail({
  name,
  duration,
  thumbnailUrl,
  width,
  height,
  fps,
  selected = false,
  onSelect,
  onRemove,
  onPlay,
  className,
}: VideoThumbnailProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border transition-all',
        selected
          ? 'border-gv-primary-500 ring-2 ring-gv-primary-500/20'
          : 'border-gv-neutral-200 hover:border-gv-neutral-300 dark:border-gv-neutral-700',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={onSelect}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-video bg-gv-neutral-100 dark:bg-gv-neutral-800">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Film className="h-12 w-12 text-gv-neutral-400" />
          </div>
        )}

        {/* Play button overlay */}
        {onPlay && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-6 w-6 text-gv-neutral-900" fill="currentColor" />
            </div>
          </button>
        )}

        {/* Duration badge */}
        {duration !== undefined && (
          <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(duration)}
          </div>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Info area */}
      <div className="p-3">
        <p className="truncate text-sm font-medium text-gv-neutral-900 dark:text-gv-neutral-100">
          {name}
        </p>
        {(width || height || fps) && (
          <p className="mt-1 text-xs text-gv-neutral-500">
            {width && height && `${width}×${height}`}
            {fps && ` • ${fps}fps`}
          </p>
        )}
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gv-primary-500 text-white">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
