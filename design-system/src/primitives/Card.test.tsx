import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders a div carrying the shared surface classes by default', () => {
    render(<Card>body</Card>);
    const el = screen.getByText('body');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('bg-white', 'dark:bg-dark-surface', 'rounded-2xl');
  });

  it('adds hover affordances only when interactive', () => {
    const { rerender } = render(<Card>body</Card>);
    expect(screen.getByText('body')).not.toHaveClass('group');
    rerender(<Card interactive>body</Card>);
    expect(screen.getByText('body')).toHaveClass('group');
  });

  it('renders the requested element and appends extra classes', () => {
    render(
      <Card as="article" className="p-6">
        body
      </Card>
    );
    const el = screen.getByText('body');
    expect(el.tagName).toBe('ARTICLE');
    expect(el).toHaveClass('p-6');
  });
});
