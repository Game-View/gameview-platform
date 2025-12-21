import * as React from 'react';
import { cn } from '../lib/utils';
import { Upload } from 'lucide-react';

interface VideoDropZoneProps {
  onDrop?: (files: File[]) => void;
  onBrowse?: () => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

export function VideoDropZone({
  onDrop,
  onBrowse,
  accept = 'video/*',
  multiple = true,
  className,
  disabled = false,
}: VideoDropZoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('video/')
    );

    if (files.length > 0 && onDrop) {
      onDrop(files);
    }
  };

  return (
    <div
      className={cn(
        'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragOver
          ? 'border-gv-primary-500 bg-gv-primary-50 dark:bg-gv-primary-900/20'
          : 'border-gv-neutral-300 hover:border-gv-primary-400 hover:bg-gv-neutral-50',
        disabled && 'cursor-not-allowed opacity-50',
        'dark:border-gv-neutral-700 dark:hover:border-gv-primary-600',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!disabled ? onBrowse : undefined}
    >
      <Upload
        className={cn(
          'mb-4 h-12 w-12',
          isDragOver ? 'text-gv-primary-500' : 'text-gv-neutral-400'
        )}
      />
      <p className="mb-1 text-lg font-medium text-gv-neutral-700 dark:text-gv-neutral-300">
        {isDragOver ? 'Drop videos here' : 'Drag and drop videos'}
      </p>
      <p className="text-sm text-gv-neutral-500">
        or <span className="text-gv-primary-600 hover:underline">browse files</span>
      </p>
      <p className="mt-2 text-xs text-gv-neutral-400">
        Supports MP4, MOV, AVI, MKV {multiple && '• Multiple files allowed'}
      </p>
    </div>
  );
}
