// Allinea le pagine scritte a mano: consenso + AdSense nell'head, navigazione comune,
// link alle guide nel footer e guide correlate nelle guide storiche. Idempotente.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADSENSE_HEAD, navHtml } from './generate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index', 'chi-siamo', 'per-aziende', 'controlla-preventivo', 'incolla-offerta', 'probabilita-approvazione', 'tan-vs-taeg', 'maxi-rata-finale', 'confrontare-due-finanziamenti', 'rata-reddito', 'metodo-di-calcolo', 'legal'];

const CONSENT_HEAD = `<script src="consent.js"></script>
    <!-- Start cookieyes banner -->
    <script id="cookieyes" type="text/javascript" src="https://cdn-cookieyes.com/client_data/56b54fa487a16de1acfcc0675c4e7793/script.js"></script>
    <!-- End cookieyes banner -->`;

const FOOTER_GUIDES = '<nav class="footer-guides" aria-label="Guide più consultate"><a href="calcolo-rata-finanziamento.html">Calcolo rata</a><a href="tan-vs-taeg.html">TAN e TAEG</a><a href="piano-ammortamento-francese.html">Piano di ammortamento</a><a href="estinzione-anticipata-finanziamento.html">Estinzione anticipata</a><a href="cessione-del-quinto.html">Cessione del quinto</a><a href="finanziamento-auto-concessionaria.html">Finanziamento auto</a><a href="glossario-finanziamenti.html">Glossario</a></nav>';

const RELATED = {
  'tan-vs-taeg': [['costo-totale-del-credito', 'Quanto costa davvero un prestito'], ['finanziamento-tasso-zero', 'Finanziamento a tasso zero: quando è davvero gratis'], ['secci-come-leggerlo', 'Come leggere il SECCI'], ['calcolo-rata-finanziamento', 'Come si calcola la rata']],
  'maxi-rata-finale': [['finanziamento-auto-concessionaria', 'Finanziamento auto in concessionaria'], ['leasing-noleggio-o-finanziamento-auto', 'Leasing, noleggio o finanziamento'], ['rata-prestito-20000-euro', 'Finanziamento di 20.000 euro'], ['piano-ammortamento-francese', 'Piano di ammortamento alla francese']],
  'confrontare-due-finanziamenti': [['secci-come-leggerlo', 'Come leggere il SECCI'], ['prestito-personale-o-finalizzato', 'Prestito personale o finalizzato'], ['costo-totale-del-credito', 'Il costo totale del credito'], ['assicurazione-finanziamento-cpi', 'Assicurazione sul finanziamento']],
  'rata-reddito': [['quanto-posso-chiedere-in-prestito', 'Quanto posso chiedere in prestito'], ['finanziamento-rifiutato-perche', 'Finanziamento rifiutato: i motivi'], ['consolidamento-debiti', 'Consolidamento debiti'], ['rate-non-pagate-cosa-succede', 'Rate non pagate: cosa succede']],
};

const HOME_GUIDES = `
        <section class="guide-section home-guides" aria-labelledby="home-guide-title">
          <div class="section-heading">
            <span class="eyebrow">Guide RataLab</span>
            <h2 id="home-guide-title">Capire il finanziamento prima di firmare</h2>
            <p>Guide pratiche con esempi calcolati: dalla formula della rata ai tuoi diritti se vuoi estinguere o recedere.</p>
          </div>
          <div class="guide-hub-grid">
            <article class="guide-hub-card"><span class="guide-hub-number">01</span><h3><a href="calcolo-rata-finanziamento.html">Come si calcola la rata</a></h3><p>La formula della rata costante con un esempio svolto e una tabella per durate e tassi.</p></article>
            <article class="guide-hub-card"><span class="guide-hub-number">02</span><h3><a href="costo-totale-del-credito.html">Quanto costa davvero un prestito</a></h3><p>Interessi, istruttoria, incasso rata e polizze: come sommarli e confrontare due offerte.</p></article>
            <article class="guide-hub-card"><span class="guide-hub-number">03</span><h3><a href="estinzione-anticipata-finanziamento.html">Estinzione anticipata</a></h3><p>Quanto si risparmia rimborsando prima e quanto può chiedere il finanziatore.</p></article>
            <article class="guide-hub-card"><span class="guide-hub-number">04</span><h3><a href="finanziamento-auto-concessionaria.html">Finanziamento auto in concessionaria</a></h3><p>Valore futuro garantito, maxi rata e servizi inclusi: come leggere l'offerta.</p></article>
            <article class="guide-hub-card"><span class="guide-hub-number">05</span><h3><a href="cessione-del-quinto.html">Cessione del quinto</a></h3><p>Rata massima, durata, assicurazione obbligatoria e differenze con il prestito personale.</p></article>
            <article class="guide-hub-card"><span class="guide-hub-number">06</span><h3><a href="rata-prestito-10000-euro.html">Prestito di 10.000 euro</a></h3><p>Rate e interessi per ogni durata, con tabelle pronte e l'effetto delle spese.</p></article>
          </div>
          <p class="guide-hub-home-link"><a class="text-link" href="guide.html">Tutte le guide <span>→</span></a></p>
        </section>`;

for (const name of pages) {
  const file = path.join(root, `${name}.html`);
  let html = await readFile(file, 'utf8');

  // 1. Consenso (se mancante) e AdSense nell'head.
  html = html.replace(/\s*<meta name="google-adsense-account"[^>]*>/g, '');
  html = html.replace(/\s*<script async src="https:\/\/pagead2\.googlesyndication\.com[^>]*><\/script>/g, '');
  if (!html.includes('consent.js')) {
    html = html.replace(/(<meta name="referrer" content="strict-origin" \/>)/, `$1\n    ${CONSENT_HEAD}`);
  }
  html = html.replace(/(<!-- End cookieyes banner -->)/, `$1\n    ${ADSENSE_HEAD}`);

  // 2. Navigazione principale comune.
  html = html.replace(/(<nav aria-label="Navigazione principale">)[\s\S]*?(<\/nav>)/, (_, open, close) => {
    const links = name === 'index' ? navHtml('index').replace('href="index.html#calcolatore"', 'href="#calcolatore"') : navHtml(name);
    return `${open}\n          ${links}\n        ${close}`;
  });

  // 3. Link alle guide nel footer.
  if (!html.includes('class="footer-guides"')) {
    html = html.replace(/(\s*<div class="footer-bottom">)/, `\n        ${FOOTER_GUIDES}$1`);
  }

  // 4. Guide correlate nelle guide storiche.
  if (RELATED[name] && !html.includes('id="correlate"')) {
    const cards = RELATED[name].map(([slug, title]) => `<article class="guide-hub-card"><h3><a href="${slug}.html">${title}</a></h3></article>`).join('');
    html = html.replace(/(\s*<\/main>)/, `\n        <section class="related-guides" aria-labelledby="correlate"><h2 id="correlate">Guide correlate</h2><div class="guide-hub-grid">${cards}</div></section>$1`);
  }

  // 5. Home: sezione guide prima del blocco privacy.
  if (name === 'index' && !html.includes('home-guide-title')) {
    html = html.replace(/(\s*<section class="privacy-section">)/, `${HOME_GUIDES}$1`);
  }

  await writeFile(file, html);
}
console.log(`Aggiornate ${pages.length} pagine.`);
