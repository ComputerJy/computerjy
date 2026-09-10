import { Badge } from '../primitives/Badge';
import { GradientText } from '../primitives/GradientText';

export interface HeroStat {
  value: string;
  label: string;
  /** Controls the value's accent color. */
  tone: 'blue' | 'pink' | 'amber';
}

export interface HeroBannerProps {
  badgeText?: string;
  /** Leading, non-gradient half of the headline. */
  headline?: string;
  /** Trailing half, rendered in the primary gradient. */
  headlineAccent?: string;
  description?: string;
  stats?: HeroStat[];
}

const TONE_CLASS: Record<HeroStat['tone'], string> = {
  blue: 'text-brand-blue',
  pink: 'text-pink-600 dark:text-brand-pink',
  amber: 'text-amber-600 dark:text-brand-amber',
};

const DEFAULT_STATS: HeroStat[] = [
  { value: '500+', label: 'Articles & Tips', tone: 'blue' },
  { value: '18+', label: 'Years Online', tone: 'pink' },
  { value: '100%', label: 'Independent', tone: 'amber' },
];

/** The homepage hero: eyebrow badge, split gradient headline, stat trio. */
export function HeroBanner({
  badgeText = 'Welcome to ComputerJy World',
  headline = 'Entertainment, Tech Tips &',
  headlineAccent = 'Occasional Software Reviews',
  description = 'Exploring independent tech insights, software tools, internet curiosities, and witty observations with an energetic and friendly voice since 2007.',
  stats = DEFAULT_STATS,
}: HeroBannerProps) {
  return (
    <section className="mb-10">
      <div className="relative bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 overflow-hidden shadow-sm transition-colors duration-300 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-grad-primary">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <Badge icon="✦">{badgeText}</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            {headline} <GradientText>{headlineAccent}</GradientText>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            {description}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/60 dark:border-slate-800">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div
                  className={`text-2xl sm:text-3xl font-heading font-black ${TONE_CLASS[stat.tone]}`}
                >
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
