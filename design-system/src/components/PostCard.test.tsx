import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostCard } from './PostCard';

const props = {
  title: 'Hello World',
  href: '/posts/hello-world',
  imageUrl: '/img/hello.jpg',
  excerpt: 'An excerpt here.',
  date: '2026-01-15T09:30:00',
  readingTime: '5 min read',
  category: 'Reviews',
};

describe('PostCard', () => {
  it('renders the title linking to the post', () => {
    render(<PostCard {...props} />);
    const link = screen.getByRole('link', { name: 'Hello World' });
    expect(link).toHaveAttribute('href', '/posts/hello-world');
  });

  it('renders the category badge and reading time', () => {
    render(<PostCard {...props} />);
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('formats the date in en-GB and exposes it as a datetime attribute', () => {
    const { container } = render(<PostCard {...props} />);
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('datetime', '2026-01-15T09:30:00');
    expect(time?.textContent).toBe('15/01/2026');
  });

  it('defaults the author to Eyad Salah with the site logo', () => {
    render(<PostCard {...props} />);
    expect(screen.getByText('Eyad Salah')).toBeInTheDocument();
    expect(screen.getByAltText('Eyad Salah')).toHaveAttribute(
      'src',
      '/logo-icon.svg'
    );
  });

  it('carries the shared card surface classes', () => {
    const { container } = render(<PostCard {...props} />);
    const article = container.querySelector('article');
    expect(article).toHaveClass('rounded-2xl', 'group');
  });
});
