function isBlockedIpv4(host) {
  const parts = host.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return false;
  const [a, b, c] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function ipv4TailToHex(value) {
  const octets = value.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return [((octets[0] << 8) | octets[1]).toString(16), ((octets[2] << 8) | octets[3]).toString(16)];
}

function ipv6Groups(host) {
  let value = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (!value.includes(':') || value.includes('%')) return null;

  if (value.includes('.')) {
    const lastColon = value.lastIndexOf(':');
    const tail = ipv4TailToHex(value.slice(lastColon + 1));
    if (!tail) return null;
    value = `${value.slice(0, lastColon)}:${tail.join(':')}`;
  }

  const halves = value.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;

  const groups = [...left, ...Array(missing).fill('0'), ...right].map((part) => {
    if (!/^[0-9a-f]{1,4}$/.test(part)) return NaN;
    return Number.parseInt(part, 16);
  });
  return groups.length === 8 && groups.every(Number.isFinite) ? groups : null;
}

function ipv4FromMappedIpv6(groups) {
  const mappedPrefix = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  if (!mappedPrefix) return null;
  const [high, low] = groups.slice(6);
  return [high >> 8, high & 255, low >> 8, low & 255].join('.');
}

export function isBlockedIpAddress(input) {
  const host = String(input).replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');
  if (isBlockedIpv4(host)) return true;

  const groups = ipv6Groups(host);
  if (!groups) return false;

  const mappedIpv4 = ipv4FromMappedIpv6(groups);
  if (mappedIpv4) return isBlockedIpv4(mappedIpv4);

  const allZero = groups.every((group) => group === 0);
  const loopback = groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1;
  const uniqueLocal = (groups[0] & 0xfe00) === 0xfc00;
  const linkLocal = (groups[0] & 0xffc0) === 0xfe80;
  const multicast = (groups[0] & 0xff00) === 0xff00;
  const outsideGlobalUnicast = groups[0] < 0x2000 || groups[0] > 0x3fff;
  const documentation = groups[0] === 0x2001 && groups[1] === 0x0db8;
  const transitionOrBenchmark = groups[0] === 0x2002 ||
    (groups[0] === 0x2001 && (groups[1] <= 0x01ff || groups[1] === 0x0002));

  return allZero || loopback || uniqueLocal || linkLocal || multicast || outsideGlobalUnicast || documentation || transitionOrBenchmark;
}
