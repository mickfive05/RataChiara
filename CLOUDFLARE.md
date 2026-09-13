# Cloudflare Pages - funzione “Incolla l’offerta”

La versione precedente dipendeva da `server.js`, quindi funzionava solo con `npm run serve`.
Cloudflare Pages non avvia quel server Node persistente.

La route di produzione ora è una Pages Function:

- `functions/api/offers/analyze.js` -> `POST /api/offers/analyze`

Il frontend non cambia: continua a usare `/api/offers/analyze`.

## Test locale Cloudflare

Dalla root del progetto:

```bash
npm run cf:dev
```

La prima esecuzione di `npx wrangler` può chiedere di installare Wrangler.
Apri l'indirizzo locale indicato da Wrangler e prova `incolla-offerta.html`.

## Deploy

Con il progetto GitHub già collegato a Cloudflare Pages, fai commit e push della cartella `functions/` insieme al resto del progetto.
Cloudflare Pages rileverà e pubblicherà automaticamente la Function.

Non serve eseguire `server.js` in produzione.

## Nota sicurezza

La Function Cloudflare blocca protocolli diversi da HTTP/HTTPS, credenziali nell'URL, localhost e indirizzi IP privati/riservati espressi direttamente nell'URL. Ogni redirect viene rivalidato, sono applicati timeout e limite alla dimensione HTML.

La protezione DNS-pinning usata dal server Node originale (`dns.lookup` + `lookup` custom) non è replicabile nello stesso modo nel runtime Workers senza un servizio di risoluzione esterno. La Function evita comunque destinazioni locali esplicite e Cloudflare Workers non usa il processo Node locale del server originario.
