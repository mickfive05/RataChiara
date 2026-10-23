import { assessAffordability, calculateLoan, defaultLoanInput } from './finance.js';
import './theme.js';

const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const percent = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
const value = (id) => Math.max(0, Number($(id).value) || 0);
let linkedLoanInput = null;

function ensureAgeField() {
  if ($('approval-age')) return;
  const label = document.createElement('label');
  label.htmlFor = 'approval-age';
  label.innerHTML = 'Età<input id="approval-age" type="number" min="18" max="100" step="1" value="35" /><small>anni</small>';
  $('approval-income').closest('label').after(label);
}

function ensureRequestedAmountField() {
  if ($('approval-requested-amount')) return;
  const label = document.createElement('label');
  label.htmlFor = 'approval-requested-amount';
  label.innerHTML = 'Importo richiesto <span>€</span><input id="approval-requested-amount" type="number" min="0" step="0.01" value="10000" />';
  $('approval-age').closest('label').after(label);
}

function ensureLoanCalculatorFields() {
  const paymentInput = $('approval-new-payment');
  const paymentLabel = paymentInput.closest('label');
  paymentLabel.childNodes[0].nodeValue = 'Rata stimata ';
  paymentInput.readOnly = true;
  paymentInput.setAttribute('aria-label', 'Rata mensile stimata');
  if (!paymentLabel.querySelector('small')) {
    const note = document.createElement('small');
    note.textContent = 'calcolata da importo, durata e TAN';
    paymentLabel.append(note);
  }
  if ($('approval-tan')) return;
  const label = document.createElement('label');
  label.htmlFor = 'approval-tan';
  label.innerHTML = 'TAN <span>%</span><input id="approval-tan" type="number" min="0" max="50" step="0.01" value="6.9" />';
  $('approval-loan-months').closest('label').after(label);
}

function ensureBalloonFields() {
  if ($('approval-has-balloon')) return;
  const monthsLabel = $('approval-loan-months').closest('label');
  const toggle = document.createElement('label');
  toggle.className = 'switch-row approval-balloon-toggle';
  toggle.innerHTML = '<span><strong>Prevede una maxi-rata finale?</strong><small>Attivala se è previsto un importo aggiuntivo da pagare con l’ultima rata.</small></span><input id="approval-has-balloon" type="checkbox" aria-controls="approval-balloon-field" aria-expanded="false" /><i aria-hidden="true"></i>';
  const field = document.createElement('label');
  field.id = 'approval-balloon-field';
  field.className = 'conditional-field';
  field.hidden = true;
  field.innerHTML = 'Maxi-rata finale (€) <span>€</span><input id="approval-balloon" type="number" min="0" step="100" disabled /><small>Lascia 0 se non prevista.</small>';
  monthsLabel.after(field);
  monthsLabel.after(toggle);

  const summary = document.createElement('section');
  summary.id = 'approval-balloon-summary';
  summary.className = 'approval-balloon-summary';
  summary.hidden = true;
  summary.innerHTML = '<h3>Maxi-rata finale</h3><dl><div><dt>Rata mensile ordinaria</dt><dd id="approval-monthly-payment">€ 0,00</dd></div><div><dt>Maxi-rata finale</dt><dd id="approval-balloon-amount">€ 0,00</dd></div><div><dt>Ultima rata complessiva</dt><dd id="approval-final-payment">€ 0,00</dd></div></dl><p id="approval-balloon-warning" hidden></p>';
  $('approval-messages').closest('.approval-insights').before(summary);
}

function setBalloonVisibility(enabled) {
  const field = $('approval-balloon-field');
  field.hidden = !enabled;
  field.classList.toggle('is-visible', enabled);
  $('approval-balloon').disabled = !enabled;
  $('approval-has-balloon').setAttribute('aria-expanded', String(enabled));
  if (!enabled) $('approval-balloon').value = 0;
}

function importLinkedSimulation() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('simulazione') !== '1') return false;
  const numberParam = (key, fallback = 0) => {
    const parsed = Number(params.get(key));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  linkedLoanInput = {
    ...defaultLoanInput,
    amount: numberParam('importo'),
    downPayment: numberParam('anticipo'),
    months: numberParam('mesi', defaultLoanInput.months),
    tan: numberParam('tan', defaultLoanInput.tan),
    initialFees: numberParam('istruttoria'),
    monthlyFees: numberParam('spese_rata'),
    insurance: numberParam('assicurazione'),
    balloon: numberParam('maxirata'),
    financeInitialCosts: params.get('costi_finanziati') === '1',
  };
  const importedResult = calculateLoan(linkedLoanInput);
  $('approval-requested-amount').value = importedResult.netCredit;
  $('approval-loan-months').value = linkedLoanInput.months;
  $('approval-tan').value = linkedLoanInput.tan;
  const hasBalloon = linkedLoanInput.balloon > 0;
  $('approval-has-balloon').checked = hasBalloon;
  $('approval-balloon').value = hasBalloon ? linkedLoanInput.balloon : 0;
  setBalloonVisibility(hasBalloon);
  return true;
}

function prepareBlankForm() {
  document.querySelectorAll('#approval-form input:not([type="checkbox"])').forEach((input) => {
    input.value = '';
  });
  document.querySelectorAll('#approval-form select').forEach((select) => {
    select.value = '';
  });
  $('approval-guarantor').checked = false;
}

function configureRequiredFields() {
  [
    'approval-income', 'approval-age', 'approval-requested-amount',
    'approval-loan-months', 'approval-tan',
  ].forEach((id) => { $(id).required = true; });
  [
    ['approval-employment-type', 'Seleziona il contratto'],
    ['approval-payment-history', 'Seleziona la regolarità'],
  ].forEach(([id, label]) => {
    const select = $(id);
    if (!select.querySelector('option[value=""]')) {
      const placeholder = new Option(label, '', true, true);
      placeholder.disabled = true;
      select.prepend(placeholder);
    }
    select.required = true;
  });
}

function loanInputForAssessment() {
  if (!linkedLoanInput) {
    return {
      ...defaultLoanInput,
      amount: value('approval-requested-amount'),
      downPayment: 0,
      months: value('approval-loan-months'),
      tan: value('approval-tan'),
      initialFees: 0,
      monthlyFees: 0,
      insurance: 0,
      balloon: $('approval-has-balloon').checked ? value('approval-balloon') : 0,
      financeInitialCosts: false,
    };
  }

  return {
    ...linkedLoanInput,
    amount: value('approval-requested-amount') + linkedLoanInput.downPayment,
    months: value('approval-loan-months'),
    tan: value('approval-tan'),
    balloon: $('approval-has-balloon').checked ? value('approval-balloon') : 0,
  };
}

function calculateEstimatedPayment() {
  const loan = calculateLoan(loanInputForAssessment());
  $('approval-new-payment').value = loan.monthlyInstallment.toFixed(2);
  return loan.monthlyInstallment;
}

function updateLivePayment() {
  const calculatorFields = ['approval-requested-amount', 'approval-loan-months', 'approval-tan'];
  const complete = calculatorFields.every((id) => $(id).value.trim() !== '');
  $('approval-new-payment').value = complete ? calculateLoan(loanInputForAssessment()).monthlyInstallment.toFixed(2) : '';
}

function renderBalloonSummary(loan) {
  const hasBalloon = $('approval-has-balloon').checked && loan.schedule.at(-1).balloon > 0;
  $('approval-balloon-summary').hidden = !hasBalloon;
  if (!hasBalloon) return;
  $('approval-monthly-payment').textContent = money.format(loan.monthlyInstallment);
  $('approval-balloon-amount').textContent = money.format(loan.schedule.at(-1).balloon);
  $('approval-final-payment').textContent = money.format(loan.finalInstallment);
  const warning = $('approval-balloon-warning');
  const share = loan.netCredit > 0 ? loan.schedule.at(-1).balloon / loan.netCredit : 0;
  warning.hidden = share < 0.3;
  warning.textContent = `Attenzione: la maxi-rata rappresenta il ${percent.format(share * 100)}% dell'importo finanziato.`;
}

function updateContractField() {
  const employmentType = $('approval-employment-type').value;
  const hasEndDate = ['fixedTerm', 'temporary'].includes(employmentType);
  const hasSeniority = !['pensioner', 'unemployed'].includes(employmentType);
  const contractRemaining = $('approval-contract-remaining');
  const seniority = $('approval-seniority');
  contractRemaining.closest('label').hidden = !hasEndDate;
  seniority.closest('label').hidden = !hasSeniority;
  contractRemaining.required = hasEndDate;
  seniority.required = hasSeniority;
}

function showEmptyAssessment() {
  const status = $('approval-status');
  status.className = 'approval-status status-empty';
  $('approval-band').textContent = 'Pronto per la stima';
  $('approval-probability').textContent = '—';
  $('approval-status-copy').textContent = 'Completa tutti i campi e premi “Calcola l’indicatore”.';
  document.querySelector('.approval-metrics').hidden = true;
  $('approval-messages').closest('.approval-insights').hidden = true;
  $('approval-suggestions').closest('.approval-suggestions').hidden = true;
}

function showIncompleteAssessment() {
  showEmptyAssessment();
  $('approval-status-copy').textContent = 'Completa i campi richiesti per ricevere l’indicatore orientativo.';
}

function hasRequiredAssessmentData() {
  const requiredIds = [
    'approval-income', 'approval-age', 'approval-requested-amount',
    'approval-loan-months', 'approval-tan', 'approval-employment-type',
    'approval-payment-history',
  ];
  const employmentType = $('approval-employment-type').value;
  if (!['pensioner', 'unemployed'].includes(employmentType)) requiredIds.push('approval-seniority');
  if (['fixedTerm', 'temporary'].includes(employmentType)) requiredIds.push('approval-contract-remaining');
  return requiredIds.every((id) => $(id).value.trim() !== '');
}

function guidance(result) {
  const factors = [];
  const suggestions = [];
  const ratio = result.paymentRatio;
  const residualTarget = 500 + result.dependants * 100;

  if (!result.amountEligible) {
    factors.push('Importo richiesto fuori dalla fascia di 200 €–75.000 € supportata da questo strumento (non è una definizione normativa).');
    suggestions.push('Inserisci un importo compreso tra 200 € e 75.000 € oppure valuta un prodotto finanziario diverso.');
  }
  if (!result.hasPositiveMargin) {
    factors.push('Spese e rate superano le entrate dichiarate: non resta margine mensile per il rimborso.');
    suggestions.push('Riduci prima spese o debiti esistenti: con un margine mensile negativo la richiesta non è sostenibile.');
  }
  if (!result.hasViablePayment) {
    factors.push('Le rate complessive superano le entrate mensili dichiarate: piano non sostenibile.');
  }

  if (result.income <= 0) {
    factors.push('Mancano entrate mensili: non è possibile stimare la capacità di rimborso.');
  } else if (ratio <= 33.33) {
    factors.push(`Rate complessive al ${percent.format(ratio)}% delle entrate: entro la soglia prudenziale di circa un terzo.`);
  } else {
    const reduction = Math.ceil(result.totalPayments - result.income / 3);
    factors.push(`Rate complessive al ${percent.format(ratio)}% delle entrate: oltre la soglia prudenziale di circa un terzo.`);
    suggestions.push(`Per rientrare vicino a un terzo delle entrate, riduci le rate complessive di circa ${reduction} € al mese.`);
  }

  if (result.residualIncome >= residualTarget) {
    factors.push(`Dopo spese e rate restano ${Math.round(result.residualIncome)} € al mese: margine adeguato per questa stima.`);
  } else {
    factors.push(`Dopo spese e rate restano ${Math.max(0, Math.round(result.residualIncome))} €: margine ridotto rispetto a ${residualTarget} € considerati prudenti.`);
    suggestions.push('Riduci l’importo richiesto oppure rivedi le spese fisse per preservare un margine per imprevisti.');
  }

  if (result.housing > result.income * 0.4) factors.push('Affitto o mutuo assorbono oltre il 40% delle entrate dichiarate.');
  if (result.existingPayments > 0) factors.push(`Sono presenti ${Math.round(result.existingPayments)} € di rate già in corso.`);
  if (result.amountToIncomeMonths === null) {
    factors.push('Inserisci l’importo richiesto per completare la stima del profilo.');
  } else if (result.amountToIncomeMonths <= 6) {
    factors.push(`Importo richiesto pari a circa ${percent.format(result.amountToIncomeMonths)} mensilità di entrate: contenuto rispetto al reddito dichiarato.`);
  } else if (result.amountToIncomeMonths <= 12) {
    factors.push(`Importo richiesto pari a circa ${percent.format(result.amountToIncomeMonths)} mensilità di entrate: valutato insieme a rata e durata.`);
  } else {
    factors.push(`Importo richiesto pari a circa ${percent.format(result.amountToIncomeMonths)} mensilità di entrate: richiede una capacità di rimborso più solida.`);
    suggestions.push('Ridurre l’importo richiesto o aumentare l’anticipo può migliorare il profilo, senza allungare inutilmente la durata.');
  }

  const employmentLabels = {
    permanent: 'Il contratto a tempo indeterminato sostiene la stabilità reddituale stimata.',
    pensioner: 'La pensione è trattata come entrata ricorrente; importo e durata saranno valutati dal finanziatore.',
    selfEmployed: 'Per autonomi e partita IVA, la continuità dei redditi dichiarati è particolarmente rilevante.',
    fixedTerm: 'Il contratto a tempo determinato è un fattore di maggiore incertezza nella stima.',
    temporary: 'Il lavoro intermittente o in somministrazione è un fattore di maggiore incertezza nella stima.',
    unemployed: 'L’assenza di un reddito da lavoro ricorrente riduce sensibilmente il punteggio orientativo.',
  };
  factors.push(employmentLabels[result.employmentType] || 'Tipo di lavoro non classificato.');

  if (result.seniorityMonths >= 36 && !['pensioner', 'unemployed'].includes(result.employmentType)) {
    factors.push('Anzianità lavorativa di almeno 36 mesi: elemento favorevole nella stima.');
  } else if (result.seniorityMonths < 6 && !['pensioner', 'unemployed'].includes(result.employmentType)) {
    factors.push('Anzianità lavorativa inferiore a 6 mesi: continuità del reddito meno dimostrabile.');
  }

  if (['fixedTerm', 'temporary'].includes(result.employmentType)) {
    if (result.contractRemainingMonths < result.loanMonths) {
      factors.push('La durata del finanziamento supera la scadenza residua del contratto.');
      if (!result.hasGuarantor) suggestions.push(`Valuta una durata non oltre i ${result.contractRemainingMonths} mesi residui del contratto oppure un garante con reddito verificabile.`);
    } else {
      factors.push('La durata del finanziamento non supera la scadenza dichiarata del contratto.');
    }
  }

  if (result.hasGuarantor) factors.push('È indicato un garante: può aiutare, ma verrà valutata anche la sua affidabilità.');
  if (!result.ageEligible) {
    factors.push('Età inferiore a 18 anni: il credito al consumo richiede la maggiore età.');
    suggestions.push('La richiesta può essere presentata solo dopo il compimento dei 18 anni.');
  } else if (result.ageAtEnd !== null && result.ageAtEnd > 75) {
    factors.push(`Età prevista alla fine del piano: ${result.ageAtEnd} anni, oltre la soglia interna di 75 anni, che non è un limite universale.`);
    suggestions.push('Riduci la durata oppure verifica prodotti che prevedono un limite di età alla scadenza più elevato.');
  } else if (result.age > 0 && result.age < 25 && result.seniorityMonths < 12 && !['pensioner', 'unemployed'].includes(result.employmentType)) {
    factors.push('Età giovane e anzianità lavorativa breve: la continuità del reddito è ancora poco documentabile.');
  } else if (result.ageAtEnd !== null) {
    factors.push(`Età prevista alla fine del piano: ${result.ageAtEnd} anni, entro la soglia interna di 75 anni.`);
  }
  if (result.paymentHistory === 'regular') {
    factors.push('Hai indicato nessun ritardo noto: il finanziatore verificherà comunque le banche dati creditizie.');
  } else {
    factors.push('Ritardi di pagamento dichiarati: possono incidere negativamente sulla valutazione.');
    suggestions.push('Verifica che le informazioni nelle banche dati creditizie siano corrette e aggiornate prima della richiesta.');
  }

  if (!suggestions.length) suggestions.push('Mantieni il margine attuale e confronta sempre il TAEG e la durata prima di inviare la richiesta.');
  return { factors, suggestions };
}

function factorTone(text) {
  if (/entro la soglia|margine adeguato|tempo indeterminato|almeno 36 mesi|non supera la scadenza|garante: può aiutare|nessun ritardo noto|entro il limite usuale|contenuto rispetto/i.test(text)) return 'positive';
  if (/mancano entrate|oltre la soglia|margine ridotto|oltre il 40%|rate già in corso|maggiore incertezza|assenza di un reddito|inferiore a 6 mesi|supera la scadenza|ritardi di pagamento|oltre il limite usuale|età giovane|inferiore a 18 anni|richiede una capacità|fuori dalla fascia|superano le entrate/i.test(text)) return 'risk';
  return 'neutral';
}

function render() {
  updateContractField();
  const loan = calculateLoan(loanInputForAssessment());
  const estimatedPayment = loan.monthlyInstallment;
  $('approval-new-payment').value = estimatedPayment.toFixed(2);
  renderBalloonSummary(loan);
  const result = assessAffordability({
    income: value('approval-income'), otherIncome: value('approval-other-income'), age: value('approval-age'), requestedAmount: value('approval-requested-amount'), housing: value('approval-housing'),
    fixedExpenses: value('approval-fixed-expenses'), existingPayments: value('approval-existing-payments'),
    newPayment: estimatedPayment, dependants: value('approval-dependants'),
    employmentType: $('approval-employment-type').value, seniorityMonths: value('approval-seniority'),
    paymentHistory: $('approval-payment-history').value, loanMonths: value('approval-loan-months'),
    contractRemainingMonths: value('approval-contract-remaining'), hasGuarantor: $('approval-guarantor').checked,
  });
  const band = !result.ageEligible
    ? ['high', 'Non richiedibile', 'Per il credito al consumo è necessaria la maggiore età.']
    : !result.assessmentAvailable
    ? ['high', 'Non valutabile', 'I dati inseriti non rispettano i requisiti minimi di questa stima.']
    : result.probability >= 70
    ? ['good', 'Indicatore favorevole', 'Il profilo inserito appare coerente con una richiesta sostenibile.']
    : result.probability >= 45
      ? ['review', 'Indicatore da approfondire', 'Alcuni fattori meritano attenzione prima della richiesta.']
      : ['high', 'Indicatore critico', 'I dati inseriti indicano criticità secondo le regole interne, da esaminare nel budget.'];
  const status = $('approval-status');
  document.querySelector('.approval-metrics').hidden = false;
  $('approval-messages').closest('.approval-insights').hidden = false;
  $('approval-suggestions').closest('.approval-suggestions').hidden = false;
  status.className = `approval-status status-${band[0]}`;
  $('approval-band').textContent = band[1];
  $('approval-probability').textContent = result.assessmentAvailable ? `${result.probability}/100` : 'N/D';
  $('approval-status-copy').textContent = band[2];
  $('approval-ratio').textContent = result.paymentRatio === null ? 'N/D' : `${percent.format(result.paymentRatio)}%`;
  $('approval-residual').textContent = money.format(result.residualIncome);
  $('approval-payments').textContent = money.format(result.totalPayments);
  const detail = guidance(result);
  $('approval-messages').innerHTML = detail.factors.map((item) => {
    const tone = factorTone(item);
    const icon = tone === 'positive' ? '✓' : tone === 'risk' ? '!' : '•';
    return `<li class="approval-factor factor-${tone}"><span aria-hidden="true">${icon}</span>${item}</li>`;
  }).join('');
  $('approval-suggestions').innerHTML = detail.suggestions.map((item) => `<li>${item}</li>`).join('');
}

ensureAgeField();
ensureRequestedAmountField();
ensureLoanCalculatorFields();
ensureBalloonFields();
prepareBlankForm();
importLinkedSimulation();
setBalloonVisibility($('approval-has-balloon').checked);
configureRequiredFields();
updateContractField();
const approvalForm = $('approval-form');
approvalForm.noValidate = false;
function runApprovalAssessment() {
  if (!approvalForm.reportValidity()) return;
  if (!hasRequiredAssessmentData()) {
    showIncompleteAssessment();
    return;
  }
  render();
}
approvalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  runApprovalAssessment();
});
approvalForm.querySelector('button[type="submit"]').addEventListener('click', (event) => {
  event.preventDefault();
  runApprovalAssessment();
});
$('approval-has-balloon').addEventListener('change', () => {
  setBalloonVisibility($('approval-has-balloon').checked);
  updateLivePayment();
  renderBalloonSummary(calculateLoan(loanInputForAssessment()));
});
$('approval-requested-amount').addEventListener('input', updateLivePayment);
$('approval-loan-months').addEventListener('input', updateLivePayment);
$('approval-tan').addEventListener('input', updateLivePayment);
$('approval-employment-type').addEventListener('change', updateContractField);
$('current-year').textContent = new Date().getFullYear();
updateLivePayment();
showEmptyAssessment();
