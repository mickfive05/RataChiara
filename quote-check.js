import { analyzeQuote } from './finance.js';
import './theme.js';
const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat('it-IT', { useGrouping: 'always', style: 'currency', currency: 'EUR' });
const number = new Intl.NumberFormat('it-IT', { useGrouping: 'always', maximumFractionDigits: 2 });
const value = (id) => $(id).value === '' ? '' : Math.max(0, Number($(id).value) || 0);
function percent(value) { return value === null || value === '' ? 'Non indicato' : `${number.format(value)}%`; }
function render() {
  const result = analyzeQuote({ receivedAmount: value('received-amount'), installment: value('installment'), months: value('quote-months'), finalInstallment: value('final-installment'), initialFees: value('quote-initial-fees'), monthlyFees: value('quote-monthly-fees'), insurance: value('quote-insurance'), downPayment: value('quote-down-payment'), otherCosts: value('quote-other-costs'), declaredTan: value('declared-tan'), declaredApr: value('declared-apr') });
  $('quote-total-repaid').textContent = money.format(result.totalRepaid); $('quote-received').textContent = money.format(result.received); $('quote-cost').textContent = money.format(result.financingCost); $('quote-accessory').textContent = money.format(result.accessoryCosts); $('quote-tan').textContent = percent(result.declaredTan); $('quote-declared-apr').textContent = percent(result.declaredApr); $('quote-estimated-apr').textContent = result.estimatedApr === null ? 'N/D' : percent(result.estimatedApr);
  $('quote-warnings').innerHTML = (result.warnings.length ? result.warnings : ['Nessuna delle soglie interne di attenzione è stata superata. Non è una verifica di regolarità o convenienza. Confronta sempre il SECCI prima di firmare.']).map((warning) => `<li>${warning}</li>`).join('');
}
$('quote-form').addEventListener('submit', (event) => { event.preventDefault(); render(); });
document.querySelectorAll('#quote-form input').forEach((input) => input.addEventListener('input', render));
$('current-year').textContent = new Date().getFullYear(); render();
