import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GradientText } from './GradientText';

describe('GradientText', () => {
  it('defaults to the primary gradient', () => {
    render(<GradientText>Reviews</GradientText>);
    expect(screen.getByText('Reviews')).toHaveClass('text-gradient');
  });

  it('uses the accent gradient when asked', () => {
    render(<GradientText tone="accent">Reviews</GradientText>);
    expect(screen.getByText('Reviews')).toHaveClass('text-gradient-accent');
  });
});
