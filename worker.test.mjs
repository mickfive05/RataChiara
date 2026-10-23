import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';

const assets = {
  fetch: async (request) => new Response(`asset:${new URL(request.url).pathname}`, { status: 200 }),
};

test('serves ordinary requests from the static asset binding', async () => {
  const response = await worker.fetch(new Request('https://ratalab.it/chi-siamo'), { ASSETS: assets });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'asset:/chi-siamo');
});

test('routes offer analysis POST through the Cloudflare handler', async () => {
  const request = new Request('https://ratalab.it/api/offers/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'http://[::ffff:a9fe:a9fe]' }),
  });
  const response = await worker.fetch(request, { ASSETS: assets });
  assert.equal(response.status, 422);
  assert.match((await response.json()).error, /indirizzo/);
});

test('rejects unsupported methods on the analysis route', async () => {
  const response = await worker.fetch(new Request('https://ratalab.it/api/offers/analyze'), { ASSETS: assets });
  assert.equal(response.status, 405);
  assert.equal((await response.json()).error, 'Metodo non consentito.');
});
