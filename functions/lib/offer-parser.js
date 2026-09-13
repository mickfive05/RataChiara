import { field, findFinanceValue, moneyFromText, parseItalianNumber } from './offer-normalize.js';

const decode = (value = '') => String(value).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const plain = (html) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));
const first = (values) => values.find((value) => value !== null && value !== undefined && value !== '');

function meta(html, property) {
  const attrs = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["'][^>]*>`, 'i');
  return decode(html.match(attrs)?.[1] || html.match(reverse)?.[1] || '');
}

function jsonLd(html) {
  const items = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { items.push(JSON.parse(match[1])); } catch { /* Invalid structured data is ignored. */ }
  }
  const flattened = [];
  const visit = (item) => {
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item)) return item.forEach(visit);
    if (item['@graph']) visit(item['@graph']);
    flattened.push(item);
  };
  items.forEach(visit);
  return flattened;
}

export function parseOfferPage(html, originalUrl) {
  const text = plain(html);
  const structured = jsonLd(html);
  const vehicle = structured.find((item) => /Vehicle|Product/i.test(String(item['@type']))) || {};
  const offer = structured.flatMap((item) => Array.isArray(item.offers) ? item.offers : [item.offers]).find(Boolean) || {};
  const structuredPrice = first([offer.price, vehicle.price]);
  const title = first([vehicle.name, meta(html, 'og:title'), (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim()]);
  const price = structuredPrice !== undefined ? parseItalianNumber(structuredPrice) : first([
    moneyFromText(meta(html, 'product:price:amount')), moneyFromText(meta(html, 'og:price:amount')),
    (() => { const m = text.match(/(?:prezzo|€)\s*[:\-]?\s*€?\s*([0-9.]+(?:,[0-9]{2})?)/i); return m ? parseItalianNumber(m[1]) : null; })(),
  ]);
  const source = structuredPrice !== undefined ? 'json-ld' : price !== null ? 'html' : null;
  const financed = {
    downPayment: first([findFinanceValue(text, 'anticipo'), findFinanceValue(text, 'acconto')]),
    monthlyPayment: first([findFinanceValue(text, 'rata(?: mensile)?', '(?:€|euro|eur)?\\s*(?:/|al )?mese'), (() => { const m = text.match(/([0-9.]+(?:,[0-9]+)?)\s*(?:€|euro)\s*\/?\s*mese/i); return m ? parseItalianNumber(m[1]) : null; })()]),
    months: first([findFinanceValue(text, 'durata', 'mesi'), (() => { const m = text.match(/\b([0-9]{1,3})\s*(?:mesi|rate)\b/i); return m ? Number(m[1]) : null; })()]),
    tan: findFinanceValue(text, 'tan', '%'),
    apr: findFinanceValue(text, 'taeg', '%'),
    balloon: first([findFinanceValue(text, 'maxi[ -]?rata'), findFinanceValue(text, 'valore futuro garantito'), findFinanceValue(text, 'rata finale')]),
    totalDue: first([findFinanceValue(text, 'importo totale dovuto'), findFinanceValue(text, 'totale dovuto')]),
    expiry: (() => { const m = text.match(/(?:offerta valida|scadenza)\s*(?:fino al|entro)?\s*([0-3]?\d[\/.-][01]?\d[\/.-]\d{2,4})/i); return m?.[1] || null; })(),
  };
  const year = first([parseItalianNumber(vehicle.productionDate?.slice?.(0, 4)), (() => { const m = text.match(/\b(19\d{2}|20\d{2})\b/); return m ? Number(m[1]) : null; })()]);
  const fuel = first([vehicle.fuelType, (() => { const m = text.match(/\b(Benzina|Diesel|Elettrica|Ibrida|GPL|Metano)\b/i); return m?.[1] || null; })()]);
  return {
    originalUrl,
    vehicle: {
      name: field(title, vehicle.name ? 'json-ld' : 'open-graph', vehicle.name ? .96 : .76),
      price: field(price, source, structuredPrice !== undefined ? .98 : .7),
      image: field(first([vehicle.image?.url, vehicle.image, meta(html, 'og:image')]), vehicle.image ? 'json-ld' : 'open-graph', .85),
      year: field(year, vehicle.productionDate ? 'json-ld' : 'html', vehicle.productionDate ? .92 : .56),
      fuel: field(fuel, vehicle.fuelType ? 'json-ld' : 'html', vehicle.fuelType ? .92 : .62),
    },
    finance: Object.fromEntries(Object.entries(financed).map(([key, value]) => [key, field(value, 'text-pattern', value === null ? 0 : .7)])),
  };
}
