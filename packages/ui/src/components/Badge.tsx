import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gv-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gv-primary-500 text-white',
        secondary: 'border-transparent bg-gv-neutral-200 text-gv-neutral-900 dark:bg-gv-neutral-700 dark:text-gv-neutral-100',
        destructive: 'border-transparent bg-red-500 text-white',
        success: 'border-transparent bg-gv-accent-500 text-white',
        outline: 'text-gv-neutral-900 dark:text-gv-neutral-100',
        warning: 'border-transparent bg-yellow-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
