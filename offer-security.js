import dns from 'node:dns/promises';
import net from 'node:net';

const blockedHostnames = new Set(['localhost', 'localhost.localdomain', 'metadata.google.internal']);
function privateIp(ip) {
  if (net.isIP(ip) === 4) return /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|198\.18\.|224\.|240\.|255\.)/.test(ip);
  const lower = ip.toLowerCase();
  return lower === '::1' || lower === '::' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:') || lower.startsWith('::ffff:127.');
}

export async function validatePublicUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Inserisci un link http o https valido.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || blockedHostnames.has(url.hostname.toLowerCase())) throw new Error('Questo indirizzo non può essere analizzato.');
  if (net.isIP(url.hostname) && privateIp(url.hostname)) throw new Error('Questo indirizzo non può essere analizzato.');
  let addresses;
  try { addresses = await dns.lookup(url.hostname, { all: true, verbatim: true }); } catch { throw new Error('Non siamo riusciti a raggiungere questo indirizzo.'); }
  if (!addresses.length || addresses.some(({ address }) => privateIp(address))) throw new Error('Questo indirizzo non può essere analizzato.');
  return { url, addresses };
}
