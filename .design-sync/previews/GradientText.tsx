import { GradientText } from '@computerjy/design-system';

// GradientText paints no surface of its own — like Prose, it inherits the
// page's text tokens, which are light because this system is dark by default.
// Shown on the system's own surface so the non-gradient half stays legible.
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-surface)' }}>
    {children}
  </div>
);

export const PrimaryGradient = () => (
  <Panel>
    <h2 className="text-3xl font-heading font-black tracking-tight">
      <GradientText>Occasional Software Reviews</GradientText>
    </h2>
  </Panel>
);

export const AccentGradient = () => (
  <Panel>
    <h2 className="text-3xl font-heading font-black tracking-tight">
      <GradientText tone="accent">Entertainment &amp; Tech Tips</GradientText>
    </h2>
  </Panel>
);

export const InlineWithPlainText = () => (
  <Panel>
    <h2 className="text-2xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
      Entertainment, Tech Tips &amp;{' '}
      <GradientText>Occasional Reviews</GradientText>
    </h2>
  </Panel>
);
