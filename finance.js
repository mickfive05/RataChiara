const EPSILON = 1e-10;

export const defaultLoanInput = Object.freeze({
  amount: 20000,
  downPayment: 2000,
  months: 60,
  tan: 6.9,
  initialFees: 250,
  monthlyFees: 2,
  insurance: 0,
  balloon: 0,
  financeInitialCosts: false,
});

function finiteOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

function nonNegative(value) {
  return Math.max(0, finiteOrZero(value));
}

function paymentForLoan(principal, monthlyRate, months, balloon) {
  if (months <= 0 || principal <= 0) return 0;
  if (Math.abs(monthlyRate) < EPSILON) {
    return Math.max(0, (principal - balloon) / months);
  }

  const discount = Math.pow(1 + monthlyRate, -months);
  const numerator = (principal - balloon * discount) * monthlyRate;
  const denominator = 1 - discount;
  return Math.max(0, numerator / denominator);
}

function estimateApr(netAdvance, payments) {
  if (netAdvance <= 0 || payments.length === 0) return null;

  const presentValueDifference = (monthlyRate) => {
    let presentValue = 0;
    for (let index = 0; index < payments.length; index += 1) {
      presentValue += payments[index] / Math.pow(1 + monthlyRate, index + 1);
    }
    return presentValue - netAdvance;
  };

  if (presentValueDifference(0) <= 0) return 0;

  let low = 0;
  let high = 0.25;
  while (presentValueDifference(high) > 0 && high < 128) {
    high *= 2;
  }
  if (high >= 128 && presentValueDifference(high) > 0) return null;

  for (let iteration = 0; iteration < 160; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (presentValueDifference(midpoint) > 0) {
      low = midpoint;
    } else {
      high = midpoint;
    }
  }

  const monthlyRate = (low + high) / 2;
  return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
}

/** Analizza i flussi di un preventivo già ricevuto, senza inviare dati altrove. */
export function analyzeQuote(rawInput) {
  const received = nonNegative(rawInput.receivedAmount);
  const months = Math.max(1, Math.round(nonNegative(rawInput.months)));
  const installment = nonNegative(rawInput.installment);
  const finalInstallment = nonNegative(rawInput.finalInstallment);
  const downPayment = nonNegative(rawInput.downPayment);
  const initialFees = nonNegative(rawInput.initialFees);
  const monthlyFees = nonNegative(rawInput.monthlyFees);
  const insurance = nonNegative(rawInput.insurance);
  const otherCosts = nonNegative(rawInput.otherCosts);
  const declaredTan = rawInput.declaredTan === '' || rawInput.declaredTan === undefined
    ? null : nonNegative(Number(rawInput.declaredTan));
  const declaredApr = rawInput.declaredApr === '' || rawInput.declaredApr === undefined
    ? null : nonNegative(Number(rawInput.declaredApr));
  const payments = Array.from({ length: months }, (_, index) =>
    installment + monthlyFees + (index === months - 1 ? finalInstallment : 0));
  const totalInstallments = payments.reduce((sum, payment) => sum + payment, 0);
  const accessoryCosts = initialFees + monthlyFees * months + insurance + otherCosts;
  const totalRepaid = downPayment + initialFees + insurance + otherCosts + totalInstallments;
  const financingCost = Math.max(0, totalRepaid - downPayment - received);
  const estimatedApr = estimateApr(Math.max(0, received - initialFees - insurance - otherCosts), payments);
  const warnings = [];
  if (received <= 0) warnings.push('Inserisci l’importo che ricevi realmente per ottenere un’analisi completa.');
  if (finalInstallment > 0 && received > 0 && finalInstallment / received >= 0.3) warnings.push('La maxi-rata finale pesa almeno il 30% dell’importo ricevuto.');
  if (accessoryCosts > 0 && received > 0 && accessoryCosts / received >= 0.08) warnings.push('I costi accessori incidono per almeno l’8% della somma ricevuta.');
  if (declaredApr !== null && estimatedApr !== null && Math.abs(declaredApr - estimatedApr) >= 0.35) warnings.push('Il TAEG stimato dai flussi è diverso da quello dichiarato: verifica quali costi sono inclusi.');
  if (declaredTan !== null && declaredApr !== null && declaredApr + 0.01 < declaredTan) warnings.push('Il TAEG dichiarato risulta inferiore al TAN: ricontrolla i dati del preventivo.');
  if (received > 0 && totalRepaid - downPayment > received * 1.35) warnings.push('Il totale restituito supera del 35% l’importo ricevuto. Valuta durata, tasso e costi.');
  return { received, months, installment, finalInstallment, downPayment, initialFees, monthlyFees, insurance, otherCosts, declaredTan, declaredApr, totalRepaid, financingCost, accessoryCosts, estimatedApr, warnings };
}

/** Indicatore orientativo di sostenibilità: non usa né simula dati creditizi. */
export function assessAffordability(rawInput) {
  const income = nonNegative(rawInput.income) + nonNegative(rawInput.otherIncome);
  const requestedAmount = nonNegative(rawInput.requestedAmount);
  const housing = nonNegative(rawInput.housing);
  const fixedExpenses = nonNegative(rawInput.fixedExpenses);
  const existingPayments = nonNegative(rawInput.existingPayments);
  const newPayment = nonNegative(rawInput.newPayment);
  const dependants = Math.round(nonNegative(rawInput.dependants));
  const employmentType = String(rawInput.employmentType || 'permanent');
  const seniorityMonths = Math.round(nonNegative(rawInput.seniorityMonths));
  const paymentHistory = String(rawInput.paymentHistory || 'regular');
  const age = Math.round(nonNegative(rawInput.age));
  const loanMonths = Math.max(1, Math.round(nonNegative(rawInput.loanMonths)) || 60);
  const contractRemainingMonths = Math.round(nonNegative(rawInput.contractRemainingMonths));
  const hasGuarantor = Boolean(rawInput.hasGuarantor);
  const totalPayments = existingPayments + newPayment;
  const totalOutgoings = housing + fixedExpenses + totalPayments;
  const residualIncome = income - totalOutgoings;
  const paymentRatio = income > 0 ? (totalPayments / income) * 100 : null;
  const amountToIncomeMonths = income > 0 && requestedAmount > 0 ? requestedAmount / income : null;
  const incomeAfterHousing = income - housing - fixedExpenses;
  let level = 'high';
  if (income > 0 && paymentRatio <= 30 && residualIncome >= 650 + dependants * 120) level = 'good';
  else if (income > 0 && paymentRatio <= 40 && residualIncome >= 350 + dependants * 100) level = 'review';
  const messages = [];
  if (income <= 0) messages.push('Inserisci le entrate mensili per ottenere un indicatore utile.');
  if (paymentRatio !== null && paymentRatio > 35) messages.push('Rate presenti e nuova rata incidono oltre il 35% delle entrate mensili.');
  if (residualIncome < 500 + dependants * 100) messages.push('Il margine dopo spese e rate è contenuto: considera imprevisti e spese variabili.');
  if (housing > income * 0.4) messages.push('Il costo della casa assorbe una parte rilevante delle entrate.');
  if (existingPayments > 0) messages.push('Le rate già in corso riducono il margine disponibile per una nuova richiesta.');
  const suggestions = [];
  if (newPayment > 0) suggestions.push(`Ridurre la rata di ${Math.round(newPayment * 0.15)} € al mese aumenterebbe il margine disponibile.`);
  if (paymentRatio !== null && paymentRatio > 30) suggestions.push('Un anticipo maggiore o un importo richiesto più basso può migliorare l’incidenza della rata.');
  if (dependants > 0) suggestions.push('Valuta il budget familiare complessivo, includendo le spese variabili delle persone a carico.');
  const employmentPoints = { permanent: 12, pensioner: 11, selfEmployed: 4, fixedTerm: -18, temporary: -16, unemployed: -30 }[employmentType] ?? 0;
  const seniorityPoints = seniorityMonths >= 36 ? 8 : seniorityMonths >= 12 ? 4 : seniorityMonths >= 6 ? 0 : -7;
  const historyPoints = { regular: 5, occasionalDelays: -12, recentDelays: -30 }[paymentHistory] ?? 0;
  const affordabilityPoints = level === 'good' ? 20 : level === 'review' ? 5 : -25;
  let contractDurationPoints = 0;
  if (employmentType === 'fixedTerm' || employmentType === 'temporary') {
    contractDurationPoints = contractRemainingMonths >= loanMonths ? -5 : hasGuarantor ? -10 : -30;
    if (contractRemainingMonths < loanMonths) messages.push('La durata del finanziamento supera quella residua del contratto: questa differenza riduce il punteggio interno, non indica una probabilità di approvazione.');
  }
  const guarantorPoints = hasGuarantor ? 10 : 0;
  const amountPoints = amountToIncomeMonths === null ? 0
    : amountToIncomeMonths <= 6 ? 2
      : amountToIncomeMonths <= 12 ? 0
        : amountToIncomeMonths <= 18 ? -7 : -14;
  const ageAtEnd = age > 0 ? age + Math.ceil(loanMonths / 12) : null;
  const ageEligible = age === 0 || age >= 18;
  const amountEligible = requestedAmount >= 200 && requestedAmount <= 75000;
  const hasPositiveMargin = income > 0 && residualIncome > 0;
  const hasViablePayment = paymentRatio !== null && paymentRatio <= 100;
  const assessmentAvailable = ageEligible && amountEligible && hasPositiveMargin && hasViablePayment;
  const agePoints = ageAtEnd !== null && ageAtEnd > 75 ? -35 : age > 0 && age < 25 && seniorityMonths < 12 ? -6 : 0;
  const rawProbability = Math.round(Math.min(95, Math.max(5, 55 + affordabilityPoints + employmentPoints + seniorityPoints + historyPoints + contractDurationPoints + guarantorPoints + agePoints + amountPoints)));
  const probability = !assessmentAvailable ? 0
    : paymentRatio > 60 ? Math.min(rawProbability, 10)
      : paymentRatio > 50 ? Math.min(rawProbability, 20)
        : residualIncome < 250 ? Math.min(rawProbability, 15)
          : residualIncome < 500 + dependants * 100 ? Math.min(rawProbability, 35)
            : rawProbability;
  return { income, requestedAmount, amountToIncomeMonths, housing, fixedExpenses, existingPayments, newPayment, dependants, employmentType, seniorityMonths, paymentHistory, age, ageAtEnd, ageEligible, amountEligible, hasPositiveMargin, hasViablePayment, assessmentAvailable, loanMonths, contractRemainingMonths, hasGuarantor, totalPayments, totalOutgoings, residualIncome, paymentRatio, incomeAfterHousing, level, probability, messages, suggestions };
}

export function calculateLoan(rawInput) {
  const amount = nonNegative(rawInput.amount);
  const downPayment = Math.min(nonNegative(rawInput.downPayment), amount);
  const months = Math.max(1, Math.round(nonNegative(rawInput.months)));
  const tan = nonNegative(rawInput.tan);
  const initialFees = nonNegative(rawInput.initialFees);
  const monthlyFees = nonNegative(rawInput.monthlyFees);
  const insurance = nonNegative(rawInput.insurance);
  const netCredit = Math.max(0, amount - downPayment);
  const financedCosts = rawInput.financeInitialCosts ? initialFees + insurance : 0;
  const upfrontCosts = rawInput.financeInitialCosts ? 0 : initialFees + insurance;
  const financedPrincipal = netCredit + financedCosts;
  const balloon = Math.min(nonNegative(rawInput.balloon), financedPrincipal);
  const monthlyRate = tan / 100 / 12;
  const baseInstallment = paymentForLoan(financedPrincipal, monthlyRate, months, balloon);

  const schedule = [];
  let balance = financedPrincipal;
  let totalInterest = 0;
  let totalCreditPayments = 0;

  for (let month = 1; month <= months; month += 1) {
    const openingBalance = balance;
    const interest = openingBalance * monthlyRate;
    let regularPrincipal = Math.max(0, baseInstallment - interest);
    regularPrincipal = Math.min(regularPrincipal, openingBalance);
    let closingBalance = Math.max(0, openingBalance - regularPrincipal);
    let balloonPayment = 0;

    if (month === months) {
      balloonPayment = closingBalance;
      closingBalance = 0;
    }

    const totalPayment = baseInstallment + monthlyFees + balloonPayment;
    totalInterest += interest;
    totalCreditPayments += totalPayment;

    schedule.push({
      month,
      openingBalance,
      installment: baseInstallment,
      interest,
      principal: regularPrincipal,
      monthlyFees,
      balloon: balloonPayment,
      totalPayment,
      closingBalance,
    });

    balance = closingBalance;
  }

  const actualBalloon = schedule.at(-1)?.balloon ?? 0;
  const monthlyInstallment = baseInstallment + monthlyFees;
  const finalInstallment = monthlyInstallment + actualBalloon;
  const totalFees = initialFees + insurance + monthlyFees * months;
  const totalOutlay = downPayment + upfrontCosts + totalCreditPayments;
  const totalCreditCost = Math.max(0, totalOutlay - amount);
  const aprNetAdvance = Math.max(0, netCredit - upfrontCosts);
  const apr = estimateApr(
    aprNetAdvance,
    schedule.map((row) => row.totalPayment),
  );
  const costPer1000 = netCredit > 0 ? (totalCreditCost / netCredit) * 1000 : 0;

  return {
    requestedAmount: amount,
    cashDownPayment: downPayment,
    netCredit,
    financedPrincipal,
    monthlyInstallment,
    baseInstallment,
    finalInstallment,
    totalInterest,
    totalFees,
    upfrontCosts,
    totalCreditPayments,
    totalOutlay,
    totalCreditCost,
    apr,
    costPer1000,
    schedule,
  };
}

export function calculateAffordablePrincipal(
  maximumMonthlyPayment,
  months,
  tan,
  monthlyFees = 0,
  balloon = 0,
) {
  const payment = Math.max(0, maximumMonthlyPayment - nonNegative(monthlyFees));
  const numberOfMonths = Math.max(1, Math.round(nonNegative(months)));
  const monthlyRate = nonNegative(tan) / 100 / 12;
  const finalBalloon = nonNegative(balloon);

  if (Math.abs(monthlyRate) < EPSILON) {
    return payment * numberOfMonths + finalBalloon;
  }

  const discount = Math.pow(1 + monthlyRate, -numberOfMonths);
  return payment * ((1 - discount) / monthlyRate) + finalBalloon * discount;
}
