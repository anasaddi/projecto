import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================
// BUTTON VARIANTS
// ============================================
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] active:duration-100',
  {
    variants: {
      // Visual style
      variant: {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md hover:shadow-indigo-500/25',
        secondary: 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100',
        outline: 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-zinc-700 dark:text-zinc-300 bg-transparent',
        ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 bg-transparent',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md hover:shadow-red-500/25',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/25',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md hover:shadow-amber-500/25',
        'ghost-primary': 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 bg-transparent',
      },
      // Size
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-lg rounded-xl',
        icon: 'h-10 w-10 p-0 flex items-center justify-center rounded-lg',
        'icon-sm': 'h-8 w-8 p-0 flex items-center justify-center rounded-md',
        'icon-lg': 'h-12 w-12 p-0 flex items-center justify-center rounded-xl',
      },
      // Width
      width: {
        auto: '',
        full: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      width: 'auto',
    },
  }
);

// ============================================
// BUTTON COMPONENT
// ============================================
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    width,
    loading = false,
    icon,
    iconPosition = 'left',
    disabled,
    children,
    ...props 
  }, ref) => {
    const isIconOnly = size?.startsWith('icon');
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, width }), className)}
        {...props}
      >
        {loading && (
          <LoadingSpinner className={cn(isIconOnly ? 'h-4 w-4' : 'h-4 w-4')} />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className={cn('flex-shrink-0', isIconOnly ? '' : '-ml-0.5')}>
            {icon}
          </span>
        )}
        {!isIconOnly && children}
        {!loading && icon && iconPosition === 'right' && (
          <span className={cn('flex-shrink-0', isIconOnly ? '' : '-mr-0.5')}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// ICON BUTTON COMPONENT
// ============================================
export interface IconButtonProps extends Omit<ButtonProps, 'iconPosition'> {
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const sizeMap = {
      sm: 'icon-sm',
      md: 'icon',
      lg: 'icon-lg',
    };
    
    return (
      <Button
        ref={ref}
        size={sizeMap[size as keyof typeof sizeMap] as any}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================
// BUTTON GROUP COMPONENT
// ============================================
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', attached = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          attached 
            ? orientation === 'horizontal' 
              ? '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:last-child)]:border-r-0'
              : '[&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none [&>*:not(:last-child)]:border-b-0'
            : orientation === 'horizontal' ? 'gap-2' : 'gap-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

// ============================================
// LOADING SPINNER
// ============================================
interface LoadingSpinnerProps {
  className?: string;
}

function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// Export
export { buttonVariants };
