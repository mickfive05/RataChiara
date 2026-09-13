const EPSILON = 1e-10;
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
export function calculateOfferSimulation(input) {
  const price = number(input.price); const downPayment = Math.max(0, number(input.downPayment));
  const months = Math.round(number(input.months)); const tan = input.tan === '' || input.tan === null || input.tan === undefined ? null : Math.max(0, number(input.tan));
  const balloon = Math.max(0, number(input.balloon));
  const principal = price - downPayment;
  if (!(price > 0) || !(months > 0) || downPayment > price || balloon > principal) return { valid: false, reason: 'Controlla prezzo, anticipo, durata e maxi-rata.' };
  if (tan === null) return { valid: false, reason: 'Per calcolare la rata serve un TAN.', principal, price, downPayment, months, balloon };
  const rate = tan / 1200;
  const payment = Math.abs(rate) < EPSILON ? (principal - balloon) / months : (principal - balloon / Math.pow(1 + rate, months)) * rate / (1 - Math.pow(1 + rate, -months));
  const totalInstallments = payment * months;
  return { valid: true, price, downPayment, principal, months, tan, balloon, payment, totalInstallments, totalSimulated: downPayment + totalInstallments + balloon };
}
