import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-gv text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gv-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gv-neutral-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Coral primary button
        default: 'bg-gv-primary-500 text-white hover:bg-gv-primary-600 shadow-gv hover:shadow-gv-glow',
        // Destructive/danger
        destructive: 'bg-gv-error text-white hover:bg-gv-error-dark',
        // Outlined button for dark bg
        outline: 'border border-gv-neutral-600 bg-transparent text-gv-neutral-100 hover:bg-gv-neutral-800 hover:border-gv-neutral-500',
        // Secondary button
        secondary: 'bg-gv-neutral-700 text-gv-neutral-100 hover:bg-gv-neutral-600',
        // Ghost button
        ghost: 'text-gv-neutral-300 hover:bg-gv-neutral-800 hover:text-gv-neutral-100',
        // Link style
        link: 'text-gv-primary-400 underline-offset-4 hover:underline hover:text-gv-primary-300',
        // Success variant
        success: 'bg-gv-success text-white hover:bg-gv-success-dark',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-gv-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
