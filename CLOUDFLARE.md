# Deploy RataLab su Cloudflare Workers

Il progetto Cloudflare mostrato in dashboard è un **Worker**, non una Pages Function indipendente. La configurazione di questo repository usa quindi `worker.js` come entrypoint e pubblica gli asset statici generati in `dist/`.

## Build e test

```bash
npm test
```

Il comando genera `dist/` con una lista esplicita di sole pagine e risorse pubbliche, poi esegue i test. Report, documentazione interna, test, codice Node locale e la cartella duplicata `RataChiara-MVP/` non vengono copiati negli asset pubblicati.

Per provare il Worker localmente:

```bash
npm run cf:dev
```

Il comando compila gli asset e avvia Wrangler. Prova almeno `/`, `/chi-siamo`, `/api/offers/analyze` con POST e la pagina `incolla-offerta`.

## Collegamento Git in Cloudflare

Imposta la directory del progetto sulla **root del repository**. In Workers Builds usa:

- Build command: `npm run build`
- Deploy command: `npx wrangler@latest deploy`

La configurazione `wrangler.jsonc` collega il binding `ASSETS`, serve le pagine HTML senza `.html` e manda `/api/*` al Worker. `worker.js` inoltra l'analisi annunci alla funzione condivisa in `functions/api/offers/analyze.js`; le altre richieste sono servite dagli asset.

Non configurare questo repository come Pages project e non selezionare `RataChiara-MVP/` come directory di progetto: è una copia storica incompleta. `dist/` è generata dal build e non va aggiunta a Git.

## Sicurezza dell'analisi annunci

La funzione rifiuta protocolli diversi da HTTP/HTTPS, credenziali nell'URL, hostname locali e indirizzi IPv4/IPv6 non pubblici, inclusi IPv4-mapped IPv6. Ogni redirect viene rivalidato, con timeout e limite alla dimensione HTML. Il runtime Workers non offre lo stesso controllo DNS/pinning del server Node locale: i controlli applicativi non possono garantire da soli la protezione da DNS rebinding. Per questo l'endpoint deve recuperare solo HTML pubblico e non deve ricevere credenziali o dati riservati.

Prima del deploy, verifica nel pannello Cloudflare che il progetto sia il Worker `ratalab`, che il binding asset sia gestito da Wrangler e che i log siano consultabili. Dopo il deploy controlla gli status HTTP e gli errori runtime per le route principali.
