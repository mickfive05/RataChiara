import {
  calculateAffordablePrincipal,
  calculateLoan,
  defaultLoanInput,
} from './finance.js';
import './theme.js';

const STORAGE_KEY = 'ratalab-offers-v1';
const durationPresets = [24, 36, 48, 60, 72, 84];
const $ = (id) => document.getElementById(id);

const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('it-IT', {
  maximumFractionDigits: 2,
});

let currentResult = null;
let savedOffers = readSavedOffers();
let statusTimer = null;

function formatCurrency(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatCompactCurrency(value) {
  return compactCurrencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value) {
  return value === null ? 'N/D' : `${numberFormatter.format(value)}%`;
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readNumber(id) {
  return safeNumber($(id).value);
}

function readLoanInput() {
  return {
    amount: readNumber('amount'),
    downPayment: readNumber('down-payment'),
    months: Math.max(1, Math.round(readNumber('months'))),
    tan: readNumber('tan'),
    initialFees: readNumber('initial-fees'),
    monthlyFees: readNumber('monthly-fees'),
    insurance: readNumber('insurance'),
    balloon: $('has-balloon').checked ? readNumber('balloon') : 0,
    financeInitialCosts: $('finance-initial-costs').checked,
  };
}

function readInputFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const numberParam = (key, fallback) => {
    if (!params.has(key)) return fallback;
    return safeNumber(params.get(key), fallback);
  };

  return {
    amount: numberParam('importo', defaultLoanInput.amount),
    downPayment: numberParam('anticipo', defaultLoanInput.downPayment),
    months: numberParam('mesi', defaultLoanInput.months),
    tan: numberParam('tan', defaultLoanInput.tan),
    initialFees: numberParam('istruttoria', defaultLoanInput.initialFees),
    monthlyFees: numberParam('spese_rata', defaultLoanInput.monthlyFees),
    insurance: numberParam('assicurazione', defaultLoanInput.insurance),
    balloon: numberParam('maxirata', defaultLoanInput.balloon),
    financeInitialCosts: params.get('costi_finanziati') === '1',
  };
}

function applyLoanInput(input) {
  $('amount').value = input.amount;
  $('down-payment').value = input.downPayment;
  $('months').value = Math.min(120, Math.max(12, input.months));
  $('tan').value = input.tan;
  $('initial-fees').value = input.initialFees;
  $('monthly-fees').value = input.monthlyFees;
  $('insurance').value = input.insurance;
  const hasBalloon = input.balloon > 0;
  $('has-balloon').checked = hasBalloon;
  setBalloonVisibility(hasBalloon);
  $('balloon').value = hasBalloon ? input.balloon : 0;
  $('finance-initial-costs').checked = Boolean(input.financeInitialCosts);
}

function setBalloonVisibility(enabled) {
  const field = $('balloon-field');
  field.hidden = !enabled;
  field.classList.toggle('is-visible', enabled);
  $('balloon').disabled = !enabled;
  $('has-balloon').setAttribute('aria-expanded', String(enabled));
  if (!enabled) $('balloon').value = 0;
}

function setText(id, value) {
  $(id).textContent = value;
}

function updateDurationUi(months) {
  setText('duration-label', String(months));
  document.querySelectorAll('#duration-pills button').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.months) === months);
  });
}

function renderSchedule(schedule) {
  setText('schedule-count', String(schedule.length));
  $('schedule-body').innerHTML = schedule.map((row) => `
    <tr>
      <td>${row.month}</td>
      <td>${formatCurrency(row.installment)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.monthlyFees)}</td>
      <td>${formatCurrency(row.balloon)}</td>
      <td><strong>${formatCurrency(row.closingBalance)}</strong></td>
    </tr>
  `).join('');
}

function updateIncomeRatio() {
  if (!currentResult) return;
  const income = readNumber('monthly-income');
  const resultBox = $('ratio-result');

  if (income <= 0) {
    resultBox.hidden = true;
    return;
  }

  resultBox.hidden = false;
  const ratio = (currentResult.monthlyInstallment / income) * 100;
  const level = ratio <= 25 ? 'calm' : ratio <= 33 ? 'attention' : 'high';
  const label = level === 'calm'
    ? 'Incidenza contenuta'
    : level === 'attention'
      ? 'Da valutare con attenzione'
      : 'Incidenza elevata';

  resultBox.className = `ratio-result ratio-${level}`;
  $('ratio-gauge').style.width = `${Math.min(ratio, 100)}%`;
  setText('income-ratio', `${numberFormatter.format(ratio)}%`);
  setText('ratio-label', label);
}

function recalculate() {
  const input = readLoanInput();
  if (input.downPayment > input.amount) {
    input.downPayment = input.amount;
    $('down-payment').value = input.amount;
  }
  const result = calculateLoan(input);
  currentResult = result;

  $('down-payment').max = String(input.amount);
  updateDurationUi(input.months);

  setText('hero-monthly-payment', formatCurrency(result.monthlyInstallment));
  setText('hero-months', String(input.months));
  setText('hero-apr', formatPercent(result.apr));
  setText('hero-total-cost', formatCompactCurrency(result.totalCreditCost));

  setText('net-credit-summary', formatCurrency(result.netCredit));
  setText('monthly-payment', formatCurrency(result.monthlyInstallment));
  setText('result-months', String(input.months));
  setText('final-payment', formatCurrency(result.finalInstallment));
  setText('financed-principal', formatCurrency(result.financedPrincipal));
  setText('total-interest', formatCurrency(result.totalInterest));
  setText('total-fees', formatCurrency(result.totalFees));
  setText('total-outlay', formatCurrency(result.totalOutlay));
  setText('apr', formatPercent(result.apr));
  setText('cost-per-1000', formatCurrency(result.costPer1000));

  const hasBalloon = result.finalInstallment > result.monthlyInstallment + 0.01;
  $('balloon-note').hidden = !hasBalloon;
  $('balloon-warning').hidden = input.balloon <= result.financedPrincipal;

  const capital = result.netCredit;
  const interest = result.totalInterest;
  const fees = result.totalFees;
  const total = Math.max(capital + interest + fees, 1);
  $('bar-capital').style.width = `${(capital / total) * 100}%`;
  $('bar-interest').style.width = `${(interest / total) * 100}%`;
  $('bar-fees').style.width = `${(fees / total) * 100}%`;
  setText('legend-capital', formatCompactCurrency(capital));
  setText('legend-interest', formatCompactCurrency(interest));
  setText('legend-fees', formatCompactCurrency(fees));

  renderSchedule(result.schedule);
  updateIncomeRatio();
  updatePrintSummary(input, result);
}

function updatePrintSummary(input, result) {
  setText('print-date', `Elaborato il ${new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }).format(new Date())}`);
  setText('print-monthly-payment', formatCurrency(result.monthlyInstallment));
  setText('print-installment-note', `per ${input.months} ${input.months === 1 ? 'mese' : 'mesi'}`);
  setText('print-amount', formatCurrency(input.amount));
  setText('print-down-payment', formatCurrency(input.downPayment));
  setText('print-months', `${input.months} mesi`);
  setText('print-tan', formatPercent(input.tan));
  setText('print-balloon', input.balloon > 0 ? formatCurrency(input.balloon) : 'Non prevista');
  setText('print-financed-costs', input.financeInitialCosts ? 'Sì' : 'No');
  setText('print-initial-fees', formatCurrency(input.initialFees));
  setText('print-monthly-fees', `${formatCurrency(input.monthlyFees)} / mese`);
  setText('print-insurance', formatCurrency(input.insurance));
  setText('print-total-fees', formatCurrency(result.totalFees));
  setText('print-financed-principal', formatCurrency(result.financedPrincipal));
  setText('print-total-interest', formatCurrency(result.totalInterest));
  setText('print-apr', formatPercent(result.apr));
  setText('print-final-payment', formatCurrency(result.finalInstallment));
  setText('print-total-outlay', formatCurrency(result.totalOutlay));
}

function updateBudgetCalculator() {
  const affordable = calculateAffordablePrincipal(
    readNumber('budget-payment'),
    readNumber('budget-months'),
    readNumber('budget-tan'),
  );
  setText('budget-result', formatCurrency(affordable));
}

function readSavedOffers() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((offer) => offer && offer.id && offer.input).slice(0, 8);
  } catch {
    return [];
  }
}

function persistOffers() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedOffers));
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderSavedOffers() {
  const hasOffers = savedOffers.length > 0;
  $('offer-table-wrap').hidden = !hasOffers;
  $('empty-offers').hidden = hasOffers;
  $('clear-offers').hidden = !hasOffers;

  if (!hasOffers) {
    $('offer-table-body').innerHTML = '';
    return;
  }

  const calculated = savedOffers.map((offer) => ({
    ...offer,
    result: calculateLoan(offer.input),
  }));
  const withApr = calculated.filter((offer) => offer.result.apr !== null);
  const bestOffer = withApr.length
    ? withApr.reduce((best, offer) =>
      offer.result.apr < best.result.apr ? offer : best)
    : null;

  $('offer-table-body').innerHTML = calculated.map((offer) => {
    const isBest = bestOffer && offer.id === bestOffer.id;
    return `
      <tr class="${isBest ? 'best-offer' : ''}">
        <td>
          <strong>${escapeHtml(offer.name)}</strong>
          ${isBest ? '<span class="best-badge">TAEG piu basso</span>' : ''}
        </td>
        <td>${formatCurrency(offer.result.netCredit)}</td>
        <td>${offer.input.months} mesi</td>
        <td><strong>${formatCurrency(offer.result.monthlyInstallment)}</strong></td>
        <td>${formatPercent(offer.result.apr)}</td>
        <td>${formatCurrency(offer.result.totalCreditCost)}</td>
        <td>
          <button type="button" class="icon-button" data-delete-id="${escapeHtml(offer.id)}" aria-label="Elimina ${escapeHtml(offer.name)}">
            <svg class="icon icon-sm"><use href="#icon-delete"></use></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function showStatus(message) {
  const element = $('save-status');
  element.textContent = message;
  element.hidden = false;
  if (statusTimer) window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    element.hidden = true;
  }, 2200);
}

function saveCurrentOffer() {
  const input = readLoanInput();
  const result = calculateLoan(input);
  if (result.netCredit <= 0) {
    showStatus('Inserisci un importo da finanziare');
    return;
  }

  const name = $('offer-name').value.trim() || `Offerta ${savedOffers.length + 1}`;
  const id = window.crypto && typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  savedOffers = [{
    id,
    name,
    createdAt: new Date().toISOString(),
    input,
  }, ...savedOffers].slice(0, 8);

  const persisted = persistOffers();
  renderSavedOffers();
  $('offer-name').value = `Offerta ${savedOffers.length + 1}`;
  showStatus(persisted
    ? 'Offerta salvata sul dispositivo'
    : 'Offerta salvata per questa sessione');
}

async function copyShareLink() {
  const input = readLoanInput();
  const params = new URLSearchParams({
    importo: String(input.amount),
    anticipo: String(input.downPayment),
    mesi: String(input.months),
    tan: String(input.tan),
    istruttoria: String(input.initialFees),
    spese_rata: String(input.monthlyFees),
    assicurazione: String(input.insurance),
    maxirata: String(input.balloon),
    costi_finanziati: input.financeInitialCosts ? '1' : '0',
  });
  const url = new URL(window.location.href);
  url.search = params.toString();
  url.hash = '';

  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url.toString());
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = url.toString();
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }

  setText('copy-label', 'Link copiato');
  window.setTimeout(() => setText('copy-label', 'Copia link'), 1800);
}

function openApprovalAssessment() {
  const input = readLoanInput();
  const params = new URLSearchParams({
    simulazione: '1',
    importo: String(input.amount),
    anticipo: String(input.downPayment),
    mesi: String(input.months),
    tan: String(input.tan),
    istruttoria: String(input.initialFees),
    spese_rata: String(input.monthlyFees),
    assicurazione: String(input.insurance),
    maxirata: String(input.balloon),
    costi_finanziati: input.financeInitialCosts ? '1' : '0',
  });
  window.location.href = `probabilita-approvazione.html?${params.toString()}`;
}

function printSimulation() {
  const input = readLoanInput();
  const result = calculateLoan(input);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showStatus('Consenti i popup del browser per stampare il riepilogo');
    return;
  }

  const row = (label, value) => `<div class="row"><span>${label}</span><strong>${value}</strong></div>`;
  const today = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }).format(new Date());
  const balloon = input.balloon > 0 ? formatCurrency(input.balloon) : 'Non prevista';

  printWindow.document.write(`<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>Riepilogo simulazione | RataLab</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #17251f; font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.25; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:10px; border-bottom:2px solid #254b3e; }
  .brand { color:#3f6d56; font-size:10pt; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
  h1 { margin:3px 0 0; font-size:20pt; letter-spacing:-.04em; } .date { margin:4px 0 0; color:#5b6d64; font-size:9pt; }
  .highlight { display:grid; grid-template-columns:1fr auto; gap:2px 16px; align-items:end; margin:12px 0; padding:11px 14px; border-radius:8px; background:#e5f1d6; }
  .highlight span { font-weight:700; } .highlight strong { font-size:23pt; line-height:1; } .highlight small { grid-column:1/-1; color:#486153; }
  .columns { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; } .card { border:1px solid #c9d3cd; border-radius:7px; overflow:hidden; break-inside:avoid; }
  h2 { margin:0; padding:7px 9px; color:#254b3e; background:#f0f5f1; font-size:10pt; } .rows { padding:3px 9px 7px; }
  .row { display:flex; justify-content:space-between; gap:8px; padding:5px 0; border-bottom:1px solid #e3e9e5; } .row:last-child { border-bottom:0; }
  .row span { color:#53645c; font-size:8.5pt; } .row strong { font-size:9pt; text-align:right; white-space:nowrap; }
  .total { margin-top:2px; border-top:1px solid #8ca494; } .total span, .total strong { color:#254b3e; font-weight:800; }
  .note { margin:10px 0 0; padding-top:8px; border-top:1px solid #c9d3cd; color:#5b6d64; font-size:8pt; line-height:1.35; }
</style></head><body>
  <header class="header"><div><div class="brand">RataLab</div><h1>Riepilogo simulazione finanziamento</h1></div><p class="date">Elaborato il ${today}</p></header>
  <section class="highlight"><span>Rata mensile stimata</span><strong>${formatCurrency(result.monthlyInstallment)}</strong><small>per ${input.months} ${input.months === 1 ? 'mese' : 'mesi'}</small></section>
  <main class="columns">
    <section class="card"><h2>Dati inseriti</h2><div class="rows">
      ${row('Prezzo / importo richiesto', formatCurrency(input.amount))}${row('Anticipo', formatCurrency(input.downPayment))}${row('Durata', `${input.months} mesi`)}${row('TAN annuo', formatPercent(input.tan))}${row('Maxi-rata finale', balloon)}${row('Costi iniziali finanziati', input.financeInitialCosts ? 'Sì' : 'No')}
    </div></section>
    <section class="card"><h2>Costi indicati</h2><div class="rows">
      ${row('Istruttoria', formatCurrency(input.initialFees))}${row('Incasso rata', `${formatCurrency(input.monthlyFees)} / mese`)}${row('Assicurazione', formatCurrency(input.insurance))}${row('Costi totali inseriti', formatCurrency(result.totalFees))}
    </div></section>
    <section class="card"><h2>Esito del calcolo</h2><div class="rows">
      ${row('Capitale finanziato', formatCurrency(result.financedPrincipal))}${row('Interessi totali', formatCurrency(result.totalInterest))}${row('TAEG stimato', formatPercent(result.apr))}${row('Ultima rata complessiva', formatCurrency(result.finalInstallment))}${row('Esborso complessivo', formatCurrency(result.totalOutlay)).replace('class="row"', 'class="row total"')}
    </div></section>
  </main>
  <p class="note">Simulazione informativa elaborata con i dati inseriti. Il TAEG è una stima e non costituisce un'offerta di credito. Per le condizioni effettive fa fede la documentazione del finanziatore.</p>
  <script>window.onload = () => { window.focus(); window.print(); }<\/script>
</body></html>`);
  printWindow.document.close();
}

function printCurrentSimulation() {
  document.body.classList.add('printing-simulation');
  const clearPrintMode = () => document.body.classList.remove('printing-simulation');
  window.addEventListener('afterprint', clearPrintMode, { once: true });
  window.requestAnimationFrame(() => window.print());
}

function bindEvents() {
  [
    'amount',
    'down-payment',
    'months',
    'tan',
    'initial-fees',
    'monthly-fees',
    'insurance',
    'balloon',
  ].forEach((id) => $(id).addEventListener('input', recalculate));

  $('finance-initial-costs').addEventListener('change', recalculate);
  $('has-balloon').addEventListener('change', () => {
    setBalloonVisibility($('has-balloon').checked);
    recalculate();
  });
  $('monthly-income').addEventListener('input', updateIncomeRatio);
  ['budget-payment', 'budget-months', 'budget-tan'].forEach((id) =>
    $(id).addEventListener('input', updateBudgetCalculator));

  $('duration-pills').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-months]');
    if (!button) return;
    $('months').value = button.dataset.months;
    recalculate();
  });

  $('reset-calculator').addEventListener('click', () => {
    applyLoanInput(defaultLoanInput);
    recalculate();
    showStatus('Valori ripristinati');
  });

  $('save-offer').addEventListener('click', saveCurrentOffer);
  $('evaluate-affordability').addEventListener('click', openApprovalAssessment);
  $('copy-link').addEventListener('click', copyShareLink);
  $('print-result').addEventListener('click', printSimulation);

  $('offer-table-body').addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-id]');
    if (!button) return;
    savedOffers = savedOffers.filter((offer) => offer.id !== button.dataset.deleteId);
    persistOffers();
    renderSavedOffers();
  });

  $('clear-offers').addEventListener('click', () => {
    savedOffers = [];
    persistOffers();
    renderSavedOffers();
  });
}

applyLoanInput(readInputFromUrl());
$('offer-name').value = `Offerta ${savedOffers.length + 1}`;
setText('current-year', String(new Date().getFullYear()));
bindEvents();
recalculate();
updateBudgetCalculator();
renderSavedOffers();
