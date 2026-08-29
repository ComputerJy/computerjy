import { describe, it, expect } from 'vitest';
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
