import { Pagination } from '@computerjy/design-system';

/** Page 1: Prev is disabled, and the window has no leading ellipsis. */
export const FirstPage = () => <Pagination currentPage={1} totalPages={12} />;

/** Mid-range: both ellipses appear around the current window. */
export const MiddleWithEllipses = () => (
  <Pagination currentPage={7} totalPages={20} />
);

/** Last page: Next is disabled. */
export const LastPage = () => <Pagination currentPage={12} totalPages={12} />;

/** Few enough pages that every number fits — no ellipsis at all. */
export const ShortRange = () => <Pagination currentPage={2} totalPages={4} />;
