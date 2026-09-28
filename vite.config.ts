import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

const CATEGORIES = ['personal', 'writeup', 'project'];

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
  {
    renderer: {
      // anchor ids on headings so sections can be linked to
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${depth}>\n`;
      },
    },
  },
);

/**
 * Turns posts/*.md into modules at build time: frontmatter is validated, the
 * body is rendered to HTML (with syntax highlighting), and a plain-text copy
 * is kept for search. Nothing markdown-related ships to the browser.
 */
function posts(): Plugin {
  return {
    name: 'markdown-posts',
    transform(src, id) {
      if (!id.endsWith('.md')) return;
      const slug = path.basename(id, '.md');
      const { data, content } = matter(src);
      const fail = (msg: string) => this.error(`posts/${slug}.md: ${msg}`);

      if (!data.title) fail('missing "title"');
      if (!data.summary && !data.draft) fail('missing "summary" (only drafts can skip it)');
      if (!(data.date instanceof Date)) fail('"date" must be a date like 2026-09-28');
      if (!CATEGORIES.includes(data.category)) fail(`"category" must be one of: ${CATEGORIES.join(', ')}`);

      const html = marked.parse(content) as string;
      const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
      const post = {
        slug,
        title: String(data.title),
        date: data.date.toISOString().slice(0, 10),
        category: data.category,
        summary: String(data.summary ?? ''),
        tags: (data.tags ?? []).map(String),
        draft: Boolean(data.draft),
        readingTime: Math.max(1, Math.round(text.split(' ').length / 220)),
        html,
        text,
      };
      return { code: `export default ${JSON.stringify(post)};`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [react(), posts()],
  build: { outDir: 'build', emptyOutDir: true },
});
