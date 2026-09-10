import { HeroBanner } from '@computerjy/design-system';

/** Renders the live site's own copy — every prop defaults to it. */
export const SiteDefaults = () => <HeroBanner />;

export const CustomCopy = () => (
  <HeroBanner
    badgeText="New this quarter"
    headline="Independent Reviews &"
    headlineAccent="Field Notes From the Terminal"
    description="Short, opinionated write-ups on the software actually worth installing — tested on real machines, not spec sheets."
    stats={[
      { value: '42', label: 'Tools Reviewed', tone: 'blue' },
      { value: '12', label: 'Guides Published', tone: 'pink' },
      { value: '0', label: 'Sponsored Posts', tone: 'amber' },
    ]}
  />
);
