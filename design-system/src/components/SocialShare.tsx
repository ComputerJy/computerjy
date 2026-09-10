export interface SocialShareProps {
  /** Article title, used as the tweet text. */
  title: string;
  /** Canonical article URL. Shared as-is. */
  url: string;
  /** Called with the url when copy is attempted (fires optimistically on click, before clipboard result). */
  onCopy?: (url: string) => void;
}

const BUTTON_CLASS =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-light-subtle dark:bg-dark-subtle border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-blue hover:text-white transition-all shadow-xs';

/** The share row shown under an article: X, Facebook, and copy-link. */
export function SocialShare({ title, url, onCopy }: SocialShareProps) {
  const tweetHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(url)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url
  )}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(url).catch(() => {
      // Clipboard API not available or permission denied; fail silently.
    });
    onCopy?.(url);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-5 my-8 border-y border-slate-200/80 dark:border-slate-800">
      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <span>🚀 Share Article:</span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={tweetHref}
          target="_blank"
          rel="noopener noreferrer"
          className={BUTTON_CLASS}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>X / Twitter</span>
        </a>

        <a
          href={facebookHref}
          target="_blank"
          rel="noopener noreferrer"
          className={BUTTON_CLASS}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook</span>
        </a>

        <button type="button" className={BUTTON_CLASS} onClick={handleCopy}>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>Copy Link</span>
        </button>
      </div>
    </div>
  );
}
