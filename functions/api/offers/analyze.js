import { fetchOfferHtml } from '../../lib/offer-fetch.js';
import { parseOfferPage } from '../../lib/offer-parser.js';

const clients = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_BODY_BYTES = 10_000;

function extractUrlFromText(value) {
  if (typeof value !== 'string') return '';

  const match = value.match(/https?:\/\/[^\s]+/i);

  if (!match) return value.trim();

  const url = match[0]
    .replace(/[),.!?;:'"]+$/g, '')
    .trim();

  // `]` closes an IPv6 literal such as https://[2001:db8::1]/path.
  // Keep it when it is paired with an opening bracket; discard only a stray one.
  if ((url.match(/\[/g) || []).length < (url.match(/\]/g) || []).length) {
    return url.replace(/\]+$/g, '').trim();
  }

  return url;
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function limited(request) {
  const key = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const seen = (clients.get(key) || []).filter((time) => now - time < WINDOW_MS);
  seen.push(now);
  clients.set(key, seen);
  return seen.length > MAX_REQUESTS;
}

export async function onRequestPost(context) {
  if (limited(context.request)) {
    return json({ error: 'Attendi un momento prima di analizzare un altro link.' }, 429);
  }

  try {
    const raw = await context.request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json({ error: 'Richiesta troppo grande.' }, 413);
    }

    let payload;
    try {
      payload = JSON.parse(raw || '{}');
    } catch {
      return json({ error: 'Richiesta non valida.' }, 400);
    }

    const offerUrl = extractUrlFromText(payload?.url);
    if (typeof offerUrl !== 'string' || !offerUrl.trim()) {
      return json({ error: 'Inserisci un link valido.' }, 422);
    }

    const page = await fetchOfferHtml(offerUrl.trim());
    const data = parseOfferPage(page.html, page.finalUrl);
    return json({ data }, 200);
  } catch (error) {
    return json(
      {
        error: error?.message || 'Non siamo riusciti a leggere automaticamente questa pagina.',
        code: error?.code || null,
      },
      422
    );
  }
}

export function onRequest(context) {
  return json({ error: 'Metodo non consentito.' }, 405);
}
