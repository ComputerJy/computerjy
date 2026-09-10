import { GradientText } from '@computerjy/design-system';

export const PrimaryGradient = () => (
  <h2 className="text-3xl font-heading font-black tracking-tight">
    <GradientText>Occasional Software Reviews</GradientText>
  </h2>
);

export const AccentGradient = () => (
  <h2 className="text-3xl font-heading font-black tracking-tight">
    <GradientText tone="accent">Entertainment &amp; Tech Tips</GradientText>
  </h2>
);

export const InlineWithPlainText = () => (
  <h2 className="text-2xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
    Entertainment, Tech Tips &amp;{' '}
    <GradientText>Occasional Reviews</GradientText>
  </h2>
);
