import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroBanner } from './HeroBanner';

describe('HeroBanner', () => {
  it('renders the current site copy when given no props', () => {
    render(<HeroBanner />);
    expect(screen.getByText(/Welcome to ComputerJy World/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Entertainment, Tech Tips &'
    );
    expect(screen.getByText('Occasional Software Reviews')).toHaveClass(
      'text-gradient'
    );
    expect(screen.getByText(/since 2007/)).toBeInTheDocument();
  });

  it('renders the default stat trio', () => {
    render(<HeroBanner />);
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('18+')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Articles & Tips')).toBeInTheDocument();
  });

  it('accepts overridden copy and stats', () => {
    render(
      <HeroBanner
        headline="New Headline"
        headlineAccent="Accented Part"
        stats={[{ value: '7', label: 'Things', tone: 'blue' }]}
      />
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'New Headline'
    );
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.queryByText('500+')).not.toBeInTheDocument();
  });
});
