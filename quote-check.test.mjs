import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeQuote } from './finance.js';
test('quote analysis calculates total repaid and estimated APR', () => {
  const result = analyzeQuote({ receivedAmount: 10000, installment: 300, months: 36, finalInstallment: 0, initialFees: 200, monthlyFees: 2, insurance: 100, downPayment: 0, otherCosts: 0, declaredTan: 6, declaredApr: 7 });
  assert.equal(result.totalRepaid, 11172); assert.equal(result.accessoryCosts, 372); assert.ok(result.estimatedApr > 6);
});
test('quote analysis flags a material APR difference and balloon', () => {
  const result = analyzeQuote({ receivedAmount: 10000, installment: 150, months: 48, finalInstallment: 4000, initialFees: 0, monthlyFees: 0, insurance: 0, downPayment: 0, otherCosts: 0, declaredTan: 3, declaredApr: 3 });
  assert.ok(result.warnings.some((warning) => warning.includes('maxi-rata'))); assert.ok(result.warnings.some((warning) => warning.includes('TAEG stimato')));
});
