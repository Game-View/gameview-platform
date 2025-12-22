import * as React from 'react';
import { cn } from '../lib/utils';

interface RabbitLoaderProps {
  message?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

/**
 * Game View's mascot rabbit loading animation
 */
export function RabbitLoader({
  message = 'Loading...',
  progress,
  className,
  size = 'md',
}: RabbitLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      {/* Rabbit SVG */}
      <div className={cn('relative animate-hop', sizeClasses[size])}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Ears */}
          <ellipse cx="35" cy="20" rx="8" ry="20" fill="#f8fafc" />
          <ellipse cx="35" cy="20" rx="5" ry="15" fill="#fca5a5" />
          <ellipse cx="65" cy="20" rx="8" ry="20" fill="#f8fafc" />
          <ellipse cx="65" cy="20" rx="5" ry="15" fill="#fca5a5" />

          {/* Head */}
          <circle cx="50" cy="55" r="30" fill="#f8fafc" />

          {/* Eyes */}
          <circle cx="40" cy="50" r="5" fill="#0f172a" />
          <circle cx="60" cy="50" r="5" fill="#0f172a" />
          <circle cx="42" cy="48" r="2" fill="#ffffff" />
          <circle cx="62" cy="48" r="2" fill="#ffffff" />

          {/* Nose */}
          <ellipse cx="50" cy="60" rx="4" ry="3" fill="#fca5a5" />

          {/* Mouth */}
          <path
            d="M45 65 Q50 70 55 65"
            stroke="#0f172a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Whiskers */}
          <line x1="30" y1="58" x2="20" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="30" y1="62" x2="20" y2="62" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="30" y1="66" x2="20" y2="69" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="70" y1="58" x2="80" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="70" y1="62" x2="80" y2="62" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="70" y1="66" x2="80" y2="69" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Cheeks */}
          <circle cx="32" cy="62" r="5" fill="#fecaca" opacity="0.6" />
          <circle cx="68" cy="62" r="5" fill="#fecaca" opacity="0.6" />
        </svg>
      </div>

      {/* Message */}
      <p className="text-gv-neutral-100 text-sm font-medium">{message}</p>

      {/* Progress bar (optional) */}
      {progress !== undefined && (
        <div className="w-48 space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gv-neutral-700">
            <div
              className="h-full bg-gv-primary-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-gv-neutral-400">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
}
