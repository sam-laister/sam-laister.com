import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { profile } from '../data/profile';
import { metaFor } from '../lib/meta';

export default function Layout() {
  const { pathname } = useLocation();

  // Titles are baked into the prerendered HTML; keep them right on client navigation too
  useEffect(() => {
    const meta = metaFor(pathname);
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }, [pathname]);

  // New page, start at the top (but not when only the search query changes)
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">{profile.name}</Link>
          <nav aria-label="Main">
            <NavLink to="/" end>About</NavLink>
            <NavLink to="/blog/">Writing</NavLink>
          </nav>
        </div>
      </header>
      <main id="main" className="container" key={pathname}>
        <Outlet />
      </main>
      <footer className="site-footer container">
        <span>© {__BUILD_YEAR__} {profile.name}</span>
        <span className="footer-links">
          {profile.links.map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
          <a href="/feed.xml">RSS</a>
        </span>
      </footer>
    </>
  );
}
