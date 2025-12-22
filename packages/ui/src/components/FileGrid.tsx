import * as React from 'react';
import { cn } from '../lib/utils';
import { Upload, X, File, Image, Film, Check } from 'lucide-react';
import { Progress } from './Progress';

export interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file';
  thumbnailUrl?: string;
  progress?: number; // 0-100, undefined means completed
  selected?: boolean;
}

interface FileGridProps {
  files: FileItem[];
  onSelect?: (id: string) => void;
  onRemove?: (id: string) => void;
  selectable?: boolean;
  className?: string;
}

/**
 * Grid display for uploaded files with thumbnails and progress
 */
export function FileGrid({
  files,
  onSelect,
  onRemove,
  selectable = false,
  className,
}: FileGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3',
        className
      )}
    >
      {files.map((file) => (
        <FileGridItem
          key={file.id}
          file={file}
          onSelect={onSelect}
          onRemove={onRemove}
          selectable={selectable}
        />
      ))}
    </div>
  );
}

interface FileGridItemProps {
  file: FileItem;
  onSelect?: (id: string) => void;
  onRemove?: (id: string) => void;
  selectable?: boolean;
}

function FileGridItem({ file, onSelect, onRemove, selectable }: FileGridItemProps) {
  const isUploading = file.progress !== undefined && file.progress < 100;

  const IconComponent = {
    image: Image,
    video: Film,
    file: File,
  }[file.type];

  return (
    <div
      className={cn(
        'group relative aspect-square rounded-gv overflow-hidden border-2 transition-all',
        file.selected
          ? 'border-gv-primary-500 ring-2 ring-gv-primary-500/30'
          : 'border-gv-neutral-700 hover:border-gv-neutral-600',
        selectable && 'cursor-pointer'
      )}
      onClick={() => selectable && onSelect?.(file.id)}
    >
      {/* Thumbnail or placeholder */}
      <div className="absolute inset-0 bg-gv-neutral-800">
        {file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <IconComponent className="w-10 h-10 text-gv-neutral-600" />
          </div>
        )}
      </div>

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-gv-neutral-900/80 flex flex-col items-center justify-center p-3">
          <Progress value={file.progress} className="w-full mb-2" />
          <span className="text-xs text-gv-neutral-300">{file.progress}%</span>
        </div>
      )}

      {/* Selection checkbox */}
      {selectable && !isUploading && (
        <div
          className={cn(
            'absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
            file.selected
              ? 'bg-gv-primary-500 border-gv-primary-500'
              : 'border-gv-neutral-500 bg-gv-neutral-900/50 group-hover:border-gv-neutral-400'
          )}
        >
          {file.selected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      {/* Remove button */}
      {onRemove && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file.id);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gv-neutral-900/70 text-gv-neutral-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gv-neutral-900 hover:text-gv-neutral-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Filename */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-gv-neutral-900/90 to-transparent">
        <p className="text-xs text-gv-neutral-200 truncate">{file.name}</p>
      </div>
    </div>
  );
}

interface FileUploadAreaProps {
  onUpload?: (files: FileList) => void;
  accept?: string;
  maxSize?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Drag and drop file upload area
 */
export function FileUploadArea({
  onUpload,
  accept = '*',
  maxSize = '5GB',
  disabled = false,
  className,
}: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      onUpload?.(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload?.(e.target.files);
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center min-h-[200px] rounded-gv border-2 border-dashed transition-all cursor-pointer',
        isDragOver
          ? 'border-gv-primary-500 bg-gv-primary-500/10'
          : 'border-gv-neutral-600 hover:border-gv-neutral-500 bg-gv-neutral-800/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple
        onChange={handleFileChange}
        disabled={disabled}
      />

      <Upload
        className={cn(
          'w-10 h-10 mb-3',
          isDragOver ? 'text-gv-primary-400' : 'text-gv-neutral-500'
        )}
      />

      <p className="text-sm text-gv-neutral-300">
        Drag your files or{' '}
        <span className="text-gv-primary-400 hover:text-gv-primary-300">browse</span>
      </p>

      <p className="text-xs text-gv-neutral-500 mt-1">
        A maximum of {maxSize} are allowed
      </p>
    </div>
  );
}
