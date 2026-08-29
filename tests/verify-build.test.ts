import { describe, it, expect } from 'vitest';
import {
  findForbiddenMatches,
  percentEncodedSlugs,
  comparePostSets,
  diffKnownSlugs,
} from '../scripts/verify-build.mjs';

describe('findForbiddenMatches', () => {
  it('reports every match of a forbidden pattern', () => {
    const hits = findForbiddenMatches(
      'a &amp;#8217; b &amp;#038; c',
      /&amp;#\d+;/g
    );
    expect(hits).toEqual(['&amp;#8217;', '&amp;#038;']);
  });

  it('returns an empty array for clean text', () => {
    expect(findForbiddenMatches('nothing to see', /&amp;#\d+;/g)).toEqual([]);
  });

  it('is not confused by a global regex being reused', () => {
    const re = /x/g;
    expect(findForbiddenMatches('x', re)).toEqual(['x']);
    expect(findForbiddenMatches('x', re)).toEqual(['x']);
  });
});

describe('percentEncodedSlugs', () => {
  it('flags directory names containing percent-encoding', () => {
    expect(percentEncodedSlugs(['ok-slug', '%d8%a7%d8%a8', 'also-ok'])).toEqual(
      ['%d8%a7%d8%a8']
    );
  });

  it('accepts decoded non-ASCII names', () => {
    expect(percentEncodedSlugs(['ابليس-والعرب', 'plain'])).toEqual([]);
  });
});

describe('comparePostSets', () => {
  it('reports posts the API expects but the page omits', () => {
    const r = comparePostSets(['a', 'b', 'c'], new Set(['a', 'c']), 4);
    expect(r.missing).toEqual(['b']);
    expect(r.ok).toBe(false);
  });

  it('tolerates sidebar extras up to the allowance', () => {
    const r = comparePostSets(['a'], new Set(['a', 's1', 's2', 's3', 's4']), 4);
    expect(r.missing).toEqual([]);
    expect(r.extra).toHaveLength(4);
    expect(r.ok).toBe(true);
  });

  it('fails when extras exceed the allowance', () => {
    const r = comparePostSets(
      ['a'],
      new Set(['a', 's1', 's2', 's3', 's4', 's5']),
      4
    );
    expect(r.ok).toBe(false);
  });
});

describe('diffKnownSlugs', () => {
  it('fails when a previously published slug disappears', () => {
    const r = diffKnownSlugs(['old-post', 'kept'], new Set(['kept']));
    expect(r.missing).toEqual(['old-post']);
    expect(r.ok).toBe(false);
  });

  it('allows new slugs without failing', () => {
    const r = diffKnownSlugs(['kept'], new Set(['kept', 'brand-new']));
    expect(r.added).toEqual(['brand-new']);
    expect(r.missing).toEqual([]);
    expect(r.ok).toBe(true);
  });
});
