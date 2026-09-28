# sam-laister.com

My portfolio and blog. React + Vite, prerendered to static HTML in `build/` and hosted on GitHub Pages.

## Develop

```sh
npm install
npm run dev       # http://localhost:5173 (drafts are visible here)
npm run build     # static site in build/
npm run preview   # serve build/ like GitHub Pages does
```

## Writing a post

```sh
npm run new-post -- "My post title" --category writeup --tags go,docker
```

That creates `posts/my-post-title.md`:

```md
---
title: "My post title"
date: 2026-09-28
category: writeup        # personal | writeup | project
summary: "One or two sentences, shown in lists and search results."
tags: [go, docker]
draft: true              # drafts only show in `npm run dev`
---

Markdown goes here. Code blocks are syntax highlighted.
```

Set `draft: false` when it's ready, commit and push to `main`. The GitHub Action builds the site and deploys it. The filename becomes the URL: `posts/my-post-title.md` is `/blog/my-post-title`.

Images can go in `public/` (e.g. `public/images/foo.png`) and be used as `![alt](/images/foo.png)`.

## How it fits together

- `posts/*.md` are turned into data at build time by a small plugin in `vite.config.ts` (frontmatter is validated, markdown is rendered and highlighted). No markdown parsing happens in the browser.
- `src/data/profile.ts` holds the homepage content: intro, experience, projects, education.
- `scripts/prerender.js` renders every page to its own `index.html` after the build, plus `404.html`, `sitemap.xml` and `feed.xml` (RSS).
- Search and filters run in the browser and live in the URL (`/blog?q=docker&category=project&tag=go`), so filtered views can be shared.
