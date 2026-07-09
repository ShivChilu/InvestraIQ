/**
 * Persistent cache backed by flat-cache (writes to disk).
 * Survives server restarts, preventing unnecessary API calls to Alpha Vantage / Gemini
 * after every nodemon reload during development.
 *
 * Drop-in replacement for the old MemoryCache (same get/set/delete/clear API).
 */
import flatCache from 'flat-cache';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache file is stored in backend/.cache/ directory
const CACHE_DIR = path.join(__dirname, '../../.cache');
const CACHE_ID = 'api_cache';

class PersistentCache {
  constructor() {
    this._cache = flatCache.create({ cacheId: CACHE_ID, cacheDir: CACHE_DIR });
  }

  /**
   * Store a value with a TTL (in seconds).
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - defaults to 600s (10 min)
   */
  set(key, value, ttlSeconds = 600) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this._cache.set(key, { value, expiresAt });
    this._cache.save(true); // persist to disk immediately
  }

  /**
   * Retrieve a cached value, or null if expired / missing.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const item = this._cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this._cache.delete(key);
      this._cache.save(true);
      return null;
    }
    return item.value;
  }

  /**
   * Remove a single cached entry.
   * @param {string} key
   */
  delete(key) {
    this._cache.delete(key);
    this._cache.save(true);
  }

  /**
   * Flush the entire cache.
   */
  clear() {
    this._cache.clear();
    this._cache.save(true);
  }
}

export const apiCache = new PersistentCache();
export default apiCache;
