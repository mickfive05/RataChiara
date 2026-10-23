import { isBlockedIpAddress } from './ip-security.js';

const blockedHostnames = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
]);

export function validatePublicUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Inserisci un link http o https valido.');
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    !hostname ||
    blockedHostnames.has(hostname) ||
    hostname.endsWith('.localhost') ||
    isBlockedIpAddress(hostname)
  ) {
    throw new Error('Questo indirizzo non può essere analizzato.');
  }

  return url;
}
