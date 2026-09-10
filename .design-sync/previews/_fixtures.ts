// Shared realistic data for the authored previews. Absolute production URLs:
// the components' site-root-relative defaults (/logo-icon.svg) 404 in previews.
export const AVATAR = 'https://www.computerjy.com/logo-icon.svg';
export const IMAGE = 'https://www.computerjy.com/logo-stacked.svg';

export const POST = {
  title:
    'Reclaiming the Web: Why Brave, Firefox and the New Wave of Privacy Browsers Matter',
  href: '/posts/reclaiming-the-web',
  imageUrl: IMAGE,
  excerpt:
    'Independent browsers are quietly winning back ground from the Chromium monoculture. Here is what actually changed this year, and which of it survives daily use.',
  date: '2026-01-15T09:30:00',
  readingTime: '7 min read',
  category: 'Reviews',
};

export const SIDE_POSTS = [
  {
    ...POST,
    title: 'Five Terminal Tools That Replaced My GUI Workflow',
    href: '/posts/terminal-tools',
    category: 'Guides',
    readingTime: '4 min read',
  },
  {
    ...POST,
    title: 'The Quiet Return of RSS',
    href: '/posts/quiet-return-of-rss',
    category: 'Internet',
    readingTime: '3 min read',
  },
  {
    ...POST,
    title: 'What Self-Hosting Actually Costs in 2026',
    href: '/posts/self-hosting-costs',
    category: 'Tech Tips',
    readingTime: '6 min read',
  },
];
