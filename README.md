# RataLab

Calcolatori informativi sul finanziamento e strumento per leggere i dati pubblici di un annuncio auto.

## Sviluppo

- `npm test` crea gli asset pubblici in `dist/` ed esegue i test.
- `npm run serve` avvia il server Node locale sulla porta 4173.
- `npm run cf:dev` crea gli asset e avvia il Worker con Wrangler.
- `npm run deploy` crea gli asset e pubblica il Worker con Wrangler.

## Hosting

La produzione è configurata per **Cloudflare Workers Static Assets**. Il Worker in `worker.js` gestisce `/api/offers/analyze`; le pagine e le risorse sono copiate in `dist/` da una allowlist in `scripts/build.mjs`. Usa la root del repository come project directory. In Workers Builds configura `npm run build` come build command e `npx wrangler@latest deploy` come deploy command. La vecchia cartella `RataChiara-MVP/` non è la sorgente del deploy.

La copia in `dist/` esclude test, report, documentazione, server Node locale e codice server non destinato al browser. Non committare `dist/`, `.wrangler/`, `node_modules/` o file `.env`.

Consulta [CLOUDFLARE.md](CLOUDFLARE.md) per la configurazione e [AUDIT-2026-10-23.md](AUDIT-2026-10-23.md) per le verifiche del sito. In produzione vanno ancora provati consenso e revoca CookieYes, richieste API e log del Worker; i test automatici non certificano la configurazione dell'account Cloudflare o le fonti esterne degli annunci.

## Guide e contenuti

Le guide si scrivono in Markdown in `content/guides/*.md` (frontmatter con slug, titolo, descrizione, categoria, data e guide correlate). Le tabelle con `{{rate-table ...}}`, `{{cost-table ...}}`, `{{schedule ...}}` e `{{example-costs ...}}` vengono calcolate con `finance.js`, le stesse formule del calcolatore.

- `npm run generate` rigenera le pagine HTML delle guide, `guide.html`, `sitemap.xml` e allinea head (consenso + AdSense), navigazione e footer delle pagine scritte a mano.
- Le pagine generate sono committate nella root: il deploy non cambia.
