import type { ReactNode } from 'react';

export interface BadgeProps {
  /** Badge label content. */
  children: ReactNode;
  /** Optional leading glyph, rendered in the brand amber accent. */
  icon?: ReactNode;
}

/**
 * The pill badge from `global.css` (`.badge-glow`) — gradient fill, cyan
 * border, uppercase tracking. Used for section eyebrows and category chips.
 */
export function Badge({ children, icon }: BadgeProps) {
  return (
    <span className="badge-glow">
      {icon ? (
        <span className="text-amber-600 dark:text-brand-amber font-bold">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
