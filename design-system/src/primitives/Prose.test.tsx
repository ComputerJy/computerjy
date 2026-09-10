import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Prose } from './Prose';

describe('Prose', () => {
  it('renders children inside the prose-custom wrapper', () => {
    const { container } = render(
      <Prose>
        <p>Body copy</p>
      </Prose>
    );
    expect(container.querySelector('.prose-custom')).not.toBeNull();
    expect(screen.getByText('Body copy')).toBeInTheDocument();
  });

  it('renders raw html when given the html prop', () => {
    const { container } = render(<Prose html="<h2>Heading</h2>" />);
    expect(container.querySelector('.prose-custom h2')?.textContent).toBe(
      'Heading'
    );
  });
});
