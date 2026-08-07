import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAffordablePrincipal,
  calculateLoan,
  assessAffordability,
  defaultLoanInput,
} from './finance.js';

function closeTo(actual, expected, tolerance = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test('zero-interest loan has equal installments and no credit cost', () => {
  const result = calculateLoan({
    ...defaultLoanInput,
    amount: 12000,
    downPayment: 0,
    months: 12,
    tan: 0,
    initialFees: 0,
    monthlyFees: 0,
    insurance: 0,
    balloon: 0,
  });

  closeTo(result.monthlyInstallment, 1000);
  closeTo(result.totalInterest, 0);
  closeTo(result.totalCreditCost, 0);
});

test('final balloon remains due at the last month', () => {
  const result = calculateLoan({
    ...defaultLoanInput,
    amount: 20000,
    downPayment: 0,
    months: 48,
    tan: 5,
    initialFees: 0,
    monthlyFees: 0,
    insurance: 0,
    balloon: 7000,
  });

  closeTo(result.schedule.at(-1).balloon, 7000, 1e-5);
  closeTo(result.schedule.at(-1).closingBalance, 0);
});

test('APR estimate is higher than TAN when mandatory costs are present', () => {
  const result = calculateLoan({
    ...defaultLoanInput,
    amount: 10000,
    downPayment: 0,
    months: 36,
    tan: 6,
    initialFees: 300,
    monthlyFees: 2,
    insurance: 150,
    balloon: 0,
    financeInitialCosts: false,
  });

  assert.notEqual(result.apr, null);
  assert.ok(result.apr > 6);
});

test('financed initial costs increase the financed principal', () => {
  const result = calculateLoan({
    ...defaultLoanInput,
    amount: 15000,
    downPayment: 3000,
    initialFees: 200,
    insurance: 400,
    financeInitialCosts: true,
  });

  assert.equal(result.netCredit, 12000);
  assert.equal(result.financedPrincipal, 12600);
  assert.equal(result.upfrontCosts, 0);
});

test('inverse calculator reverses a zero-interest monthly budget', () => {
  closeTo(calculateAffordablePrincipal(500, 24, 0), 12000);
});

test('affordability assessment separates sustainable and high-risk profiles', () => {
  const sustainable = assessAffordability({ income: 2400, requestedAmount: 10000, otherIncome: 0, housing: 650, fixedExpenses: 500, existingPayments: 100, newPayment: 250, dependants: 0, employmentType: 'permanent', seniorityMonths: 48, paymentHistory: 'regular', loanMonths: 60 });
  const stretched = assessAffordability({ income: 1500, requestedAmount: 10000, otherIncome: 0, housing: 650, fixedExpenses: 350, existingPayments: 180, newPayment: 420, dependants: 1, employmentType: 'temporary', seniorityMonths: 3, paymentHistory: 'recentDelays', loanMonths: 60, contractRemainingMonths: 6 });
  assert.equal(sustainable.level, 'good');
  assert.equal(stretched.level, 'high');
  assert.ok(stretched.messages.length > 0);
  assert.ok(sustainable.probability > stretched.probability);
});

test('fixed-term contract is penalized when loan outlasts the contract', () => {
  const base = { income: 2500, requestedAmount: 10000, housing: 500, fixedExpenses: 450, existingPayments: 0, newPayment: 250, dependants: 0, employmentType: 'fixedTerm', seniorityMonths: 24, paymentHistory: 'regular', loanMonths: 60 };
  const shortContract = assessAffordability({ ...base, contractRemainingMonths: 12, hasGuarantor: false });
  const coveredContract = assessAffordability({ ...base, contractRemainingMonths: 60, hasGuarantor: false });
  assert.ok(shortContract.probability < coveredContract.probability);
});

test('age at the end of the plan is included in the approval estimate', () => {
  const base = { income: 2800, requestedAmount: 10000, housing: 600, fixedExpenses: 500, existingPayments: 0, newPayment: 250, employmentType: 'permanent', seniorityMonths: 48, paymentHistory: 'regular', loanMonths: 60 };
  assert.ok(assessAffordability({ ...base, age: 45 }).probability > assessAffordability({ ...base, age: 73 }).probability);
});

test('underage applicant is not eligible for consumer credit estimate', () => {
  const result = assessAffordability({ income: 3000, housing: 0, fixedExpenses: 0, existingPayments: 0, newPayment: 100, employmentType: 'permanent', seniorityMonths: 60, paymentHistory: 'regular', loanMonths: 12, age: 16 });
  assert.equal(result.ageEligible, false);
  assert.equal(result.probability, 0);
});

test('requested amount is assessed together with income and other factors', () => {
  const base = { income: 2500, housing: 500, fixedExpenses: 400, existingPayments: 0, newPayment: 250, employmentType: 'permanent', seniorityMonths: 48, paymentHistory: 'regular', loanMonths: 60, age: 35 };
  assert.ok(assessAffordability({ ...base, requestedAmount: 5000 }).probability > assessAffordability({ ...base, requestedAmount: 50000 }).probability);
});

test('impossible repayment inputs return a zero approval estimate', () => {
  const base = { income: 2500, requestedAmount: 10000, housing: 500, fixedExpenses: 400, existingPayments: 0, newPayment: 250, employmentType: 'permanent', seniorityMonths: 48, paymentHistory: 'regular', loanMonths: 60, age: 35 };
  assert.equal(assessAffordability({ ...base, requestedAmount: 100 }).probability, 0);
  assert.equal(assessAffordability({ ...base, requestedAmount: 1000000 }).probability, 0);
  assert.equal(assessAffordability({ ...base, fixedExpenses: 99999999 }).probability, 0);
});
