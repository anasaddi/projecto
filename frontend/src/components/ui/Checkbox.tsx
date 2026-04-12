import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked = false, className, disabled, ...props }, ref) => {
    return (
      <label className={cn('inline-flex items-center cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
        <input ref={ref} type="checkbox" checked={checked} disabled={disabled} className="sr-only" {...props} />
        <div
          className={cn(
            'flex h-[18px] w-[18px] items-center justify-center rounded border transition-all',
            checked
              ? 'border-indigo-500 bg-indigo-500'
              : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-transparent'
          )}
        >
          {checked && <CheckIcon />}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

function CheckIcon() {
  return (
    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
