import { describe, it, expect, afterEach } from 'vitest';
import { fetchAllPaginated, fetchByIds, WpApiError } from '../src/lib/wp-client';

function mockFetch(pages: unknown[][], total: number) {
  return async (url: string | URL): Promise<Response> => {
    const page = Number(new URL(String(url)).searchParams.get('page') ?? '1');
    return new Response(JSON.stringify(pages[page - 1] ?? []), {
      status: 200,
      headers: {
        'X-WP-Total': String(total),
        'X-WP-TotalPages': String(pages.length),
      },
    });
  };
}

describe('fetchAllPaginated', () => {
  it('concatenates every page', async () => {
    const f = mockFetch([[{ id: 1 }, { id: 2 }], [{ id: 3 }]], 3);
    const out = await fetchAllPaginated<{ id: number }>('posts', 'id', f as typeof fetch);
    expect(out.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('throws when the assembled count does not match X-WP-Total', async () => {
    // header claims 99 but only 3 items exist - a silently truncated response
    const f = mockFetch([[{ id: 1 }, { id: 2 }], [{ id: 3 }]], 99);
    await expect(fetchAllPaginated('posts', 'id', f as typeof fetch)).rejects.toThrow(WpApiError);
    await expect(fetchAllPaginated('posts', 'id', f as typeof fetch)).rejects.toThrow(
      /returned 3 items but X-WP-Total reported 99/
    );
  });

  it('throws on a non-2xx response', async () => {
    const f = async () => new Response('nope', { status: 503 });
    await expect(fetchAllPaginated('posts', 'id', f as typeof fetch)).rejects.toThrow(/503/);
  });

  it('throws on a network error rather than returning empty', async () => {
    const f = async () => {
      throw new Error('ECONNREFUSED');
    };
    await expect(fetchAllPaginated('posts', 'id', f as typeof fetch)).rejects.toThrow(WpApiError);
    await expect(fetchAllPaginated('posts', 'id', f as typeof fetch)).rejects.toThrow(
      /Network failure fetching .*ECONNREFUSED/
    );
  });

  it('throws when the endpoint returns zero items', async () => {
    const f = mockFetch([[]], 0);
    await expect(fetchAllPaginated('posts', 'id', f as typeof fetch)).rejects.toThrow(/returned no items/);
  });

  it('does not throw on zero items when allowEmpty is set', async () => {
    const f = mockFetch([[]], 0);
    await expect(
      fetchAllPaginated('comments', 'id', f as typeof fetch, { allowEmpty: true })
    ).resolves.toEqual([]);
  });
});

describe('fetchByIds', () => {
  it('returns all requested items when every id resolves', async () => {
    const calls: string[] = [];
    const f = async (url: string | URL): Promise<Response> => {
      calls.push(String(url));
      return new Response(JSON.stringify([{ id: 3243 }, { id: 3234 }]), { status: 200 });
    };
    const out = await fetchByIds<{ id: number }>('media', 'id', [3243, 3234], f as typeof fetch);
    expect(out.map((m) => m.id)).toEqual([3243, 3234]);
    expect(calls).toHaveLength(1);
  });

  it('throws a WpApiError naming the missing ids when one does not resolve', async () => {
    const f = async () =>
      new Response(JSON.stringify([{ id: 3243 }]), { status: 200 });
    await expect(
      fetchByIds<{ id: number }>('media', 'id', [3243, 99], f as typeof fetch)
    ).rejects.toThrow(/did not resolve: 99/);
  });

  it('returns [] for an empty id array without performing any fetch', async () => {
    let called = false;
    const f = async () => {
      called = true;
      return new Response('[]', { status: 200 });
    };
    const out = await fetchByIds<{ id: number }>('media', 'id', [], f as typeof fetch);
    expect(out).toEqual([]);
    expect(called).toBe(false);
  });
});

describe('WP_BUILD_TOKEN header', () => {
  // Cloudflare bot protection 403s GitHub runner IPs; a WAF skip rule keyed on this
  // header is what lets CI and the deploy build reach the API.
  const original = process.env.WP_BUILD_TOKEN;
  afterEach(() => {
    if (original === undefined) delete process.env.WP_BUILD_TOKEN;
    else process.env.WP_BUILD_TOKEN = original;
  });

  function capturingFetch(seen: Array<RequestInit | undefined>) {
    return async (_url: string | URL, init?: RequestInit): Promise<Response> => {
      seen.push(init);
      return new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { 'X-WP-Total': '1', 'X-WP-TotalPages': '1' },
      });
    };
  }

  it('sends X-Build-Auth when WP_BUILD_TOKEN is set', async () => {
    process.env.WP_BUILD_TOKEN = 'sekrit';
    const seen: Array<RequestInit | undefined> = [];
    await fetchAllPaginated('posts', 'id', capturingFetch(seen) as typeof fetch);
    expect((seen[0]?.headers as Record<string, string>)?.['X-Build-Auth']).toBe('sekrit');
  });

  it('sends no header when WP_BUILD_TOKEN is unset', async () => {
    delete process.env.WP_BUILD_TOKEN;
    const seen: Array<RequestInit | undefined> = [];
    await fetchAllPaginated('posts', 'id', capturingFetch(seen) as typeof fetch);
    expect(seen[0]).toBeUndefined();
  });

  it('applies the header to fetchByIds as well', async () => {
    process.env.WP_BUILD_TOKEN = 'sekrit';
    const seen: Array<RequestInit | undefined> = [];
    await fetchByIds('media', 'id', [1], capturingFetch(seen) as typeof fetch);
    expect((seen[0]?.headers as Record<string, string>)?.['X-Build-Auth']).toBe('sekrit');
  });
});
