import type { ReactNode } from 'react';

/** The surface shell every card in the system shares. */
export const CARD_BASE =
  'bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-slate-800 rounded-2xl';

/** Hover affordances applied to cards that link somewhere. */
export const CARD_INTERACTIVE =
  'group hover:-translate-y-1 hover:shadow-md hover:border-brand-blue/40 transition-all duration-300';

export interface CardProps {
  children: ReactNode;
  /** Adds the lift-and-glow hover treatment used by clickable cards. */
  interactive?: boolean;
  /** Extra classes, typically padding. */
  className?: string;
  as?: 'div' | 'article' | 'section';
}

export function Card({
  children,
  interactive = false,
  className = '',
  as: Tag = 'div',
}: CardProps) {
  const classes = [CARD_BASE, interactive ? CARD_INTERACTIVE : '', className]
    .filter(Boolean)
    .join(' ');
  return <Tag className={classes}>{children}</Tag>;
}
