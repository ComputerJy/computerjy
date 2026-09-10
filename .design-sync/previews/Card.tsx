import { Card } from '@computerjy/design-system';

export const Surface = () => (
  <Card className="p-6">
    <h3 className="font-heading font-bold text-slate-900 dark:text-white mb-1">
      Static surface
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400">
      The shared shell every card in the system sits on: surface colour,
      hairline border, 2xl radius.
    </p>
  </Card>
);

export const Interactive = () => (
  <Card interactive className="p-6">
    <h3 className="font-heading font-bold text-slate-900 dark:text-white mb-1">
      Interactive surface
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400">
      Adds the lift-and-glow hover used by anything clickable. Hover to see it.
    </p>
  </Card>
);

export const AsArticle = () => (
  <Card as="article" className="p-6">
    <p className="text-sm text-slate-600 dark:text-slate-400">
      Rendered as an <code>article</code> via the <code>as</code> prop.
    </p>
  </Card>
);
