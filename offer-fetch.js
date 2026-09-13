import http from 'node:http';
import https from 'node:https';
import { validatePublicUrl } from './offer-security.js';

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 7000;
export async function fetchOfferHtml(input, redirects = 0) {
  if (redirects > 3) throw new Error('La pagina reindirizza troppe volte.');
  const { url, addresses } = await validatePublicUrl(input);
  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const resolved = addresses[0];
    const lookup = (_hostname, options, callback) => {
      if (options?.all) return callback(null, addresses);
      return callback(null, resolved.address, resolved.family);
    };
    const request = client.get(url, { headers: { 'user-agent': 'RataLab Offer Analyzer/1.0 (+https://ratalab.it)' }, timeout: TIMEOUT_MS, lookup }, async (response) => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
        response.resume();
        try { resolve(await fetchOfferHtml(new URL(response.headers.location, url).toString(), redirects + 1)); } catch (error) { reject(error); }
        return;
      }
      const type = response.headers['content-type'] || '';
      if (status !== 200 || !/text\/html|application\/xhtml\+xml/i.test(type)) {
        response.resume();
        const error = new Error(status === 403 || status === 429 ? 'Non siamo riusciti a leggere automaticamente questa pagina.' : 'La pagina non è disponibile in un formato leggibile.');
        if (status === 403 || status === 429) error.code = 'SOURCE_BLOCKED';
        reject(error);
        return;
      }
      const chunks = []; let size = 0;
      response.on('data', (chunk) => { size += chunk.length; if (size > MAX_BYTES) request.destroy(new Error('La pagina è troppo grande da analizzare.')); else chunks.push(chunk); });
      response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8'), finalUrl: url.toString() }));
    });
    request.on('timeout', () => request.destroy(new Error('La pagina ha impiegato troppo tempo a rispondere.')));
    request.on('error', reject);
  });
}
