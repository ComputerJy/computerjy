import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children inside the badge-glow class', () => {
    render(<Badge>Featured</Badge>);
    const el = screen.getByText(/Featured/);
    expect(el.closest('.badge-glow')).not.toBeNull();
  });

  it('renders an icon slot when given one', () => {
    render(<Badge icon="✦">Welcome</Badge>);
    expect(screen.getByText('✦')).toBeInTheDocument();
  });

  it('omits the icon span entirely when no icon is given', () => {
    const { container } = render(<Badge>Plain</Badge>);
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });

  it('separates the icon from the label with a single space', () => {
    const { container } = render(<Badge icon="✦">Welcome</Badge>);
    expect(container.querySelector('.badge-glow')?.textContent).toBe(
      '✦ Welcome'
    );
  });

  it('has no leading space in textContent when no icon is given', () => {
    const { container } = render(<Badge>Plain</Badge>);
    expect(container.querySelector('.badge-glow')?.textContent).toBe('Plain');
  });
});
