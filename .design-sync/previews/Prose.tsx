import { Prose } from '@computerjy/design-system';

// Prose paints no surface of its own — it inherits the page's text tokens,
// which are light because this system is dark by default. Shown here on the
// system's own surface so it reads the way it does in a real article page.
const Page = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-surface)' }}>
    {children}
  </div>
);

export const ArticleBody = () => (
  <Page>
    <Prose>
      <h2>Why independent browsers matter</h2>
      <p>
        Long-form article typography: generous line height, a gradient rule
        under every <code>h2</code>, and blockquotes that sit on the subtle
        surface.
      </p>
      <blockquote>
        The browser you choose is the last piece of the web you actually
        control.
      </blockquote>
      <p>
        Inline <code>code</code> picks up the brand pink, and code blocks invert
        to the dark base regardless of theme.
      </p>
    </Prose>
  </Page>
);

export const FromHtml = () => (
  <Page>
    <Prose html="<h2>Rendered from HTML</h2><p>Pass pre-sanitized markup via the <code>html</code> prop when the body comes from a CMS.</p>" />
  </Page>
);
