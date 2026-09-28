// Runs after `vite build`: renders every route to static HTML in build/, so
// each page (and each blog post) is a real file GitHub Pages can serve, with
// its own title and description. Also writes 404.html, sitemap.xml and feed.xml.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'build');
const ssrDir = path.join(root, '.ssr');
const { render, metaFor, posts, SITE_URL, profile } = await import(path.join(ssrDir, 'entry-server.js'));

const template = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function page(url, file) {
  const meta = metaFor(url);
  const head = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:url" content="${SITE_URL}${url}" />`,
    `<meta name="twitter:card" content="summary" />`,
    file !== '404.html' ? `<link rel="canonical" href="${SITE_URL}${url}" />` : '',
  ].filter(Boolean).join('\n    ');
  const html = template.replace('<!--app-head-->', head).replace('<!--app-html-->', render(url));
  const dest = path.join(out, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

const routes = ['/', '/blog', ...posts.map(p => `/blog/${p.slug}`)];
for (const url of routes) page(url, url === '/' ? 'index.html' : `${url.slice(1)}/index.html`);
page('/404', '404.html');

fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(u => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}
</urlset>
`);

fs.writeFileSync(path.join(out, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(profile.name)}</title>
    <link>${SITE_URL}/blog</link>
    <description>Write-ups, projects and personal posts by ${esc(profile.name)}.</description>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${posts.map(p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid>${SITE_URL}/blog/${p.slug}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
      <category>${p.category}</category>
      <description>${esc(p.summary)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`);

fs.rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerendered ${routes.length} pages + 404, sitemap.xml, feed.xml`);
