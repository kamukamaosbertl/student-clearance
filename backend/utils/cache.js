import { publish, subscribe } from "../services/eventBus.js";

// Small in-memory cache with expiry, for data that is read on almost every
// page but rarely changes (the list of offices).
//
// Each server keeps its own copy. When the data changes on ANY server,
// invalidateCache() publishes an event on the event bus and EVERY server
// drops its copy — so the cache never serves stale data for long.

const store = new Map();
let hits = 0;
let misses = 0;

export async function cached(key, ttlMs, load) {
  const entry = store.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    hits++;
    return entry.value;
  }
  misses++;
  const value = await load();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(key) {
  store.delete(key);
  publish("cache.invalidate", { key }).catch(() => {});
}

subscribe((event) => {
  if (event.type === "cache.invalidate") store.delete(event.data.key);
});

export function cacheStats() {
  return { keys: store.size, hits, misses };
}
