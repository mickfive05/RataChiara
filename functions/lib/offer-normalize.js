export function parseItalianNumber(input) {
  if (input === null || input === undefined) return null;
  const raw = String(input).replace(/\u00a0/g, ' ').trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9,.-]/g, '');
  if (!cleaned) return null;
  const comma = cleaned.lastIndexOf(',');
  const dot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (comma >= 0 && dot >= 0) normalized = comma > dot ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
  else if (comma >= 0) normalized = cleaned.replace(',', '.');
  else if ((cleaned.match(/\./g) || []).length > 1 || /\.\d{3}(?:$|\.)/.test(cleaned)) normalized = cleaned.replace(/\./g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function field(value, source, confidence) {
  return value === null || value === undefined || value === '' ? null : { value, source, confidence, detectedAutomatically: true };
}

export function moneyFromText(text) { return parseItalianNumber(String(text).replace(/(?:€|euro|eur).*$/i, '')); }

export function findFinanceValue(text, label, unit = '') {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`${escaped}\\s*[:\\-]?\\s*(?:€\\s*)?([0-9.]+(?:,[0-9]+)?)\\s*${unit}`, 'i'),
    new RegExp(`([0-9.]+(?:,[0-9]+)?)\\s*${unit}\\s*${escaped}`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseItalianNumber(match[1]);
  }
  return null;
}
