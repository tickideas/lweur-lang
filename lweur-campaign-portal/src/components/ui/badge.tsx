// src/components/ui/badge.tsx
// Badge component for status indicators and labels
// Provides consistent styling for various badge states and variants
// RELEVANT FILES: src/app/admin/impact/page.tsx, src/components/ui/card.tsx, src/components/ui/button.tsx

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          {
            'bg-primary-900 text-white hover:bg-primary-800':
              variant === 'default',
            'bg-neutral-100 text-neutral-900 hover:bg-neutral-200':
              variant === 'secondary',
            'bg-destructive text-destructive-foreground hover:bg-destructive/80':
              variant === 'destructive',
            'border border-neutral-200 text-neutral-900 hover:bg-neutral-100':
              variant === 'outline',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };