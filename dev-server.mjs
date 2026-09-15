import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon'
};

async function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/\\/g, '/');
  const relative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/, '');
  let file = resolve(join(root, relative || 'index.html'));
  if (!file.startsWith(root) || file.split('/').some((part) => part.startsWith('.') && part !== '.well-known')) return null;
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const file = await resolveFile(url.pathname);
  const target = file || join(root, '404.html');
  try {
    const body = await readFile(target);
    response.writeHead(file ? 200 : 404, {
      'Content-Type': types[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
}).listen(port, host, () => {
  console.log(`Tech Study Adda preview running on http://${host}:${port}`);
});
