import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const publicFiles = [
  'styles.css',
  'app.js',
  'approval.js',
  'consent.js',
  'finance.js',
  'offer-calculator.js',
  'offer-page.js',
  'quote-check.js',
  'theme.js',
  'favicon.svg',
  'favicon.png',
  'ads.txt',
  'robots.txt',
  'sitemap.xml',
];

const sourceFiles = await readdir(root, { withFileTypes: true });
const pages = sourceFiles
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => entry.name);
const files = [...pages, ...publicFiles];

for (const file of files) {
  const source = path.join(root, file);
  const info = await stat(source).catch(() => null);
  if (!info?.isFile()) throw new Error(`File pubblico richiesto mancante: ${file}`);
}

if (output !== path.join(root, 'dist') || path.dirname(output) !== root) {
  throw new Error('Percorso di output non sicuro.');
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) await cp(path.join(root, file), path.join(output, file));

console.log(`Build RataLab completata: ${files.length} asset pubblici in dist/.`);
