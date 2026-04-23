import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const cardVariants = cva(
  'relative overflow-hidden transition-all duration-500',
  {
    variants: {
      variant: {
        default: 'bg-white/90 dark:bg-stone-900/80 backdrop-blur-md border border-white/20 dark:border-white/10',
        elevated: 'bg-white/95 dark:bg-stone-900/90 backdrop-blur-xl shadow-2xl shadow-stone-200/30 dark:shadow-black/40',
        glass: 'bg-white/70 dark:bg-stone-800/60 backdrop-blur-2xl border border-white/30 dark:border-white/10',
        premium: 'bg-gradient-to-br from-white/90 to-white/70 dark:from-stone-800/90 dark:to-stone-900/70 backdrop-blur-xl border border-white/40 dark:border-white/5 shadow-xl',
        glow: 'bg-stone-900/80 backdrop-blur-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10',
        compact: 'bg-stone-50/80 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800',
        ghost: 'bg-transparent border border-transparent hover:bg-white/50 dark:hover:bg-stone-800/50',
      },
      size: {
        sm: 'rounded-2xl p-4',
        md: 'rounded-3xl p-5',
        lg: 'rounded-[2rem] p-6',
        xl: 'rounded-[2.5rem] p-8',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer',
        glow: 'hover:shadow-indigo-500/30 hover:shadow-xl hover:border-indigo-500/30',
        scale: 'hover:scale-[1.02] cursor-pointer',
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
