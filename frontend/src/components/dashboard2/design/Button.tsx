import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-stone-900 dark:bg-indigo-500 text-white hover:bg-stone-800 dark:hover:bg-indigo-400',
        secondary: 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-600',
        ghost: 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-stone-200 dark:border-stone-700 bg-transparent hover:bg-stone-50 dark:hover:bg-stone-800',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-lg',
        sm: 'h-8 px-3 text-xs rounded-xl',
        md: 'h-9 px-4 text-sm rounded-xl',
        lg: 'h-10 px-5 text-sm rounded-xl',
        icon: 'h-9 w-9 rounded-xl',
        'icon-sm': 'h-7 w-7 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
