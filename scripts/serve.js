// Serves build/ the way GitHub Pages does: /blog -> /blog/ -> blog/index.html,
// and 404.html for anything missing. (`vite preview` would serve the home page
// for every route, which doesn't match the prerendered pages.)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'build');
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.xml': 'application/xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) {
      return res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
    }
    file = path.join(file, 'index.html');
  }
  const found = fs.existsSync(file);
  const served = found ? file : path.join(root, '404.html');
  res.writeHead(found ? 200 : 404, { 'Content-Type': types[path.extname(served)] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(served));
}).listen(port, () => console.log(`Serving build/ at http://localhost:${port}`));
