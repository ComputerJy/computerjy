import type { ReactNode } from 'react';

export interface GradientTextProps {
  children: ReactNode;
  /** `primary` is the cyan→blue→purple ramp; `accent` is pink→orange→yellow. */
  tone?: 'primary' | 'accent';
}

/** Applies a brand gradient as the text fill (`.text-gradient` in global.css). */
export function GradientText({
  children,
  tone = 'primary',
}: GradientTextProps) {
  return (
    <span
      className={tone === 'accent' ? 'text-gradient-accent' : 'text-gradient'}
    >
      {children}
    </span>
  );
}
