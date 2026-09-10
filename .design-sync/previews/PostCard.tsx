import { PostCard } from '@computerjy/design-system';
import { AVATAR, POST } from './_fixtures';

export const Default = () => (
  <div className="max-w-sm">
    <PostCard {...POST} authorAvatarUrl={AVATAR} />
  </div>
);

export const InAFeedGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <PostCard {...POST} authorAvatarUrl={AVATAR} />
    <PostCard
      {...POST}
      title="Five Terminal Tools That Replaced My GUI Workflow"
      href="/posts/terminal-tools"
      category="Guides"
      readingTime="4 min read"
      authorAvatarUrl={AVATAR}
    />
    <PostCard
      {...POST}
      title="The Quiet Return of RSS"
      href="/posts/quiet-return-of-rss"
      category="Internet"
      readingTime="3 min read"
      authorAvatarUrl={AVATAR}
    />
  </div>
);
