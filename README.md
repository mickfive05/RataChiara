# RataChiara MVP

Sito statico privacy-first per calcolare e confrontare finanziamenti senza registrazione.
Non usa framework, dipendenze esterne, backend o database.

## Funzioni

- rata mensile con ammortamento alla francese;
- anticipo, TAN e maxi-rata finale;
- spese iniziali, spese mensili e assicurazione;
- costi iniziali pagati subito oppure finanziati;
- TAEG stimato dai flussi di cassa inseriti;
- piano di ammortamento completo;
- grafico del capitale residuo;
- indicatore rata/reddito facoltativo;
- confronto locale di fino a 8 offerte;
- link condivisibile con i parametri della simulazione;
- stampa o salvataggio PDF tramite il browser;
- calcolo inverso dalla rata massima al capitale stimato;
- design responsive per desktop e smartphone.

## Avvio

Il progetto e statico. Per provarlo in locale:

```bash
python3 -m http.server 4173
```

Poi apri `http://localhost:4173`.

## Test dei calcoli

```bash
npm test
```

Non viene installato alcun pacchetto: il test usa il test runner incluso in Node.js.

## Pubblicazione

Carica l'intera cartella su un hosting statico come Netlify, Cloudflare Pages,
GitHub Pages, Vercel o un normale spazio web. Non serve un server applicativo.

## Nota sul TAEG

Il TAEG e una stima informativa calcolata sui costi inseriti dall'utente. Prima
della pubblicazione commerciale, testi legali e inclusione delle voci di costo
vanno verificati in base al modello operativo e alle regole applicabili.
