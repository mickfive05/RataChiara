import dns from 'node:dns/promises';
import { isBlockedIpAddress } from './functions/lib/ip-security.js';

const blockedHostnames = new Set(['localhost', 'localhost.localdomain', 'metadata.google.internal']);

export async function validatePublicUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Inserisci un link http o https valido.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || blockedHostnames.has(url.hostname.toLowerCase())) throw new Error('Questo indirizzo non può essere analizzato.');
  if (isBlockedIpAddress(url.hostname)) throw new Error('Questo indirizzo non può essere analizzato.');
  let addresses;
  try { addresses = await dns.lookup(url.hostname, { all: true, verbatim: true }); } catch { throw new Error('Non siamo riusciti a raggiungere questo indirizzo.'); }
  if (!addresses.length || addresses.some(({ address }) => isBlockedIpAddress(address))) throw new Error('Questo indirizzo non può essere analizzato.');
  return { url, addresses };
}
