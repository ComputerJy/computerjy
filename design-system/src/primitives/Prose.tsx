import type { ReactNode } from 'react';

/**
 * Exactly one of `html` or `children`. `html` is inserted verbatim and must
 * already be sanitized by the caller — the site sanitizes upstream in
 * `src/lib/utils.ts`.
 */
export type ProseProps =
  { html: string; children?: never } | { html?: never; children: ReactNode };

/** Long-form article typography (`.prose-custom` in global.css). */
export function Prose(props: ProseProps) {
  if (typeof props.html === 'string') {
    return (
      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    );
  }
  return <div className="prose-custom">{props.children}</div>;
}
