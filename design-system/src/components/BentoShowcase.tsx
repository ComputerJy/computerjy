import { CARD_BASE } from '../primitives/Card';
import type { PostSummary } from '../types';

export interface BentoShowcaseProps {
  /** The large 7-column card. */
  featured: PostSummary;
  /** The stacked 5-column column. The site passes three. */
  side: PostSummary[];
  authorName?: string;
  authorAvatarUrl?: string;
}

/** The homepage bento: one large featured card beside a stack of small ones. */
export function BentoShowcase({
  featured,
  side,
  authorName = 'Eyad Salah',
  authorAvatarUrl = '/logo-icon.svg',
}: BentoShowcaseProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
      <article
        className={`lg:col-span-7 ${CARD_BASE} rounded-3xl overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-glow-blue hover:border-brand-blue/40 transition-all duration-300`}
      >
        <a
          href={featured.href}
          className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900 block"
        >
          <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-grad-primary shadow-md">
            {featured.category || 'Featured'}
          </span>
          <img
            src={featured.imageUrl}
            alt={featured.title}
            width="700"
            height="394"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </a>

        <div className="p-6 sm:p-8 flex flex-col flex-grow">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
            <span>{new Date(featured.date).toLocaleDateString('en-GB')}</span>
            <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span>{featured.readingTime || '4 min read'}</span>
            <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span className="text-amber-600 dark:text-brand-amber font-semibold">
              ⭐ Featured Insight
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white mb-3 group-hover:text-brand-blue transition-colors leading-snug">
            <a href={featured.href}>{featured.title}</a>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed">
            {featured.excerpt}
          </p>

          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={authorAvatarUrl}
                alt={authorName}
                width="28"
                height="28"
                loading="lazy"
                decoding="async"
                className="w-7 h-7 rounded-full border border-brand-cyan object-cover"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {authorName}
              </span>
            </div>
            <a
              href={featured.href}
              className="text-xs font-extrabold text-brand-blue flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Read Full Story &rarr;
            </a>
          </div>
        </div>
      </article>

      <div className="lg:col-span-5 flex flex-col gap-4">
        {side.map((post) => (
          <article
            key={post.href}
            className={`${CARD_BASE} p-4 flex gap-4 items-center group hover:border-brand-blue/40 hover:translate-x-1 transition-all duration-200 shadow-xs`}
          >
            <a
              href={post.href}
              className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-900 block"
            >
              <img
                src={post.imageUrl}
                alt={post.title}
                width="96"
                height="80"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </a>
            <div className="flex flex-col flex-grow min-w-0">
              <span className="text-[11px] font-bold text-pink-600 dark:text-brand-pink uppercase tracking-wider mb-1">
                {post.category || 'Tech'}
              </span>
              <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white leading-snug group-hover:text-brand-blue transition-colors line-clamp-2 mb-1.5">
                <a href={post.href}>{post.title}</a>
              </h3>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {new Date(post.date).toLocaleDateString('en-GB')} &bull;{' '}
                {post.readingTime}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
