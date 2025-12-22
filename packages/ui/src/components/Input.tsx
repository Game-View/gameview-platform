import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-gv border border-gv-neutral-600 bg-gv-neutral-800 px-3 py-2 text-sm text-gv-neutral-100',
          'placeholder:text-gv-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-gv-primary-500/50 focus:border-gv-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
