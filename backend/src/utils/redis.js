let client = null;

function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const Redis = require('ioredis');
    client = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
    client.on('error', (err) => console.error('Redis error:', err.message));
    client.connect().catch(() => {});
    return client;
  } catch {
    return null;
  }
}

// Простой кеш с TTL
async function cacheGet(key) {
  const r = getRedis();
  if (!r) return null;
  try { const v = await r.get(key); return v ? JSON.parse(v) : null; } catch { return null; }
}

async function cacheSet(key, value, ttlSeconds = 300) {
  const r = getRedis();
  if (!r) return;
  try { await r.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch {}
}

async function cacheDel(key) {
  const r = getRedis();
  if (!r) return;
  try { await r.del(key); } catch {}
}

module.exports = { getRedis, cacheGet, cacheSet, cacheDel };
