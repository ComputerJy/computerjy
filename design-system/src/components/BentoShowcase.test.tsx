import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BentoShowcase } from './BentoShowcase';
import type { PostSummary } from '../types';

const featured: PostSummary = {
  title: 'The Featured One',
  href: '/posts/featured-one',
  imageUrl: '/img/featured.jpg',
  excerpt: 'Featured excerpt.',
  date: '2026-02-01T00:00:00',
  readingTime: '9 min read',
  category: 'Deep Dive',
};

const side: PostSummary[] = [
  { ...featured, title: 'Side A', href: '/posts/side-a', category: 'News' },
  { ...featured, title: 'Side B', href: '/posts/side-b', category: 'Guides' },
];

describe('BentoShowcase', () => {
  it('renders the featured post as a level-two heading', () => {
    render(<BentoShowcase featured={featured} side={side} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'The Featured One' })
    ).toBeInTheDocument();
  });

  it('renders every side post as a level-three heading', () => {
    render(<BentoShowcase featured={featured} side={side} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Side A' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Side B' })
    ).toBeInTheDocument();
  });

  it('eagerly loads the featured image as the LCP candidate', () => {
    render(<BentoShowcase featured={featured} side={side} />);
    const img = screen.getByAltText('The Featured One');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('falls back to the Featured label and 4 min read', () => {
    render(
      <BentoShowcase
        featured={{ ...featured, category: '', readingTime: '' }}
        side={[]}
      />
    );
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('4 min read')).toBeInTheDocument();
  });

  it('renders no side column entries when side is empty', () => {
    render(<BentoShowcase featured={featured} side={[]} />);
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });
});
