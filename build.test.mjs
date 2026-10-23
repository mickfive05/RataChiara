import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist');

test('build publishes the site but not repository-only files', async () => {
  const files = new Set(await readdir(dist));

  for (const file of ['index.html', 'chi-siamo.html', 'incolla-offerta.html', 'styles.css', 'ads.txt', 'robots.txt', 'sitemap.xml']) {
    assert.ok(files.has(file), `asset pubblico mancante: ${file}`);
  }

  for (const file of ['AUDIT-2026-10-23.md', 'CLOUDFLARE.md', 'PLACEHOLDER-LEGALI.txt', 'README.md', 'server.js', 'worker.test.mjs', 'package.json']) {
    assert.ok(!files.has(file), `file interno pubblicato per errore: ${file}`);
  }
});
