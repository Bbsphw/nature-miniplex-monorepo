'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex items-center shrink-0',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        )}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          role="switch"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'relative w-10 h-5 rounded-full bg-surface-border transition-colors duration-200',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-base',
            "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform after:duration-200",
            'peer-checked:bg-brand-red peer-checked:after:translate-x-5',
            'peer-disabled:opacity-50',
            className
          )}
        />
      </label>
    );
  }
);

Switch.displayName = 'Switch';
