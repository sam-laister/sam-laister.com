// npm run new-post -- "My post title" --category writeup --tags go,docker
import fs from 'node:fs';
import path from 'node:path';

const CATEGORIES = ['personal', 'writeup', 'project'];
const args = process.argv.slice(2);
const fail = msg => {
  console.error(msg);
  process.exit(1);
};
// --category / -c and --tags / -t; a flag must be followed by a value
const flag = name => {
  const i = args.findIndex(a => a === `--${name}` || a === `-${name[0]}`);
  if (i === -1) return undefined;
  const value = args[i + 1];
  if (value === undefined || value.startsWith('-')) fail(`${args[i]} needs a value`);
  args.splice(i, 2);
  return value;
};

const category = flag('category') ?? 'writeup';
const tags = (flag('tags') ?? '').split(',').map(t => t.trim()).filter(Boolean);
const title = args.join(' ').trim();

if (!title) fail('Usage: npm run new-post -- "Post title" [--category personal|writeup|project] [--tags a,b]');
if (!CATEGORIES.includes(category)) fail(`--category must be one of: ${CATEGORIES.join(', ')}`);

const slug = title.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (!slug) fail(`"${title}" has no letters or numbers to make a filename from`);
const file = path.resolve(import.meta.dirname, '..', 'posts', `${slug}.md`);
if (fs.existsSync(file)) fail(`posts/${slug}.md already exists`);

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(file, `---
title: ${JSON.stringify(title)}
date: ${today}
category: ${category}
summary: ""                # required before you set draft: false
tags: [${tags.join(', ')}]
draft: true                # drafts only show in npm run dev
---

Write something good.
`);
console.log(`Created posts/${slug}.md (draft: shows in \`npm run dev\`, hidden from the live site until you set draft: false)`);
