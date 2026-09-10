import { Sidebar } from '@computerjy/design-system';
import { AVATAR } from './_fixtures';

const categories = [
  { name: 'Reviews', slug: 'reviews', count: 48 },
  { name: 'Tech Tips', slug: 'tech-tips', count: 31 },
  { name: 'Entertainment', slug: 'entertainment', count: 22 },
  { name: 'Guides', slug: 'guides', count: 17 },
];

const tags = [
  { name: 'linux', slug: 'linux', count: 12 },
  { name: 'privacy', slug: 'privacy', count: 9 },
  { name: 'self-hosting', slug: 'self-hosting', count: 7 },
  { name: 'browsers', slug: 'browsers', count: 6 },
  { name: 'terminal', slug: 'terminal', count: 5 },
];

const trendingPosts = [
  {
    title: 'Reclaiming the Web: Why Privacy Browsers Matter',
    href: '/posts/reclaiming-the-web',
    date: '2026-01-15T09:30:00',
  },
  {
    title: 'Five Terminal Tools That Replaced My GUI Workflow',
    href: '/posts/terminal-tools',
    date: '2026-01-09T08:00:00',
  },
  {
    title: 'The Quiet Return of RSS',
    href: '/posts/quiet-return-of-rss',
    date: '2025-12-28T11:15:00',
  },
  {
    title: 'What Self-Hosting Actually Costs in 2026',
    href: '/posts/self-hosting-costs',
    date: '2025-12-19T16:40:00',
  },
];

export const FullSidebar = () => (
  <div className="max-w-xs">
    <Sidebar
      categories={categories}
      tags={tags}
      trendingPosts={trendingPosts}
      author={{
        name: 'Eyad Salah',
        tagline: 'ComputerJy World • Since 2007',
        bio: 'Technologist, software enthusiast, and creator sharing independent tech reviews, fun digital curiosities, and practical guides.',
        avatarUrl: AVATAR,
      }}
    />
  </div>
);
