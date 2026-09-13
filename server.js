import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchOfferHtml } from './offer-fetch.js';
import { parseOfferPage } from './offer-parser.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml; charset=utf-8' };
const clients = new Map();
function limited(request) {
  const key = request.socket.remoteAddress || 'unknown'; const now = Date.now();
  const seen = (clients.get(key) || []).filter((time) => now - time < 60_000);
  seen.push(now); clients.set(key, seen); return seen.length > 12;
}
function send(response, status, body) { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(body)); }

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  if (request.method === 'POST' && url.pathname === '/api/offers/analyze') {
    if (limited(request)) return send(response, 429, { error: 'Attendi un momento prima di analizzare un altro link.' });
    let raw = '';
    request.on('data', (chunk) => { raw += chunk; if (raw.length > 10_000) request.destroy(); });
    request.on('end', async () => {
      try {
        const { url: offerUrl } = JSON.parse(raw); if (typeof offerUrl !== 'string') throw new Error('Inserisci un link valido.');
        const page = await fetchOfferHtml(offerUrl);
        return send(response, 200, { data: parseOfferPage(page.html, page.finalUrl) });
      } catch (error) { return send(response, 422, { error: error.message || 'Non siamo riusciti a leggere automaticamente questa pagina.', code: error.code || null }); }
    });
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const target = path.resolve(root, `.${requested}`);
  if (!target.startsWith(root)) { response.writeHead(403).end(); return; }
  try {
    const info = await stat(target); if (!info.isFile()) throw new Error('not file');
    response.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream' });
    if (request.method === 'HEAD') return response.end();
    createReadStream(target).pipe(response);
  } catch { response.writeHead(404).end('Not found'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, () => console.log(`RataLab disponibile su http://localhost:${port}`));
