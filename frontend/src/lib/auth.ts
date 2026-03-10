// Edge-compatible auth using Web Crypto API (no Node.js crypto)

const SECRET = process.env.AUTH_SECRET || 'terrace-villa-foresta-asama-secret-2025';
const COOKIE_NAME = 'tvfa_session';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Helpers ─────────────────────────────────────────────────────────────────

function base64url(buf: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = enc.encode(SECRET);
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

// ── Token creation / verification ────────────────────────────────────────────

export async function createSessionToken(userId: string, username: string): Promise<string> {
  const payload = { sub: userId, name: username, exp: Date.now() + TTL_MS };
  const data = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key  = await getKey();
  const sig  = base64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
  return `${data}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<{ sub: string; name: string } | null> {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const key   = await getKey();
    const valid = await crypto.subtle.verify('HMAC', key, Buffer.from(sig, 'base64url'), new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return null;
    return { sub: payload.sub, name: payload.name };
  } catch {
    return null;
  }
}

// ── SHA-256 password hash (Node.js only — used in API routes) ────────────────

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export { COOKIE_NAME };
