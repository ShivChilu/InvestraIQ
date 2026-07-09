/**
 * Centralized company utility helpers.
 * Single source of truth for private-company detection and known corporate URLs.
 */

// Registry of explicitly private companies (not on any public exchange).
// Add new companies here rather than scattering checks through the codebase.
const PRIVATE_COMPANY_REGISTRY = new Set([
  'PRIVATE', 'FLIPKART', 'AFFINSYS', 'STRIPE', 'SPACEX', 'BYTEDANCE', 'DATABRICKS',
  'KLARNA', 'CANVA', 'SHEIN', 'REVOLUT', 'CHIME', 'PLAID', 'OPENAI', 'ANTHROPIC'
]);

/**
 * Determine whether a ticker should be treated as a private company.
 * Rules:
 *   1. Ticker is in the explicit private-company registry.
 *   2. Ticker contains non-alphabetic characters EXCEPT for a single dot separator
 *      (e.g. "AAPL.NS" is valid, "MY STOCK" or "AB1C2" are not).
 *      NYSE tickers can be up to 5 chars (GOOGL, TSLA), so length alone is NOT a valid signal.
 *
 * @param {string} ticker - raw ticker string from the frontend
 * @returns {boolean}
 */
export function isPrivateCompany(ticker) {
  if (!ticker) return true;
  const t = ticker.toUpperCase().trim();
  if (PRIVATE_COMPANY_REGISTRY.has(t)) return true;
  if (t === 'GENERIC') return false;
  // Allow letters-only or letters.letters (e.g. AAPL.NS)
  // Reject anything with spaces, digits, or special chars in the base symbol
  const base = t.split('.')[0];
  return !/^[A-Z]{1,5}$/.test(base);
}

// Known corporate URLs for the most common benchmark tickers.
// Used to bypass Serper queries and URL health-check calls entirely.
export const BENCHMARK_CORPORATE_URLS = {
  'AAPL': { website: 'https://www.apple.com', ir: 'https://investor.apple.com', careers: 'https://www.apple.com/careers/', newsroom: 'https://www.apple.com/newsroom/' },
  'AMZN': { website: 'https://www.amazon.com', ir: 'https://ir.aboutamazon.com', careers: 'https://www.amazon.jobs', newsroom: 'https://www.aboutamazon.com/news' },
  'MSFT': { website: 'https://www.microsoft.com', ir: 'https://www.microsoft.com/en-us/investor', careers: 'https://careers.microsoft.com', newsroom: 'https://news.microsoft.com' },
  'NVDA': { website: 'https://www.nvidia.com', ir: 'https://investor.nvidia.com', careers: 'https://www.nvidia.com/en-us/about-nvidia/careers/', newsroom: 'https://nvidianews.nvidia.com' },
  'GOOGL': { website: 'https://about.google', ir: 'https://abc.xyz/investor/', careers: 'https://careers.google.com', newsroom: 'https://blog.google' },
  'GOOG': { website: 'https://about.google', ir: 'https://abc.xyz/investor/', careers: 'https://careers.google.com', newsroom: 'https://blog.google' },
  'META': { website: 'https://www.meta.com', ir: 'https://investor.fb.com', careers: 'https://www.metacareers.com', newsroom: 'https://newsroom.fb.com' },
  'TSLA': { website: 'https://www.tesla.com', ir: 'https://ir.tesla.com', careers: 'https://www.tesla.com/careers', newsroom: 'https://www.tesla.com/blog' },
  'NFLX': { website: 'https://www.netflix.com', ir: 'https://ir.netflix.net', careers: 'https://jobs.netflix.com', newsroom: 'https://media.netflix.com' },
  'AVGO': { website: 'https://www.broadcom.com', ir: 'https://investors.broadcom.com', careers: 'https://www.broadcom.com/company/careers', newsroom: 'https://www.broadcom.com/news' },
  'AMD': { website: 'https://www.amd.com', ir: 'https://ir.amd.com', careers: 'https://www.amd.com/en/corporate/careers', newsroom: 'https://www.amd.com/en/newsroom' },
  'WMT': { website: 'https://www.walmart.com', ir: 'https://stock.walmart.com', careers: 'https://careers.walmart.com', newsroom: 'https://corporate.walmart.com/news' },
  'JPM': { website: 'https://www.jpmorganchase.com', ir: 'https://www.jpmorganchase.com/ir', careers: 'https://careers.jpmorgan.com', newsroom: 'https://www.jpmorganchase.com/news-stories' },
  'V': { website: 'https://www.visa.com', ir: 'https://investor.visa.com', careers: 'https://www.visa.com/en_us/about-visa/careers/', newsroom: 'https://www.visa.com/en_us/about-visa/newsroom/' },
  'MA': { website: 'https://www.mastercard.com', ir: 'https://investor.mastercard.com', careers: 'https://www.mastercard.us/en-us/vision/who-we-are/careers.html', newsroom: 'https://www.mastercard.com/news' },
  'CRM': { website: 'https://www.salesforce.com', ir: 'https://investor.salesforce.com', careers: 'https://www.salesforce.com/company/careers/', newsroom: 'https://www.salesforce.com/news/' },
  'ADBE': { website: 'https://www.adobe.com', ir: 'https://www.adobe.com/investor-relations/', careers: 'https://www.adobe.com/careers.html', newsroom: 'https://news.adobe.com' }
};

/**
 * Returns true when a ticker has pre-known corporate URLs,
 * meaning Serper queries and URL health-checks can be skipped.
 * @param {string} ticker 
 */
export function isBenchmarkTicker(ticker) {
  return Boolean(ticker && BENCHMARK_CORPORATE_URLS[ticker.toUpperCase().trim()]);
}
