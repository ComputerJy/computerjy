import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import type { TermSummary, TrendingItem } from '../types';

const categories: TermSummary[] = [
  { name: 'Reviews', slug: 'reviews', count: 12 },
  { name: 'Guides', slug: 'guides', count: 5 },
];

const tags: TermSummary[] = [{ name: 'linux', slug: 'linux', count: 3 }];

const trendingPosts: TrendingItem[] = [1, 2, 3, 4, 5].map((n) => ({
  title: `Trending ${n}`,
  href: `/posts/trending-${n}`,
  date: '2026-03-01T00:00:00',
}));

const props = { categories, tags, trendingPosts };

describe('Sidebar', () => {
  it('links categories and shows their counts', () => {
    render(<Sidebar {...props} />);
    expect(screen.getByRole('link', { name: /Reviews/ })).toHaveAttribute(
      'href',
      '/category/reviews'
    );
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('links tags with a hash prefix', () => {
    render(<Sidebar {...props} />);
    expect(screen.getByRole('link', { name: '#linux' })).toHaveAttribute(
      'href',
      '/tag/linux'
    );
  });

  it('shows only the first four trending posts, zero-padded', () => {
    render(<Sidebar {...props} />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
    expect(screen.queryByText('05')).toBeNull();
    expect(screen.queryByText('Trending 5')).toBeNull();
  });

  it('calls onSubscribe with the email and never opens a dialog', async () => {
    const onSubscribe = vi.fn();
    render(<Sidebar {...props} onSubscribe={onSubscribe} />);
    const input = screen.getByPlaceholderText('Your email address');
    await userEvent.type(input, 'reader@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Join Free/ }));
    expect(onSubscribe).toHaveBeenCalledWith('reader@example.com');
    expect(input).toHaveValue('');
  });

  it('submits harmlessly with no handler attached', async () => {
    render(<Sidebar {...props} />);
    await userEvent.type(
      screen.getByPlaceholderText('Your email address'),
      'a@b.com'
    );
    await userEvent.click(screen.getByRole('button', { name: /Join Free/ }));
    expect(screen.getByPlaceholderText('Your email address')).toHaveValue('');
  });
});
