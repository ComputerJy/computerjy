import { useState } from 'react';
import type { FormEvent } from 'react';
import { CARD_BASE } from '../primitives/Card';
import type { TermSummary, TrendingItem } from '../types';

export interface SidebarAuthor {
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
}

export interface SidebarSocialLink {
  label: string;
  href: string;
  /** SVG path data for a 24×24 viewBox. */
  iconPath: string;
}

export interface SidebarProps {
  categories: TermSummary[];
  tags: TermSummary[];
  /** Only the first four are rendered. */
  trendingPosts: TrendingItem[];
  author?: SidebarAuthor;
  socialLinks?: SidebarSocialLink[];
  /** Called with the submitted email. Defaults to a no-op. */
  onSubscribe?: (email: string) => void;
}

const DEFAULT_AUTHOR: SidebarAuthor = {
  name: 'Eyad Salah',
  tagline: 'ComputerJy World • Since 2007',
  bio: 'Technologist, software enthusiast, and creator sharing independent tech reviews, fun digital curiosities, and practical guides.',
  avatarUrl: '/logo-icon.svg',
};

const DEFAULT_SOCIALS: SidebarSocialLink[] = [
  {
    label: 'X / Twitter',
    href: 'https://x.com/ComputerJy',
    iconPath:
      'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/computerjy',
    iconPath:
      'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/computerjy',
    iconPath:
      'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.45 1.45 0 0 0 1.45 1.45m1.37 9.74v-8.37H5.09v8.37h2.74z',
  },
];

const SECTION_CLASS = `${CARD_BASE} p-6 shadow-xs`;

const SECTION_HEADING_CLASS =
  'font-heading font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800';

const SOCIAL_CLASS =
  'w-8 h-8 rounded-full flex items-center justify-center bg-light-subtle dark:bg-dark-subtle border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-blue hover:text-white transition-all';

/** The article sidebar: author card, trending list, categories, tags, newsletter. */
export function Sidebar({
  categories,
  tags,
  trendingPosts,
  author = DEFAULT_AUTHOR,
  socialLinks = DEFAULT_SOCIALS,
  onSubscribe,
}: SidebarProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubscribe?.(email);
    setEmail('');
  };

  return (
    <div className="flex flex-col gap-8">
      <section
        className={`${CARD_BASE} p-6 text-center shadow-xs transition-colors duration-300 relative overflow-hidden`}
      >
        <div className="h-16 bg-grad-primary -mx-6 -mt-6 mb-0" />
        <img
          src={author.avatarUrl}
          alt={author.name}
          width="80"
          height="80"
          loading="lazy"
          decoding="async"
          className="w-20 h-20 rounded-full border-4 border-white dark:border-dark-surface mx-auto -mt-10 mb-3 bg-white dark:bg-dark-surface shadow-sm object-cover"
        />
        <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white mb-0.5">
          {author.name}
        </h3>
        <div className="text-xs font-bold text-brand-blue mb-3">
          {author.tagline}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {author.bio}
        </p>
        <div className="flex items-center justify-center gap-2">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={SOCIAL_CLASS}
              aria-label={link.label}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d={link.iconPath} />
              </svg>
            </a>
          ))}
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className={SECTION_HEADING_CLASS}>
          <span>🔥 Trending Insights</span>
        </h3>
        <div className="flex flex-col gap-4">
          {trendingPosts.slice(0, 4).map((post, idx) => (
            <article
              key={post.href}
              className="grid grid-cols-[28px_1fr] gap-3 items-start group"
            >
              <span className="font-heading font-black text-lg text-gradient leading-none">
                0{idx + 1}
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-blue transition-colors leading-snug line-clamp-2 mb-1">
                  <a href={post.href}>{post.title}</a>
                </h4>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {new Date(post.date).toLocaleDateString('en-GB')}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className={SECTION_HEADING_CLASS}>
          <span>📂 Categories</span>
        </h3>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <a
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-light-subtle dark:bg-dark-subtle text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-blue hover:text-white transition-all group"
            >
              <span>{cat.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white dark:bg-dark-surface text-slate-600 dark:text-slate-400 group-hover:text-brand-blue font-bold">
                {cat.count}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <h3 className={SECTION_HEADING_CLASS}>
          <span>🏷️ Popular Tags</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <a
              key={tag.slug}
              href={`/tag/${tag.slug}`}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-light-subtle dark:bg-dark-subtle text-slate-600 dark:text-slate-400 hover:bg-brand-blue hover:text-white transition-all"
            >
              #{tag.name}
            </a>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-brand-cyan/10 to-brand-purple/10 border border-brand-cyan/30 rounded-2xl p-6 text-center shadow-xs">
        <span className="text-2xl block mb-2">✨</span>
        <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mb-1">
          Join the Community
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          Get fresh tech tips, software discoveries &amp; insights weekly.
        </p>
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            className="w-full py-2 text-xs font-bold rounded-lg text-white bg-grad-primary hover:shadow-glow-blue transition-all"
          >
            Join Free 🚀
          </button>
        </form>
      </section>
    </div>
  );
}
