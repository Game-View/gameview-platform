import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-gv-neutral-300 bg-white px-3 py-2 text-sm',
          'placeholder:text-gv-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-gv-primary-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-gv-neutral-700 dark:bg-gv-neutral-900 dark:text-gv-neutral-100',
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
