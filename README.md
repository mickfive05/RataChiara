# RataLab

Calcolatori nel browser e servizio di lettura annunci. Avvio locale: `npm run serve` (porta 4173). Test: `npm test`.

## Hosting
Il progetto include `functions/api/offers/analyze.js` per Cloudflare Pages. Il server Node locale non viene avviato da Pages. Il semplice upload su un hosting statico privo della funzione non supporta il recupero degli annunci; l’inserimento manuale resta utilizzabile. Verificare la destinazione effettiva nella console prima di pubblicare. Non caricare indiscriminatamente tutta la cartella: escludere report di audit, test, server locale, documentazione e `.wrangler` dagli asset pubblici.

## Verifiche prima del rilascio
Consultare `AUDIT-2026-10-23.md`. L’informativa richiede dati del titolare ancora non ricavabili dal codice. GA viene caricato da `consent.js` solo su evento di consenso Analytics CookieYes; se la CMP non si carica, Analytics rimane disabilitato. Verificare accettazione, rifiuto e revoca in produzione e la configurazione Analytics (inclusi eventi automatici).

Nessuna pubblicazione o richiesta AdSense è stata eseguita nell’audit.
