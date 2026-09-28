// npm run new-post -- "My post title" --category writeup --tags go,docker
import fs from 'node:fs';
import path from 'node:path';

const CATEGORIES = ['personal', 'writeup', 'project'];
const args = process.argv.slice(2);
const flag = name => {
  const i = args.findIndex(a => a === `--${name}` || a === `-${name[0]}`);
  return i === -1 ? undefined : args.splice(i, 2)[1];
};

const category = flag('category') ?? 'writeup';
const tags = (flag('tags') ?? '').split(',').map(t => t.trim()).filter(Boolean);
const title = args.join(' ').trim();

if (!title) {
  console.error('Usage: npm run new-post -- "Post title" [--category personal|writeup|project] [--tags a,b]');
  process.exit(1);
}
if (!CATEGORIES.includes(category)) {
  console.error(`--category must be one of: ${CATEGORIES.join(', ')}`);
  process.exit(1);
}

const slug = title.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const file = path.resolve(import.meta.dirname, '..', 'posts', `${slug}.md`);
if (fs.existsSync(file)) {
  console.error(`posts/${slug}.md already exists`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(file, `---
title: ${JSON.stringify(title)}
date: ${today}
category: ${category}
summary: ""
tags: [${tags.join(', ')}]
draft: true
---

Write something good.
`);
console.log(`Created posts/${slug}.md (draft: shows in \`npm run dev\`, hidden from the live site until you set draft: false)`);
