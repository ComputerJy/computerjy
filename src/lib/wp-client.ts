export const API_BASE = 'https://www.computerjy.com/wp-json/wp/v2';

/** Distinguishes "the API let us down" from ordinary programming errors. */
export class WpApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WpApiError';
  }
}

const PER_PAGE = 100;

async function fetchPage(
  endpoint: string,
  fields: string,
  page: number,
  fetchImpl: typeof fetch
): Promise<Response> {
  const url = `${API_BASE}/${endpoint}?per_page=${PER_PAGE}&page=${page}&_fields=${fields}`;
  let res: Response;
  try {
    res = await fetchImpl(url);
  } catch (cause) {
    throw new WpApiError(`Network failure fetching ${url}: ${(cause as Error).message}`);
  }
  if (!res.ok) {
    throw new WpApiError(`GET ${url} returned ${res.status} ${res.statusText}`);
  }
  return res;
}

/**
 * Fetches every page of a WP collection.
 *
 * Hard-fail by design (see spec section 5.5): a truncated or empty response must
 * never be mistaken for real data, because the persisted content store would
 * otherwise keep serving the previous build's entries and the site would ship
 * stale content with a green build.
 */
export async function fetchAllPaginated<T>(
  endpoint: string,
  fields: string,
  fetchImpl: typeof fetch = fetch
): Promise<T[]> {
  const first = await fetchPage(endpoint, fields, 1, fetchImpl);
  const total = Number(first.headers.get('X-WP-Total') ?? '0');
  const totalPages = Number(first.headers.get('X-WP-TotalPages') ?? '0');

  const items = (await first.json()) as T[];
  for (let page = 2; page <= totalPages; page++) {
    const res = await fetchPage(endpoint, fields, page, fetchImpl);
    items.push(...((await res.json()) as T[]));
  }

  if (items.length === 0) {
    throw new WpApiError(`Endpoint "${endpoint}" returned no items - refusing to build.`);
  }
  if (items.length !== total) {
    throw new WpApiError(
      `Endpoint "${endpoint}" returned ${items.length} items but X-WP-Total reported ${total}. ` +
        `Refusing to build from a partial response.`
    );
  }
  return items;
}
