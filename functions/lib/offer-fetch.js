import { validatePublicUrl } from './offer-security.js';

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 7000;
const MAX_REDIRECTS = 3;

async function readLimitedText(response) {
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > MAX_BYTES) throw new Error('La pagina è troppo grande da analizzare.');

  if (!response.body?.getReader) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new Error('La pagina è troppo grande da analizzare.');
    return text;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new Error('La pagina è troppo grande da analizzare.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8').decode(merged);
}

export async function fetchOfferHtml(input, redirects = 0) {
  if (redirects > MAX_REDIRECTS) throw new Error('La pagina reindirizza troppe volte.');
  const url = validatePublicUrl(input);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'user-agent': 'RataLab Offer Analyzer/1.0 (+https://ratalab.it)',
        accept: 'text/html,application/xhtml+xml;q=0.9',
      },
    });
  } catch (error) {
    if (controller.signal.aborted) throw new Error('La pagina ha impiegato troppo tempo a rispondere.');
    throw new Error('Non siamo riusciti a raggiungere questo indirizzo.');
  } finally {
    clearTimeout(timer);
  }

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location');
    if (!location) throw new Error('La pagina ha restituito un reindirizzamento non valido.');
    const nextUrl = new URL(location, url).toString();
    validatePublicUrl(nextUrl);
    return fetchOfferHtml(nextUrl, redirects + 1);
  }

  const type = response.headers.get('content-type') || '';
  if (!response.ok || !/text\/html|application\/xhtml\+xml/i.test(type)) {
    const error = new Error(
      response.status === 403 || response.status === 429
        ? 'Non siamo riusciti a leggere automaticamente questa pagina.'
        : 'La pagina non è disponibile in un formato leggibile.'
    );
    if (response.status === 403 || response.status === 429) error.code = 'SOURCE_BLOCKED';
    throw error;
  }

  return {
    html: await readLimitedText(response),
    finalUrl: url.toString(),
  };
}
