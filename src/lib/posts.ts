export const CATEGORIES = {
  personal: { label: 'Personal' },
  writeup: { label: 'Write-up' },
  project: { label: 'Project' },
} as const;

export type Category = keyof typeof CATEGORIES;

export interface Post {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: Category;
  summary: string;
  tags: string[];
  draft: boolean;
  readingTime: number;
  html: string;
  text: string;
}

// posts/*.md are turned into Post objects by the markdown plugin in vite.config.ts.
// Drafts come through as null in production builds, so they never reach the bundle.
const modules = import.meta.glob<{ default: Post | null }>('/posts/*.md', { eager: true });

/** Newest first. Drafts only show up in `npm run dev`. */
export const posts: Post[] = Object.values(modules)
  .map(m => m.default)
  .filter((p): p is Post => p !== null)
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

export const getPost = (slug: string) => posts.find(p => p.slug === slug);

export const allTags = [...new Set(posts.flatMap(p => p.tags))].sort();

export function formatDate(date: string, style: 'long' | 'short' = 'long') {
  // UTC so the server-rendered HTML and the browser always agree
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  });
}

export interface Filters {
  q: string;
  category: Category | null;
  tag: string | null;
}

export const queryTerms = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);

/**
 * Every search term has to appear somewhere in the post. Title hits count
 * most, then tags, summary and body. With no search terms, newest first.
 */
export function searchPosts(list: Post[], { q, category, tag }: Filters): Post[] {
  const terms = queryTerms(q);
  const scored: { post: Post; score: number }[] = [];
  for (const post of list) {
    if (category && post.category !== category) continue;
    if (tag && !post.tags.includes(tag)) continue;
    let score = 0;
    const title = post.title.toLowerCase(), summary = post.summary.toLowerCase(), body = post.text.toLowerCase();
    const tags = post.tags.join(' ').toLowerCase();
    const matchesAll = terms.every(t => {
      const s = (title.includes(t) ? 8 : 0) + (tags.includes(t) ? 4 : 0) + (summary.includes(t) ? 2 : 0) + (body.includes(t) ? 1 : 0);
      score += s;
      return s > 0;
    });
    if (matchesAll) scored.push({ post, score });
  }
  if (terms.length) scored.sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date));
  return scored.map(s => s.post);
}
