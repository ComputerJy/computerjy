import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pagination, getPageRange } from './Pagination';

describe('getPageRange', () => {
  it('returns every page when there is no gap', () => {
    expect(getPageRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('fills a gap of exactly two with the intervening page', () => {
    expect(getPageRange(1, 5)).not.toContain('...');
    expect(getPageRange(4, 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('collapses larger gaps to an ellipsis', () => {
    expect(getPageRange(10, 20)).toEqual([
      1,
      '...',
      8,
      9,
      10,
      11,
      12,
      '...',
      20,
    ]);
  });
});

describe('Pagination', () => {
  it('marks the current page and does not link it', () => {
    render(<Pagination currentPage={3} totalPages={10} />);
    const current = screen.getByText('3');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).toBe('SPAN');
  });

  it('links page one to the site root', () => {
    render(<Pagination currentPage={3} totalPages={10} />);
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('links other pages to /page/N', () => {
    render(<Pagination currentPage={3} totalPages={10} />);
    expect(screen.getByRole('link', { name: '4' })).toHaveAttribute(
      'href',
      '/page/4'
    );
  });

  it('disables Prev on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination currentPage={1} totalPages={3} />);
    expect(screen.queryByRole('link', { name: /Prev/ })).toBeNull();
    rerender(<Pagination currentPage={3} totalPages={3} />);
    expect(screen.queryByRole('link', { name: /Next/ })).toBeNull();
  });

  it('sends Prev from page two back to the root', () => {
    render(<Pagination currentPage={2} totalPages={5} />);
    expect(screen.getByRole('link', { name: /Prev/ })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('accepts a custom href builder', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        hrefForPage={(n) => `/archive?p=${n}`}
      />
    );
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      '/archive?p=3'
    );
  });
});
