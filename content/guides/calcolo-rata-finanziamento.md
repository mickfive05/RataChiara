---
slug: calcolo-rata-finanziamento
title: Come si calcola la rata di un finanziamento: formula, esempi e tabella
short: Calcolo della rata
seoTitle: Calcolo rata finanziamento: formula, esempi e tabella | RataLab
description: La formula della rata costante spiegata passo per passo, con esempi numerici, una tabella per durate e tassi diversi e gli errori da evitare.
lead: La rata mensile dipende da tre numeri: quanto chiedi, per quanto tempo e a quale tasso. Qui vedi la formula usata da banche e finanziarie, come applicarla a mano e perché una rata più bassa può costare molto di più.
card: La formula della rata costante, un esempio svolto passo per passo e una tabella pronta per durate e tassi diversi.
category: Le basi
order: 1
updated: 2026-11-16
related: piano-ammortamento-francese, costo-totale-del-credito, tan-vs-taeg, rata-prestito-10000-euro
sources: [Banca d’Italia, credito ai consumatori](https://economiapertutti.bancaditalia.it/aree-tematiche/prestiti/credito-ai-consumatori/)
---
:::summary
- Quasi tutti i prestiti personali e i finanziamenti auto in Italia usano la **rata costante** (ammortamento "alla francese").
- La rata si calcola con una formula che lega capitale, tasso mensile e numero di rate.
- Allungare la durata abbassa la rata ma **aumenta gli interessi totali**: va sempre guardato anche il totale da restituire.
- Spese di istruttoria, incasso rata e assicurazioni non entrano nella formula della rata pura ma pesano sul costo reale, misurato dal TAEG.
:::

## Le tre variabili che determinano la rata

Prima di qualsiasi formula conviene avere chiaro da cosa dipende la rata:

- **Capitale finanziato (C):** la somma che ricevi o che il finanziatore paga al venditore al posto tuo. Se versi un anticipo, il capitale è il prezzo meno l'anticipo. Se alcune spese vengono "finanziate", cioè aggiunte al prestito, il capitale aumenta.
- **Tasso di interesse (TAN):** il tasso annuo nominale scritto nel contratto. Per il calcolo si usa il tasso mensile, cioè il TAN diviso per 12.
- **Numero di rate (n):** la durata espressa in mesi. Un prestito di 5 anni ha 60 rate mensili.

Una quarta variabile può cambiare tutto: la **maxi rata finale**, frequente nei finanziamenti auto. Ne parliamo nella guida dedicata alla [maxi rata finale](maxi-rata-finale.html).

## La formula della rata costante

Con l'ammortamento alla francese tutte le rate hanno lo stesso importo. La formula è:

**Rata = C × i / (1 − (1 + i)^−n)**

dove **C** è il capitale, **i** il tasso mensile (TAN / 12 / 100) e **n** il numero di rate.

La formula nasce da un'idea semplice: il valore attuale di tutte le rate future, scontate al tasso del prestito, deve essere uguale al capitale ricevuto oggi. Per questo la stessa formula viene usata in tutto il mondo per prestiti personali, finanziamenti e mutui a rata costante.

## Esempio svolto passo per passo

:::example Esempio di calcolo
Prendiamo un prestito di **10.000 €** in **60 mesi** con **TAN 8%**.

1. Tasso mensile: 8 / 12 / 100 = 0,006667.
2. (1 + 0,006667) elevato a −60 = circa 0,6712.
3. Denominatore: 1 − 0,6712 = 0,3288.
4. Numeratore: 10.000 × 0,006667 = 66,67.
5. Rata: 66,67 / 0,3288 = **202,76 €** al mese.

In totale restituisci 60 × 202,76 = **12.165,84 €**, di cui **2.165,84 €** di interessi.
:::

Se non vuoi fare i conti a mano, puoi [aprire questo esempio nel calcolatore](index.html?importo=10000&anticipo=0&mesi=60&tan=8&istruttoria=0&spese_rata=0&assicurazione=0&maxirata=0&costi_finanziati=0#calcolatore) e modificare i valori.

## Quanto cambia la rata con durata e tasso

La tabella mostra la rata per un prestito di 10.000 € con durate e tassi diversi, calcolata con la stessa formula. Ogni cifra apre il calcolatore con quei parametri.

{{rate-table amount=10000 tans=5,7,9,11 months=24,36,48,60,72,84}}

Leggendo la tabella per colonne si nota che raddoppiare la durata non dimezza la rata: passando da 36 a 72 mesi al 9% la rata scende di circa il 43%, perché gli interessi continuano a maturare sul debito che resta in piedi più a lungo.

## Rata più bassa non vuol dire prestito più conveniente

L'errore più comune è scegliere un finanziamento guardando solo la rata. Lo stesso prestito di 10.000 € al TAN 8% costa in modo molto diverso a seconda della durata:

{{cost-table amount=10000 tan=8 months=36,60,84}}

Con 84 rate paghi circa 47 € in meno al mese rispetto a 60 rate, ma alla fine versi quasi **930 € in più di interessi**. Una durata lunga ha senso se serve a rendere la rata sostenibile, non come scelta automatica.

## Cosa la formula non considera

La formula restituisce la cosiddetta "rata pura", cioè capitale più interessi. Nella realtà il preventivo può contenere altre voci:

- **spese di istruttoria** pagate subito o aggiunte al capitale;
- **spese di incasso rata**, spesso 1–4 € per ogni rata;
- **imposta di bollo** o sostitutiva;
- **polizze assicurative**, obbligatorie o facoltative;
- **maxi rata finale**.

Queste voci non cambiano il TAN ma aumentano il costo effettivo, misurato dal **TAEG**. Ecco lo stesso prestito con e senza spese:

{{example-costs amount=10000 months=48 tan=8 istruttoria=300 spese=3}}

Per capire quale tasso guardare leggi la guida [TAN e TAEG](tan-vs-taeg.html); per sommare tutte le voci quella sul [costo totale del credito](costo-totale-del-credito.html).

## Come verificare la rata di un preventivo

1. Prendi dal preventivo o dal SECCI importo finanziato, TAN e numero di rate.
2. Calcola la rata pura con la formula o con il [calcolatore](index.html#calcolatore).
3. Confrontala con la rata indicata. Se quella del preventivo è più alta, la differenza è dovuta a spese mensili, costi finanziati o polizze inserite nella rata.
4. Chiedi per iscritto a cosa corrisponde la differenza. Se è un servizio facoltativo, valuta se ti serve davvero.

Per un controllo completo puoi usare lo strumento [Controlla preventivo](controlla-preventivo.html), che ricostruisce costo e tasso effettivo dai numeri che hai già.

## Domande frequenti

### Come si calcola la rata di un prestito a mano?
Dividi il TAN per 12 e per 100 per ottenere il tasso mensile i, poi applica la formula Rata = C × i / (1 − (1 + i)^−n). Con 10.000 € a 60 mesi e TAN 8% la rata è 202,76 €.

### La rata di un finanziamento è sempre uguale?
Nei prestiti a tasso fisso con ammortamento alla francese sì, salvo spese variabili o maxi rata finale. Nei prestiti a tasso variabile la rata cambia quando cambia il parametro di riferimento.

### Perché la mia rata è più alta di quella calcolata?
Di solito perché nella rata sono comprese spese di incasso, polizze assicurative o costi iniziali aggiunti al capitale. Il SECCI elenca tutte le voci: confrontalo con il calcolo della rata pura.

### Conviene allungare la durata per pagare una rata più bassa?
Dipende dal budget. Una durata più lunga riduce la rata mensile ma aumenta gli interessi complessivi. Scegli la durata più breve con una rata che puoi sostenere con margine.
