export const API_BASE = 'https://www.computerjy.com/wp-json/wp/v2';

/** Distinguishes "the API let us down" from ordinary programming errors. */
export class WpApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WpApiError';
  }
}

const PER_PAGE = 100;

/**
 * Cloudflare's bot protection rejects datacenter IP ranges, so CI runners receive a
 * 403 from the edge before the request ever reaches WordPress. When WP_BUILD_TOKEN is
 * set, every request carries it as X-Build-Auth, and a Cloudflare WAF rule skips bot
 * protection for requests presenting the matching value.
 *
 * Unset locally and anywhere the source IP is not challenged, in which case no header
 * is sent and behaviour is unchanged.
 */
function buildRequestInit(): RequestInit | undefined {
  const token =
    typeof process !== 'undefined' ? process.env?.WP_BUILD_TOKEN : undefined;
  return token ? { headers: { 'X-Build-Auth': token } } : undefined;
}

/**
 * A rejection from an edge proxy looks identical to one from the origin unless you
 * report the edge's own headers. `cf-mitigated` names which Cloudflare product blocked
 * the request, and `cf-ray` identifies it in the Cloudflare dashboard's event log —
 * without these, diagnosing a 403 means guessing.
 */
function edgeDiagnostics(res: Response): string {
  const parts = ['server', 'cf-mitigated', 'cf-ray']
    .map((h) => [h, res.headers.get(h)] as const)
    .filter((pair): pair is readonly [string, string] => pair[1] !== null)
    .map(([h, v]) => `${h}=${v}`);
  const sentAuth =
    typeof process !== 'undefined' && process.env?.WP_BUILD_TOKEN
      ? 'X-Build-Auth sent'
      : 'no X-Build-Auth';
  return `[${[...parts, sentAuth].join(', ')}]`;
}

async function fetchPage(
  endpoint: string,
  fields: string,
  page: number,
  fetchImpl: typeof fetch
): Promise<Response> {
  const url = `${API_BASE}/${endpoint}?per_page=${PER_PAGE}&page=${page}&_fields=${fields}`;
  let res: Response;
  try {
    res = await fetchImpl(url, buildRequestInit());
  } catch (cause) {
    throw new WpApiError(
      `Network failure fetching ${url}: ${(cause as Error).message}`
    );
  }
  if (!res.ok) {
    throw new WpApiError(
      `GET ${url} returned ${res.status} ${res.statusText} ${edgeDiagnostics(res)}`
    );
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
    throw new WpApiError(
      `Endpoint "${endpoint}" returned no items - refusing to build.`
    );
  }
  if (items.length !== total) {
    throw new WpApiError(
      `Endpoint "${endpoint}" returned ${items.length} items but X-WP-Total reported ${total}. ` +
        `Refusing to build from a partial response.`
    );
  }
  return items;
}

/**
 * Fetches specific records by id. Asserts that every requested id resolved —
 * a stronger guarantee than X-WP-Total, because it verifies the records we
 * actually need rather than a global count. Used for media, whose X-WP-Total
 * on this site disagrees with what pagination returns.
 */
export async function fetchByIds<T extends { id: number }>(
  endpoint: string,
  fields: string,
  ids: number[],
  fetchImpl: typeof fetch = fetch
): Promise<T[]> {
  if (ids.length === 0) return [];
  if (ids.length > 100) {
    throw new WpApiError(
      `fetchByIds("${endpoint}") received ${ids.length} ids; per_page caps at 100. Chunking is not implemented.`
    );
  }
  const url = `${API_BASE}/${endpoint}?include=${ids.join(',')}&per_page=100&_fields=${fields}`;
  let res: Response;
  try {
    res = await fetchImpl(url, buildRequestInit());
  } catch (cause) {
    throw new WpApiError(
      `Network failure fetching ${url}: ${(cause as Error).message}`
    );
  }
  if (!res.ok) {
    throw new WpApiError(
      `GET ${url} returned ${res.status} ${res.statusText} ${edgeDiagnostics(res)}`
    );
  }
  const items = (await res.json()) as T[];
  const got = new Set(items.map((i) => i.id));
  const missing = ids.filter((id) => !got.has(id));
  if (missing.length > 0) {
    throw new WpApiError(
      `Endpoint "${endpoint}": requested ${ids.length} ids but ${missing.length} did not resolve: ${missing.join(', ')}`
    );
  }
  return items;
}
