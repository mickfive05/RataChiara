// Genera le guide HTML da content/guides/*.md, l'indice guide.html e sitemap.xml.
// Uso: node scripts/generate.mjs  (le pagine generate vengono committate nella root)
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateLoan } from '../finance.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content', 'guides');
const SITE = 'https://ratalab.it';
const AUTHOR = 'Michael Lupo';

export const ADSENSE_HEAD = `<meta name="google-adsense-account" content="ca-pub-9989630758548952" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9989630758548952" crossorigin="anonymous"></script>`;

export const NAV_LINKS = [
  ['index.html#calcolatore', 'Calcolatore', 'index'],
  ['guide.html', 'Guide', 'guide'],
  ['glossario-finanziamenti.html', 'Glossario', 'glossario-finanziamenti'],
  ['controlla-preventivo.html', 'Controlla preventivo', 'controlla-preventivo'],
  ['probabilita-approvazione.html', 'Sostenibilità', 'probabilita-approvazione'],
  ['incolla-offerta.html', 'Incolla l’offerta', 'incolla-offerta'],
];

export function navHtml(current) {
  return NAV_LINKS.map(([href, label, key]) =>
    `<a href="${href}"${key === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
}

export const FOOTER_HTML = `<footer>
        <div class="footer-top"><a class="brand" href="index.html"><span class="brand-mark">R</span><span>RataLab</span></a><p>Uno strumento indipendente per capire e confrontare i finanziamenti.</p><a href="per-aziende.html">Per aziende &rarr;</a></div>
        <nav class="footer-guides" aria-label="Guide più consultate"><a href="calcolo-rata-finanziamento.html">Calcolo rata</a><a href="tan-vs-taeg.html">TAN e TAEG</a><a href="piano-ammortamento-francese.html">Piano di ammortamento</a><a href="estinzione-anticipata-finanziamento.html">Estinzione anticipata</a><a href="cessione-del-quinto.html">Cessione del quinto</a><a href="finanziamento-auto-concessionaria.html">Finanziamento auto</a><a href="glossario-finanziamenti.html">Glossario</a></nav>
        <div class="footer-bottom"><span>© <span id="current-year"></span> RataLab</span><span>Calcolo informativo, non costituisce consulenza o offerta di credito.</span></div>
      <p class="method-footer-link"><a href="metodo-di-calcolo.html">Metodo di calcolo, fonti e limiti</a></p><nav class="legal-footer-links" aria-label="Informazioni e contatti"><a href="chi-siamo.html">Chi siamo</a><a href="chi-siamo.html#correzioni">Contatti e correzioni</a><a href="metodo-di-calcolo.html">Metodo e fonti</a><a href="legal.html#privacy">Privacy</a><a href="legal.html#cookie">Cookie</a><a href="legal.html#termini">Termini</a><a href="legal.html#disclaimer">Disclaimer</a></nav></footer>`;

// Le guide preesistenti scritte a mano: compaiono nell'indice accanto a quelle generate.
const LEGACY_GUIDES = [
  { slug: 'tan-vs-taeg', title: 'TAN e TAEG: differenza, esempio e come confrontare un finanziamento', card: 'Cosa indicano i due tassi, quali costi entrano nel TAEG e come usarli per confrontare proposte comparabili.', category: 'Costi e tassi' },
  { slug: 'maxi-rata-finale', title: 'Maxi rata finale: come funziona e cosa valutare', card: 'Il ruolo della rata conclusiva, come cambia il piano di rimborso e cosa verificare prima di accettarla.', category: 'Auto e acquisti' },
  { slug: 'confrontare-due-finanziamenti', title: 'Come confrontare due finanziamenti', card: 'Una checklist pratica per mettere a confronto rata, durata, costi, TAEG e importo totale da restituire.', category: 'Scegliere e confrontare' },
  { slug: 'rata-reddito', title: 'Rata e reddito: quanto dovrebbe pesare un finanziamento', card: 'Quanto può incidere la rata sul budget mensile e quali voci non trascurare.', category: 'Budget e sostenibilità' },
];

const CATEGORY_ORDER = ['Le basi', 'Costi e tassi', 'Importi e simulazioni', 'Scegliere e confrontare', 'Auto e acquisti', 'Budget e sostenibilità', 'Diritti e tutele'];

const euro = (value, digits = 2) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: 'always' }).format(value) + ' €';
const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const itDate = (iso) => new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));

function loan(amount, months, tan, extra = {}) {
  return calculateLoan({ amount, downPayment: 0, months, tan, initialFees: 0, monthlyFees: 0, insurance: 0, balloon: 0, financeInitialCosts: false, ...extra });
}

function calcLink(amount, months, tan, extra = {}) {
  const p = new URLSearchParams({ importo: amount, anticipo: extra.anticipo ?? 0, mesi: months, tan, istruttoria: extra.istruttoria ?? 0, spese_rata: extra.spese_rata ?? 0, assicurazione: 0, maxirata: extra.maxirata ?? 0, costi_finanziati: 0 });
  return `index.html?${p.toString().replace(/&/g, '&amp;')}#calcolatore`;
}

function parseArgs(text) {
  const args = {};
  for (const match of text.matchAll(/(\w+)=([^\s]+)/g)) args[match[1]] = match[2];
  return args;
}

const numList = (value) => value.split(',').map(Number);

// Tabelle calcolate al momento della generazione con le stesse formule del calcolatore.
const widgets = {
  'rate-table'(args) {
    const amount = Number(args.amount);
    const tans = numList(args.tans);
    const months = numList(args.months);
    const head = `<tr><th scope="col">Durata</th>${tans.map((t) => `<th scope="col">TAN ${String(t).replace('.', ',')}%</th>`).join('')}</tr>`;
    const rows = months.map((m) => `<tr><th scope="row">${m} mesi</th>${tans.map((t) => `<td><a href="${calcLink(amount, m, t)}">${euro(loan(amount, m, t).monthlyInstallment)}</a></td>`).join('')}</tr>`).join('');
    return `<div class="table-scroll article-table"><table><caption>Rata mensile per ${euro(amount, 0)} senza altri costi (clicca un valore per aprirlo nel calcolatore)</caption><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
  },
  'cost-table'(args) {
    const amount = Number(args.amount);
    const tan = Number(args.tan);
    const months = numList(args.months);
    const rows = months.map((m) => {
      const r = loan(amount, m, tan);
      return `<tr><th scope="row">${m} mesi</th><td>${euro(r.monthlyInstallment)}</td><td>${euro(r.totalInterest)}</td><td>${euro(r.totalCreditPayments)}</td></tr>`;
    }).join('');
    return `<div class="table-scroll article-table"><table><caption>${euro(amount, 0)} al TAN ${String(tan).replace('.', ',')}%, senza spese accessorie</caption><thead><tr><th scope="col">Durata</th><th scope="col">Rata</th><th scope="col">Interessi totali</th><th scope="col">Totale rimborsato</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },
  schedule(args) {
    const amount = Number(args.amount);
    const months = Number(args.months);
    const tan = Number(args.tan);
    const r = loan(amount, months, tan);
    const show = Number(args.rows || months);
    const rows = r.schedule.filter((row, i) => i < show || i === months - 1).map((row) => `<tr><th scope="row">${row.month}</th><td>${euro(row.installment)}</td><td>${euro(row.interest)}</td><td>${euro(row.principal + row.balloon)}</td><td>${euro(row.closingBalance)}</td></tr>`);
    if (show < months - 1) rows.splice(show, 0, '<tr><td colspan="5" class="table-gap">…</td></tr>');
    return `<div class="table-scroll article-table"><table><caption>Piano di ammortamento: ${euro(amount, 0)}, ${months} mesi, TAN ${String(tan).replace('.', ',')}%</caption><thead><tr><th scope="col">Mese</th><th scope="col">Rata</th><th scope="col">Quota interessi</th><th scope="col">Quota capitale</th><th scope="col">Debito residuo</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  },
  'example-costs'(args) {
    const amount = Number(args.amount);
    const months = Number(args.months);
    const tan = Number(args.tan);
    const fees = Number(args.istruttoria || 0);
    const monthly = Number(args.spese || 0);
    const base = loan(amount, months, tan);
    const full = loan(amount, months, tan, { initialFees: fees, monthlyFees: monthly });
    return `<div class="table-scroll article-table"><table><caption>Stesso prestito, con e senza spese (${euro(amount, 0)}, ${months} mesi, TAN ${String(tan).replace('.', ',')}%)</caption><thead><tr><th scope="col">Voce</th><th scope="col">Solo interessi</th><th scope="col">Con ${euro(fees, 0)} di istruttoria e ${euro(monthly, 0)} a rata</th></tr></thead><tbody>
<tr><th scope="row">Rata mensile</th><td>${euro(base.monthlyInstallment)}</td><td>${euro(full.monthlyInstallment)}</td></tr>
<tr><th scope="row">Costo totale del credito</th><td>${euro(base.totalCreditCost)}</td><td>${euro(full.totalCreditCost)}</td></tr>
<tr><th scope="row">Tasso effettivo stimato</th><td>${base.apr.toFixed(2).replace('.', ',')}%</td><td>${full.apr.toFixed(2).replace('.', ',')}%</td></tr>
</tbody></table></div><p class="table-note">Il tasso effettivo è stimato da RataLab sui flussi indicati: il TAEG ufficiale è quello riportato nel SECCI. <a href="${calcLink(amount, months, tan, { istruttoria: fees, spese_rata: monthly })}">Apri questo esempio nel calcolatore</a>.</p>`;
  },
};

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const external = /^https?:/.test(href);
      return `<a href="${href.replace(/&amp;/g, '&').replace(/&/g, '&amp;')}"${external ? ' rel="noopener"' : ''}>${label}</a>`;
    });
}

function parseTable(lines) {
  const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = cells(lines[0]);
  const body = lines.slice(2).map(cells);
  return `<div class="table-scroll article-table"><table><thead><tr>${head.map((h) => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((c, i) => i === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// Markdown minimale: titoli, paragrafi, elenchi, tabelle, blocchi :::tipo, widget {{...}}.
function renderBlocks(md) {
  const lines = md.split('\n');
  const out = [];
  const toc = [];
  const faq = [];
  let i = 0;
  let inFaq = false;
  let sectionOpen = false;
  const closeSection = () => { if (sectionOpen) { out.push('</section>'); sectionOpen = false; } };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    if (line.startsWith('## ')) {
      closeSection();
      const title = line.slice(3).trim();
      const id = slugify(title);
      inFaq = /^domande frequenti/i.test(title);
      toc.push({ id, title });
      out.push(`<section class="article-section${inFaq ? ' article-faq' : ''}" aria-labelledby="${id}"><h2 id="${id}">${inline(title)}</h2>`);
      sectionOpen = true;
      i += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      const title = line.slice(4).trim();
      if (inFaq) {
        const answer = [];
        i += 1;
        while (i < lines.length && !lines[i].startsWith('#')) { if (lines[i].trim()) answer.push(lines[i].trim()); i += 1; }
        faq.push({ q: title, a: answer.join(' ') });
        out.push(`<details><summary>${inline(title)}</summary>${answer.map((p) => `<p>${inline(p)}</p>`).join('')}</details>`);
        continue;
      }
      out.push(`<h3>${inline(title)}</h3>`);
      i += 1;
      continue;
    }

    if (line.startsWith(':::')) {
      const kind = line.slice(3).trim();
      const inner = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== ':::') { inner.push(lines[i]); i += 1; }
      i += 1;
      const rendered = renderBlocks(inner.join('\n')).html;
      if (kind === 'summary') {
        closeSection();
        out.push(`<section class="article-card article-summary" aria-label="In breve"><h2>In breve</h2>${rendered}</section>`);
      } else if (kind.startsWith('example')) {
        const label = kind.replace(/^example\s*/, '') || 'Esempio';
        out.push(`<div class="article-example"><span class="eyebrow">${escapeHtml(label)}</span>${rendered}</div>`);
      } else if (kind === 'checklist') {
        closeSection();
        out.push(`<section class="article-card article-checklist" aria-label="Checklist"><span class="eyebrow">Prima di firmare</span>${rendered}</section>`);
      } else if (kind === 'warning') {
        out.push(`<div class="article-callout">${rendered}</div>`);
      }
      continue;
    }

    const widget = line.trim().match(/^\{\{([\w-]+)\s*(.*)\}\}$/);
    if (widget) {
      out.push(widgets[widget[1]](parseArgs(widget[2])));
      i += 1;
      continue;
    }

    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i]); i += 1; }
      out.push(parseTable(tableLines));
      continue;
    }

    if (/^\s*[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*] /, '')); i += 1; }
      out.push(`<ul class="article-list">${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\. /, '')); i += 1; }
      out.push(`<ol class="article-list">${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ol>`);
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#|:::|\||\s*[-*] |\s*\d+\. |\{\{)/.test(lines[i])) { para.push(lines[i].trim()); i += 1; }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  closeSection();
  return { html: out.join('\n'), toc, faq };
}

function parseFile(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Frontmatter mancante');
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  meta.related = meta.related ? meta.related.split(',').map((s) => s.trim()) : [];
  return { meta, body: match[2] };
}

function headCommon({ title, description, canonical, jsonLd }) {
  return `<!doctype html>
<html lang="it">
  <head>
    <meta name="referrer" content="strict-origin" />
    <script src="consent.js"></script>
    <!-- Start cookieyes banner -->
    <script id="cookieyes" type="text/javascript" src="https://cdn-cookieyes.com/client_data/56b54fa487a16de1acfcc0675c4e7793/script.js"></script>
    <!-- End cookieyes banner -->
    ${ADSENSE_HEAD}
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="it_IT" />
    <meta property="og:site_name" content="RataLab" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>
    <meta name="theme-color" content="#0c2d2a" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon.png" />
    <link rel="stylesheet" href="styles.css" />
  </head>`;
}

function shell(current, mainHtml) {
  return `
  <body>
<noscript><p class="no-js">Guide e informazioni sono consultabili senza JavaScript. Per usare i calcolatori e il tema occorre abilitarlo.</p></noscript>
    <a class="skip-link" href="#contenuto">Salta al contenuto</a>
    <div class="site-shell">
      <header class="topbar">
        <a class="brand" href="index.html" aria-label="RataLab, torna alla home"><span class="brand-mark">R</span><span>RataLab</span></a>
        <nav aria-label="Navigazione principale">
          ${navHtml(current)}
        </nav>
        <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Attiva tema scuro"><span aria-hidden="true">◐</span><span class="theme-toggle-label">Tema scuro</span></button>
        <div class="header-trust">Nessun account</div>
      </header>
${mainHtml}
      ${FOOTER_HTML}
    </div>
    <script type="module" src="theme.js"></script>
  </body>
</html>
`;
}

function renderGuide(guide, allGuides) {
  const { meta, body } = guide;
  const url = `${SITE}/${meta.slug}`;
  const { html, toc, faq } = renderBlocks(body);
  const words = body.replace(/\{\{.*?\}\}/g, '').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.round(words / 200));
  const related = meta.related.map((slug) => allGuides.find((g) => g.slug === slug)).filter(Boolean);

  const graph = [
    {
      '@type': 'Article',
      headline: meta.title,
      description: meta.description,
      mainEntityOfPage: url,
      datePublished: meta.published || meta.updated,
      dateModified: meta.updated,
      inLanguage: 'it-IT',
      author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/chi-siamo` },
      publisher: { '@type': 'Organization', name: 'RataLab', url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}/favicon.png` } },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Guide', item: `${SITE}/guide` },
        { '@type': 'ListItem', position: 3, name: meta.short || meta.title, item: url },
      ],
    },
  ];
  if (faq.length) {
    graph.push({ '@type': 'FAQPage', mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') } })) });
  }

  const tocHtml = toc.length >= 4 ? `<nav class="article-toc" aria-label="Indice della guida"><h2>In questa guida</h2><ol>${toc.map((t) => `<li><a href="#${t.id}">${escapeHtml(t.title)}</a></li>`).join('')}</ol></nav>` : '';
  const relatedHtml = related.length ? `<section class="related-guides" aria-labelledby="correlate"><h2 id="correlate">Guide correlate</h2><div class="guide-hub-grid">${related.map((g) => `<article class="guide-hub-card"><h3><a href="${g.slug}.html">${escapeHtml(g.title)}</a></h3><p>${escapeHtml(g.card)}</p></article>`).join('')}</div></section>` : '';

  const main = `
      <main id="contenuto" tabindex="-1" class="article-page">
        <nav class="breadcrumbs" aria-label="Percorso di navigazione"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="guide.html">Guide</a><span aria-hidden="true">/</span><span>${escapeHtml(meta.short || meta.title)}</span></nav>
        <article>
          <header class="article-hero">
            <span class="eyebrow">${escapeHtml(meta.category)}</span>
            <h1>${escapeHtml(meta.title)}</h1>
            <p>${inline(meta.lead)}</p>
            <p class="article-byline">Di <a href="chi-siamo.html">${AUTHOR}</a> · Aggiornata il <time datetime="${meta.updated}">${itDate(meta.updated)}</time> · Lettura ${minutes} min</p>
          </header>
${tocHtml}
${html}
          <section class="article-cta" aria-labelledby="strumenti">
            <span class="eyebrow">Metti in pratica</span>
            <h2 id="strumenti">Fai i conti con i tuoi numeri</h2>
            <p>Gli strumenti di RataLab sono gratuiti, non chiedono registrazione e fanno i calcoli nel tuo browser.</p>
            <div class="article-cta-links">
              <a class="button button-primary" href="index.html#calcolatore">Calcola la rata</a>
              <a class="text-link" href="controlla-preventivo.html">Controlla un preventivo <span>→</span></a>
              <a class="text-link" href="probabilita-approvazione.html">Valuta la sostenibilità <span>→</span></a>
            </div>
          </section>
          <aside class="article-notice">
            <h2>Nota importante</h2>
            <p>Questa guida è informativa e non costituisce consulenza, offerta o garanzia di credito. Le norme possono cambiare: per condizioni, costi e diritti fanno fede il SECCI, il contratto e le fonti ufficiali. ${meta.sources ? `Fonti consultate: ${inline(meta.sources)}.` : ''} Hai trovato un errore? <a href="chi-siamo.html#correzioni">Segnalalo</a>.</p>
          </aside>
        </article>
${relatedHtml}
      </main>`;

  return headCommon({ title: meta.seoTitle || `${meta.title} | RataLab`, description: meta.description, canonical: url, jsonLd: { '@context': 'https://schema.org', '@graph': graph } }) + shell(meta.slug, main);
}

function renderHub(allGuides) {
  const byCat = new Map(CATEGORY_ORDER.map((c) => [c, []]));
  for (const g of allGuides) { if (!byCat.has(g.category)) byCat.set(g.category, []); byCat.get(g.category).push(g); }
  let n = 0;
  const sections = [...byCat].filter(([, list]) => list.length).map(([cat, list]) => `
        <section class="guide-hub-section" aria-labelledby="cat-${slugify(cat)}">
          <div class="guide-hub-heading"><h2 id="cat-${slugify(cat)}">${escapeHtml(cat)}</h2></div>
          <div class="guide-hub-grid">
${list.map((g) => { n += 1; return `            <article class="guide-hub-card"><span class="guide-hub-number">${String(n).padStart(2, '0')}</span><h3><a href="${g.slug}.html">${escapeHtml(g.title)}</a></h3><p>${escapeHtml(g.card)}</p></article>`; }).join('\n')}
          </div>
        </section>`).join('');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'Guide sui finanziamenti | RataLab', description: 'Guide pratiche su rate, TAN e TAEG, costi, estinzione anticipata, cessione del quinto e finanziamento auto.', url: `${SITE}/guide`, inLanguage: 'it-IT', isPartOf: { '@type': 'WebSite', name: 'RataLab', url: `${SITE}/` }, mainEntity: { '@type': 'ItemList', itemListElement: allGuides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.title, url: `${SITE}/${g.slug}` })) } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Guide sui finanziamenti', item: `${SITE}/guide` }] },
    ],
  };
  const main = `
      <main id="contenuto" tabindex="-1" class="article-page guide-hub-page">
        <nav class="breadcrumbs" aria-label="Percorso di navigazione"><a href="index.html">Home</a><span aria-hidden="true">/</span><span>Guide sui finanziamenti</span></nav>
        <header class="article-hero">
          <span class="eyebrow">RataLab spiega</span>
          <h1>Guide sui finanziamenti</h1>
          <p>${allGuides.length} guide pratiche per leggere un preventivo, capire quanto costa davvero un prestito, confrontare le offerte e conoscere i tuoi diritti. Ogni guida ha esempi numerici calcolati con le stesse formule del <a href="index.html#calcolatore">calcolatore RataLab</a>.</p>
        </header>
        <nav class="article-toc" aria-label="Categorie"><h2>Categorie</h2><ol>${[...byCat].filter(([, l]) => l.length).map(([cat]) => `<li><a href="#cat-${slugify(cat)}">${escapeHtml(cat)}</a></li>`).join('')}</ol></nav>
${sections}
        <section class="article-cta guide-hub-tools" aria-labelledby="strumenti-ratalab">
          <span class="eyebrow">Dalla teoria alla pratica</span>
          <h2 id="strumenti-ratalab">Strumenti RataLab</h2>
          <p>Usa i dati del tuo preventivo per una lettura orientativa e più concreta delle condizioni proposte.</p>
          <div class="article-cta-links">
            <a class="button button-primary" href="index.html#calcolatore">Calcola la rata</a>
            <a class="text-link" href="controlla-preventivo.html">Controlla un preventivo <span>→</span></a>
            <a class="text-link" href="glossario-finanziamenti.html">Apri il glossario <span>→</span></a>
          </div>
        </section>
        <aside class="article-notice">
          <h2>Nota importante</h2>
          <p>Le guide e gli strumenti RataLab sono informativi e non costituiscono consulenza, offerta o garanzia di credito. Per le condizioni effettive fanno sempre fede il SECCI, il contratto e le valutazioni del finanziatore.</p>
        </aside>
      <section class="method-reference" aria-label="Metodo e trasparenza"><h2>Come sono calcolati i risultati?</h2><p>Consulta formule, esempi riproducibili, costi inclusi e limiti delle stime.</p><a href="metodo-di-calcolo.html">Leggi il metodo di calcolo →</a></section></main>`;
  return headCommon({ title: 'Guide sui finanziamenti: rate, TAEG, costi e diritti | RataLab', description: 'Guide pratiche e aggiornate su rate, TAN e TAEG, piano di ammortamento, estinzione anticipata, cessione del quinto, finanziamento auto e tutele del consumatore.', canonical: `${SITE}/guide`, jsonLd }).replace('og:type" content="article"', 'og:type" content="website"') + shell('guide', main);
}

async function main() {
  const files = (await readdir(contentDir)).filter((f) => f.endsWith('.md')).sort();
  const guides = [];
  for (const file of files) {
    const parsed = parseFile(await readFile(path.join(contentDir, file), 'utf8'));
    if (parsed.meta.slug !== file.replace(/\.md$/, '')) throw new Error(`Slug non coerente in ${file}`);
    guides.push(parsed);
  }
  const index = [
    ...guides.map(({ meta }) => ({ slug: meta.slug, title: meta.title, card: meta.card, category: meta.category, updated: meta.updated, order: Number(meta.order || 50) })),
    ...LEGACY_GUIDES.map((g) => ({ ...g, updated: '2026-10-23', order: 50 })),
  ].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'it'));

  for (const guide of guides) {
    await writeFile(path.join(root, `${guide.meta.slug}.html`), renderGuide(guide, index));
  }
  await writeFile(path.join(root, 'guide.html'), renderHub(index));

  const today = new Date().toISOString().slice(0, 10);
  const staticPages = [['', 1.0], ['guide', 0.9], ['controlla-preventivo', 0.8], ['incolla-offerta', 0.7], ['probabilita-approvazione', 0.7], ['metodo-di-calcolo', 0.5], ['chi-siamo', 0.5], ['per-aziende', 0.4], ['legal', 0.2]];
  const urls = [
    ...staticPages.map(([p, prio]) => `  <url><loc>${SITE}/${p}</loc><lastmod>${today}</lastmod><priority>${prio.toFixed(1)}</priority></url>`),
    ...index.map((g) => `  <url><loc>${SITE}/${g.slug}</loc><lastmod>${g.updated}</lastmod><priority>0.8</priority></url>`),
  ];
  await writeFile(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  console.log(`Generate ${guides.length} guide, indice con ${index.length} voci, sitemap con ${urls.length} URL.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
