const LINK_CLASS =
  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue transition-all shadow-xs';

const EDGE_CLASS =
  'px-3.5 h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-blue hover:text-brand-blue transition-all shadow-xs';

const EDGE_DISABLED_CLASS =
  'px-3.5 h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm bg-slate-100 dark:bg-dark-subtle/50 border border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed';

/**
 * The visible page window: always the first and last page, plus two either
 * side of the current one. A gap of exactly two is filled with the single
 * intervening page; wider gaps collapse to an ellipsis.
 */
export function getPageRange(
  current: number,
  total: number
): (number | string)[] {
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

/** Default href rule: page 1 is the site root, others are `/page/N`. */
const defaultHrefForPage = (page: number) =>
  page === 1 ? '/' : `/page/${page}`;

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Override the link target for a page number. */
  hrefForPage?: (page: number) => string;
}

export function Pagination({
  currentPage,
  totalPages,
  hrefForPage = defaultHrefForPage,
}: PaginationProps) {
  const pages = getPageRange(currentPage, totalPages);
  const prevUrl = currentPage > 1 ? hrefForPage(currentPage - 1) : null;
  const nextUrl =
    currentPage < totalPages ? hrefForPage(currentPage + 1) : null;

  return (
    <nav
      className="flex items-center justify-center gap-1.5 pt-6 pb-2"
      aria-label="Pagination Navigation"
    >
      {prevUrl ? (
        <a href={prevUrl} className={EDGE_CLASS} aria-label="Previous page">
          &larr; Prev
        </a>
      ) : (
        <span className={EDGE_DISABLED_CLASS}>&larr; Prev</span>
      )}

      {pages.map((p, idx) => {
        if (p === '...') {
          return (
            <span
              key={`gap-${idx}`}
              className="w-8 h-10 flex items-center justify-center text-slate-400 dark:text-slate-600 font-bold"
            >
              &hellip;
            </span>
          );
        }
        const pageNum = p as number;
        return pageNum === currentPage ? (
          <span
            key={pageNum}
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm text-white bg-grad-primary shadow-glow-blue"
            aria-current="page"
          >
            {pageNum}
          </span>
        ) : (
          <a key={pageNum} href={hrefForPage(pageNum)} className={LINK_CLASS}>
            {pageNum}
          </a>
        );
      })}

      {nextUrl ? (
        <a href={nextUrl} className={EDGE_CLASS} aria-label="Next page">
          Next &rarr;
        </a>
      ) : (
        <span className={EDGE_DISABLED_CLASS}>Next &rarr;</span>
      )}
    </nav>
  );
}
