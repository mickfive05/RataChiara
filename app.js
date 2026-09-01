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
  $('print-result').addEventListener('click', () => window.print());

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
