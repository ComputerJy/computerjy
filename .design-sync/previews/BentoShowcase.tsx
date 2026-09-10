import { BentoShowcase } from '@computerjy/design-system';
import { AVATAR, POST, SIDE_POSTS } from './_fixtures';

/** The homepage layout: one large featured card beside a stack of three. */
export const Homepage = () => (
  <BentoShowcase featured={POST} side={SIDE_POSTS} authorAvatarUrl={AVATAR} />
);

/** Featured card alone — the side column collapses when there is nothing to stack. */
export const FeaturedOnly = () => (
  <BentoShowcase featured={POST} side={[]} authorAvatarUrl={AVATAR} />
);
