import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SocialShare } from './SocialShare';

const props = {
  title: 'Hello & Goodbye',
  url: 'https://www.computerjy.com/posts/hello-world',
};

describe('SocialShare', () => {
  it('builds an X share link from the title and url', () => {
    render(<SocialShare {...props} />);
    const link = screen.getByRole('link', { name: /X \/ Twitter/ });
    expect(link).toHaveAttribute(
      'href',
      'https://twitter.com/intent/tweet?text=Hello%20%26%20Goodbye&url=https%3A%2F%2Fwww.computerjy.com%2Fposts%2Fhello-world'
    );
  });

  it('points the Facebook share at the article, not the homepage', () => {
    render(<SocialShare {...props} />);
    const link = screen.getByRole('link', { name: /Facebook/ });
    expect(link.getAttribute('href')).toContain(encodeURIComponent(props.url));
    expect(link.getAttribute('href')).not.toBe(
      'https://www.facebook.com/sharer/sharer.php?u=https://www.computerjy.com'
    );
  });

  it('opens share links in a new tab safely', () => {
    render(<SocialShare {...props} />);
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('calls onCopy with the url when the copy button is clicked', async () => {
    const onCopy = vi.fn();
    render(<SocialShare {...props} onCopy={onCopy} />);
    await userEvent.click(screen.getByRole('button', { name: /Copy Link/ }));
    expect(onCopy).toHaveBeenCalledWith(props.url);
  });

  it('calls navigator.clipboard.writeText when the copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    try {
      render(<SocialShare {...props} />);
      await userEvent.click(screen.getByRole('button', { name: /Copy Link/ }));
      expect(writeText).toHaveBeenCalledWith(props.url);
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    }
  });
});
