import test from 'node:test';
import assert from 'node:assert/strict';
import { parseItalianNumber } from './offer-normalize.js';
import { parseOfferPage } from './offer-parser.js';
import { calculateOfferSimulation } from './offer-calculator.js';
import { validatePublicUrl } from './offer-security.js';

test('normalizes Italian money and finance formats', () => { assert.equal(parseItalianNumber('29.900 €'), 29900); assert.equal(parseItalianNumber('29.900,00 €'), 29900); assert.equal(parseItalianNumber('6,99%'), 6.99); });
test('parses structured vehicle data and finance text', () => { const html = '<script type="application/ld+json">{"@type":"Vehicle","name":"Fiat 500 Hybrid","offers":{"price":"29.900"},"fuelType":"Benzina"}</script><p>Anticipo € 5.000 TAN 6,99% TAEG 8,12% 48 mesi Maxi-rata € 14.500</p>'; const result = parseOfferPage(html, 'https://example.com/car'); assert.equal(result.vehicle.price.value, 29900); assert.equal(result.finance.tan.value, 6.99); assert.equal(result.finance.apr.value, 8.12); assert.equal(result.finance.months.value, 48); });
test('simulates a loan with TAN zero and balloon', () => { const result = calculateOfferSimulation({ price: 30000, downPayment: 5000, months: 48, tan: 0, balloon: 10000 }); assert.equal(result.payment, 312.5); });
test('balloon lowers the regular payment and TAN is mandatory', () => { const full = calculateOfferSimulation({ price: 30000, downPayment: 5000, months: 48, tan: 7, balloon: 0 }); const balloon = calculateOfferSimulation({ price: 30000, downPayment: 5000, months: 48, tan: 7, balloon: 10000 }); assert.ok(balloon.payment < full.payment); assert.equal(calculateOfferSimulation({ price: 30000, downPayment: 5000, months: 48, tan: '', balloon: 0 }).valid, false); });
test('rejects local and private URLs before a network request', async () => { await assert.rejects(validatePublicUrl('http://localhost:4173')); await assert.rejects(validatePublicUrl('http://127.0.0.1')); await assert.rejects(validatePublicUrl('http://192.168.1.10')); await assert.rejects(validatePublicUrl('file:///etc/passwd')); });
