import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const inputVariants = cva(
  'w-full bg-transparent outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500',
  {
    variants: {
      variant: {
        default: 'text-stone-900 dark:text-stone-100',
        ghost: 'text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/50 focus:bg-stone-50 dark:focus:bg-stone-800/50 rounded-lg',
      },
      size: {
        sm: 'text-sm py-1.5 px-2',
        md: 'text-sm py-2 px-3',
        lg: 'text-base py-2.5 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  wrapperClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, wrapperClassName, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 transition-all focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/20',
          wrapperClassName
        )}
      >
        {leftIcon && <span className="text-stone-400 dark:text-stone-500 ml-2">{leftIcon}</span>}
        <input ref={ref} className={cn(inputVariants({ variant, size }), className)} {...props} />
        {rightIcon && <span className="text-stone-400 dark:text-stone-500 mr-2">{rightIcon}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface InlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const InlineInput = React.forwardRef<HTMLInputElement, InlineInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-transparent border-none outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 caret-indigo-500 dark:caret-indigo-400 transition-colors focus:bg-stone-50 dark:focus:bg-stone-800/50 rounded px-1 -mx-1',
          className
        )}
        {...props}
      />
    );
  }
);
InlineInput.displayName = 'InlineInput';
