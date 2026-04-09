const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) return null; // encryption disabled if no key
  return Buffer.from(key.slice(0, 32), 'utf8');
}

/**
 * Encrypt a string. Returns 'enc:iv:ciphertext:tag' or plaintext if no key.
 */
function encrypt(text) {
  if (!text) return text;
  const key = getKey();
  if (!key) return text; // passthrough if encryption not configured
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  let enc = cipher.update(String(text), 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `enc:${iv.toString('hex')}:${enc}:${tag}`;
}

/**
 * Decrypt a string. If not encrypted (no 'enc:' prefix), returns as-is.
 */
function decrypt(text) {
  if (!text || !text.startsWith('enc:')) return text; // not encrypted
  const key = getKey();
  if (!key) return text; // can't decrypt without key
  try {
    const [, ivHex, encHex, tagHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let dec = decipher.update(encHex, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch {
    return text; // corrupted or wrong key — return as-is
  }
}

/**
 * Encrypt JSONB object values (shallow — top-level keys only).
 */
function encryptJson(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (!getKey()) return obj;
  return JSON.parse(encrypt(JSON.stringify(obj)));
}

/**
 * Decrypt JSONB — try to decrypt the JSON string.
 */
function decryptJson(val) {
  if (!val) return val;
  if (typeof val === 'string' && val.startsWith('enc:')) {
    try { return JSON.parse(decrypt(val)); } catch { return val; }
  }
  return val;
}

module.exports = { encrypt, decrypt, encryptJson, decryptJson };
