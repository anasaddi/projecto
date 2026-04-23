import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const cardVariants = cva(
  'relative overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700',
        elevated: 'bg-white dark:bg-stone-800 shadow-lg shadow-stone-200/50 dark:shadow-black/30',
        glass: 'bg-white/80 dark:bg-stone-800/80 backdrop-blur-xl border border-white/20 dark:border-stone-700/50',
        compact: 'bg-stone-50 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800',
        ghost: 'bg-transparent border border-transparent hover:bg-stone-50 dark:hover:bg-stone-800/50',
      },
      size: {
        sm: 'rounded-xl p-3',
        md: 'rounded-2xl p-4',
        lg: 'rounded-3xl p-5',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-0.5 hover:shadow-lg cursor-pointer',
        glow: 'hover:shadow-indigo-500/20 hover:shadow-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      hover: 'lift',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  as?: React.ElementType;
  delay?: number;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, children, as: Component = 'div', delay = 0, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      >
        <Component
          ref={ref}
          className={cn(cardVariants({ variant, size, hover }), className)}
          {...props}
        >
          {children}
        </Component>
      </motion.div>
    );
  }
);
Card.displayName = 'Card';
