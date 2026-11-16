---
slug: piano-ammortamento-francese
title: Piano di ammortamento alla francese: come funziona e come leggerlo
short: Piano di ammortamento
seoTitle: Piano di ammortamento alla francese: esempio e spiegazione | RataLab
description: Cos'è il piano di ammortamento alla francese, perché all'inizio paghi soprattutto interessi e come leggere quota capitale, quota interessi e debito residuo, con un esempio completo.
lead: Ogni rata che paghi è divisa in due parti: una rimborsa il debito, l'altra paga gli interessi. Il piano di ammortamento mostra come cambia questa divisione mese dopo mese, ed è il documento più utile per capire quanto devi ancora e quanto conviene estinguere in anticipo.
card: Quota capitale, quota interessi e debito residuo spiegati con un piano completo di 12 rate e un esempio a 5 anni.
category: Le basi
order: 2
updated: 2026-11-16
related: calcolo-rata-finanziamento, estinzione-anticipata-finanziamento, costo-totale-del-credito, glossario-finanziamenti
sources: [Banca d’Italia, credito ai consumatori](https://economiapertutti.bancaditalia.it/aree-tematiche/prestiti/credito-ai-consumatori/)
---
:::summary
- Nell'ammortamento alla francese la **rata è costante**, ma la sua composizione cambia ogni mese.
- All'inizio la rata è fatta soprattutto di **interessi**; verso la fine soprattutto di **capitale**.
- Il **debito residuo** scende lentamente nei primi anni: è la cifra da guardare se pensi di estinguere o rinegoziare.
- Gli interessi si calcolano sempre sul debito residuo, non sul capitale iniziale.
:::

## Cos'è un piano di ammortamento

Il piano di ammortamento è la tabella che elenca, per ogni scadenza, quanto paghi, quanta parte della rata va a interessi, quanta a rimborso del capitale e quanto debito resta dopo il pagamento. In Italia quasi tutti i prestiti personali, i finanziamenti finalizzati e i mutui a tasso fisso usano l'ammortamento detto **alla francese**, cioè a rata costante.

Esistono altri metodi, come l'ammortamento all'italiana (quota capitale costante e rata decrescente), ma nel credito ai consumatori sono rari. Il contratto indica sempre il metodo usato; puoi chiedere al finanziatore una copia del piano di ammortamento in qualsiasi momento.

## Come si calcola ogni riga

Una volta nota la rata (vedi la guida sul [calcolo della rata](calcolo-rata-finanziamento.html)), ogni riga del piano si ottiene in tre passaggi:

1. **Quota interessi** = debito residuo all'inizio del mese × tasso mensile.
2. **Quota capitale** = rata − quota interessi.
3. **Nuovo debito residuo** = debito precedente − quota capitale.

Siccome il debito scende, la quota interessi del mese successivo è un po' più piccola e la quota capitale un po' più grande. Per questo il debito si riduce sempre più in fretta man mano che ci si avvicina alla fine.

## Esempio completo: 12.000 € in 12 mesi

Ecco il piano completo di un prestito di 12.000 € in 12 rate al TAN 7%. Lo stesso calcolo è fatto dal [calcolatore RataLab](index.html#calcolatore).

{{schedule amount=12000 months=12 tan=7}}

Osserva la prima e l'ultima riga: nella prima rata gli interessi valgono 70 €, nell'ultima poco più di 6 €. La rata resta identica, ma quello che compri con ogni pagamento cambia.

## Esempio su 5 anni: perché il debito scende piano

Con durate lunghe l'effetto è più marcato. Prendiamo 20.000 € in 60 mesi al TAN 7% (rata 396,02 €). Ecco le prime sei rate e l'ultima:

{{schedule amount=20000 months=60 tan=7 rows=6}}

:::example Cosa succede a metà strada
Dopo **24 rate**, cioè il 40% della durata, hai pagato 9.504 € ma il debito residuo è ancora di **12.825,82 €**: hai rimborsato solo il 36% del capitale. Nei primi due anni hai pagato 2.330 € di interessi; nei tre anni successivi ne pagherai 1.431 €.
:::

Questo è il motivo per cui l'estinzione anticipata fa risparmiare di più se avviene nella prima metà del piano: si eliminano gli interessi che non sono ancora maturati. Approfondisci nella guida sull'[estinzione anticipata](estinzione-anticipata-finanziamento.html).

## Come leggere il piano del tuo finanziamento

- **Controlla la prima riga.** La quota interessi deve essere pari al capitale finanziato per il tasso mensile. Se è più alta, il capitale effettivo comprende costi finanziati o polizze.
- **Verifica l'ultima riga.** Se l'ultima rata è molto più grande delle altre c'è una maxi rata finale (leggi [maxi rata finale](maxi-rata-finale.html)).
- **Cerca la colonna "debito residuo".** È la cifra che servirà come base in caso di estinzione o di [consolidamento](consolidamento-debiti.html).
- **Somma le quote interessi.** Il totale degli interessi è uno dei componenti del [costo totale del credito](costo-totale-del-credito.html).

## Ammortamento alla francese e all'italiana a confronto

| Caratteristica | Alla francese | All'italiana |
|---|---|---|
| Rata | Costante | Decrescente |
| Quota capitale | Crescente | Costante |
| Prime rate | Più basse | Più alte |
| Interessi totali | Più alti | Più bassi |
| Diffusione nel credito al consumo | Molto alta | Rara |

L'ammortamento all'italiana fa pagare meno interessi perché il capitale scende più in fretta, ma le prime rate sono più pesanti. Quello alla francese è preferito perché rende la rata prevedibile.

## Domande frequenti

### Perché all'inizio pago quasi solo interessi?
Perché gli interessi si calcolano sul debito residuo, che all'inizio è massimo. Con la rata costante resta poco spazio per il rimborso del capitale nei primi mesi; la proporzione si inverte con il passare del tempo.

### Posso chiedere il piano di ammortamento alla banca?
Sì. Il piano viene di solito allegato al contratto e il finanziatore deve fornirlo su richiesta. Nel credito ai consumatori a durata determinata puoi ottenere gratuitamente in qualsiasi momento un estratto con il piano di rimborso.

### Il debito residuo coincide con quanto devo pagare per estinguere?
Quasi: per estinguere paghi il debito residuo più gli interessi maturati fino al giorno dell'estinzione ed eventualmente un indennizzo, che la legge limita. In cambio hai diritto alla riduzione degli interessi e dei costi relativi alla durata residua.

### L'ammortamento alla francese è svantaggioso?
Non è svantaggioso in sé: a parità di tasso e durata gli interessi dipendono dal ritmo con cui rimborsi il capitale. Paghi più interessi rispetto all'ammortamento all'italiana perché rimborsi il capitale più lentamente, ma hai rate uguali e prevedibili.
