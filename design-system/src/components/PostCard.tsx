import { CARD_BASE, CARD_INTERACTIVE } from '../primitives/Card';
import type { PostSummary } from '../types';

export interface PostCardProps extends PostSummary {
  /** Byline name. Defaults to the site author. */
  authorName?: string;
  /** Byline avatar. Defaults to the site logo mark. */
  authorAvatarUrl?: string;
}

/** The standard feed card: image, category chip, meta row, excerpt, byline. */
export function PostCard({
  title,
  href,
  imageUrl,
  excerpt,
  date,
  readingTime,
  category,
  authorName = 'Eyad Salah',
  authorAvatarUrl = '/logo-icon.svg',
}: PostCardProps) {
  return (
    <article
      className={`feed-card-deferred ${CARD_BASE} overflow-hidden flex flex-col ${CARD_INTERACTIVE}`}
    >
      <a
        href={href}
        className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900 block"
      >
        <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-grad-primary shadow-sm">
          {category}
        </span>
        <img
          src={imageUrl}
          alt={title}
          width="400"
          height="250"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </a>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <time dateTime={date}>
            {new Date(date).toLocaleDateString('en-GB')}
          </time>
          <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
          <span>{readingTime}</span>
        </div>

        <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-brand-blue transition-colors">
          <a href={href}>{title}</a>
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
          {excerpt}
        </p>

        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={authorAvatarUrl}
              alt={authorName}
              width="24"
              height="24"
              loading="lazy"
              decoding="async"
              className="w-6 h-6 rounded-full border border-brand-cyan object-cover"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {authorName}
            </span>
          </div>
          <a
            href={href}
            className="text-xs font-bold text-brand-blue flex items-center gap-1 group-hover:gap-1.5 transition-all"
          >
            Read &rarr;
          </a>
        </div>
      </div>
    </article>
  );
}
