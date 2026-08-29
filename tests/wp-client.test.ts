import { describe, it, expect } from 'vitest';
import { fetchAllPaginated, WpApiError } from '../src/lib/wp-client';

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
  });

  it('throws when the endpoint returns zero items', async () => {
    const f = mockFetch([[]], 0);
    await expect(fetchAllPaginated('posts', 'id', f as typeof fetch)).rejects.toThrow(/returned no items/);
  });
});
