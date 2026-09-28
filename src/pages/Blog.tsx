import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { CATEGORIES, posts, queryTerms, searchPosts, type Category } from '../lib/posts';
import { useHydrated } from '../lib/useHydrated';
import PostList from '../components/PostList';

const isCategory = (c: string | null): c is Category => !!c && c in CATEGORIES;
const FROM_SEARCH = { fromSearch: true };

export default function Blog() {
  const [params, setParams] = useSearchParams();
  const hydrated = useHydrated();
  const input = useRef<HTMLInputElement>(null);

  const location = useLocation();

  // The prerendered page is unfiltered; apply ?q= / ?category= / ?tag= once in the browser.
  // The search text lives in state (the URL lags behind fast typing) and is mirrored to ?q=.
  // The first sync after mount always reads ?q= (Back and reload restore history.state, so the
  // marker can still be there). After that, skip our own FROM_SEARCH updates, and re-read ?q=
  // on any other navigation (e.g. the header's "Blog" link, which doesn't remount this page).
  const [q, setQ] = useState('');
  const synced = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    const fromSearch = (location.state as { fromSearch?: boolean } | null)?.fromSearch;
    if (!synced.current || !fromSearch) setQ(params.get('q') ?? '');
    synced.current = true;
  }, [hydrated, location.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const categoryParam = hydrated ? params.get('category') : null;
  const category = isCategory(categoryParam) ? categoryParam : null;
  const tag = hydrated ? params.get('tag') : null;

  const results = useMemo(() => searchPosts(posts, { q, category, tag }), [q, category, tag]);
  const terms = queryTerms(q);
  const filtered = Boolean(q || category || tag);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true, state: FROM_SEARCH });
  };

  // "/" jumps to search, Escape clears it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]');
      if (e.key === '/' && !typing) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of posts) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, []);

  // Group by year when browsing; flat, relevance-ordered list when searching
  const groups = useMemo(() => {
    if (terms.length) return [{ year: null, posts: results }];
    const byYear = new Map<string, typeof results>();
    for (const p of results) byYear.set(p.date.slice(0, 4), [...(byYear.get(p.date.slice(0, 4)) ?? []), p]);
    return [...byYear].map(([year, list]) => ({ year, posts: list }));
  }, [results, terms.length]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Blog</h1>
        <p className="lede">Write-ups, projects and the occasional personal post.</p>
      </header>

      <div className="search" role="search">
        <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={input}
          type="search"
          placeholder="Search posts"
          aria-label="Search posts"
          value={q}
          onChange={e => { setQ(e.target.value); update('q', e.target.value); }}
          onKeyDown={e => { if (e.key === 'Escape') { setQ(''); update('q', null); e.currentTarget.blur(); } }}
        />
        {!q && <kbd aria-hidden="true">/</kbd>}
      </div>

      <div className="filters" role="group" aria-label="Filter by category">
        <button type="button" aria-pressed={!category} onClick={() => update('category', null)}>
          All <span className="count">{posts.length}</span>
        </button>
        {(Object.keys(CATEGORIES) as Category[]).map(c => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            style={{ '--c': CATEGORIES[c].color } as React.CSSProperties}
            onClick={() => update('category', category === c ? null : c)}
          >
            <span className="badge-dot" aria-hidden="true" />
            {CATEGORIES[c].label} <span className="count">{counts[c] ?? 0}</span>
          </button>
        ))}
        {tag && (
          <button type="button" className="tag-filter" aria-pressed="true" onClick={() => update('tag', null)}>
            #{tag} <span aria-label="Remove tag filter">×</span>
          </button>
        )}
      </div>

      <p className="result-count" aria-live="polite">
        {filtered ? `${results.length} of ${posts.length} posts` : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`}
        {filtered && (
          <button type="button" className="link-button" onClick={() => { setQ(''); setParams({}, { replace: true, preventScrollReset: true, state: FROM_SEARCH }); }}>
            Clear filters
          </button>
        )}
      </p>

      {results.length === 0 ? (
        <div className="empty">
          {posts.length === 0 ? 'No posts yet. Check back soon.' : 'Nothing matches that. Try another search or filter.'}
        </div>
      ) : (
        groups.map(g => (
          <section key={g.year ?? 'results'} className="year-group">
            {g.year && <h2 className="label">{g.year}</h2>}
            <PostList posts={g.posts} terms={terms} />
          </section>
        ))
      )}
    </div>
  );
}
