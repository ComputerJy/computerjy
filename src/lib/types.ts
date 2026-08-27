export interface WPPost {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  date: string;
  modified: string;
  categories: number[];
  tags: number[];
  featured_media?: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text?: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
      taxonomy: string;
    }>>;
    author?: Array<{
      id: number;
      name: string;
      description?: string;
      avatar_urls?: {
        [key: string]: string;
      };
    }>;
  };
  // Processed helper fields
  readingTime?: string;
  primaryCategory?: {
    name: string;
    slug: string;
  };
  featuredImageUrl?: string;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description: string;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}
