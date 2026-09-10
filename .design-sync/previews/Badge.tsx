import { Badge } from '@computerjy/design-system';

export const WithIcon = () => (
  <Badge icon="✦">Welcome to ComputerJy World</Badge>
);

export const PlainLabel = () => <Badge>Featured Insight</Badge>;

export const AsCategoryChip = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge>Reviews</Badge>
    <Badge>Guides</Badge>
    <Badge icon="🔥">Trending</Badge>
  </div>
);
