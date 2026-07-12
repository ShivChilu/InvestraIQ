import { Router } from 'express';
import axios from 'axios';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { runFullAnalysis } from '../services/agents.js';
import { config } from '../config/config.js';
import { apiCache } from '../services/cache.js';
import { diagnostics } from '../services/diagnostics.js';

const router = Router();

// Diagnostics Debug Endpoint
router.get('/diagnostics', (req, res) => {
  res.json(diagnostics.getLogs());
});

// Browser Remote Logger
router.post('/log-error', (req, res) => {
  console.error('\n🚨 [Browser JavaScript Error]:', req.body);
  res.json({ status: 'ok' });
});


function getDomainFromUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    return url.hostname.replace('www.', '');
  } catch {
    return urlStr.replace(/^https?:\/\//i, '').split('/')[0].replace('www.', '');
  }
}

// Relevance score calculation for autocomplete ranking
function calculateRelevanceScore(item, query) {
  let score = 0;
  const q = query.toLowerCase().trim();
  const name = item.companyName.toLowerCase().trim();
  const sym = item.symbol.toLowerCase().trim();
  const ex = item.exchange.toUpperCase();

  // 1. Exact listed company name match
  const coreName = name.replace(/\b(inc|corp|corporation|ltd|co|platforms|class a|class b|cdr|adr|group|holding|holdings|\-)\b/gi, '').trim();
  if (name === q || coreName === q) {
    score += 100;
  }

  // 2. Exact ticker match
  const baseSym = sym.split('.')[0];
  if (baseSym === q || sym === q) {
    score += 90;
  }

  // 3. Major primary exchanges (NASDAQ, NYSE, NSE, BSE)
  const isPrimaryExchange = ['NASDAQ', 'NYSE', 'NASDAQ/NYSE', 'NSE', 'BSE', 'NSE/BSE'].includes(ex);
  if (isPrimaryExchange) {
    score += 150; // Boost major public listings to rank above private companies
  }

  // 4. Official company (Inc, Corp, Ltd, Co)
  const isOfficial = /\b(inc|corp|corporation|ltd|co|llc)\b/i.test(name) || item.exchange !== 'PRIVATE';
  if (isOfficial) {
    score += 70;
  }

  // 5. Parent company
  if (coreName.length > 2 && (coreName.includes(q) || q.includes(coreName))) {
    score += 60;
  }

  // 6. Private company
  if (item.exchange === 'PRIVATE') {
    score += 40;
  }

  // 7. Foreign listing (Frankfurt, XETRA, Toronto, etc.)
  const isForeign = !isPrimaryExchange && item.exchange !== 'PRIVATE';
  if (isForeign) {
    score += 20;
  }

  // 8. ETF / Fund / Trust / CDR / ADR
  const isDerivative = item.assetType === 'ETF' || item.assetType === 'Fund' || item.assetType === 'CDR' || item.assetType === 'ADR' || name.includes('etf') || name.includes('fund') || name.includes('trust');
  if (isDerivative) {
    score += 10;
  }

  return score;
}

const LOCAL_BENCHMARK_ASSETS = [
  { companyName: 'Apple Inc.', symbol: 'AAPL', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Amazon.com Inc.', symbol: 'AMZN', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Microsoft Corporation', symbol: 'MSFT', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Nvidia Corporation', symbol: 'NVDA', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Alphabet Inc.', symbol: 'GOOGL', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Meta Platforms Inc', symbol: 'META', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Tesla, Inc.', symbol: 'TSLA', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Netflix, Inc.', symbol: 'NFLX', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Broadcom Inc.', symbol: 'AVGO', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Advanced Micro Devices, Inc.', symbol: 'AMD', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Walmart Inc.', symbol: 'WMT', exchange: 'NYSE', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'JPMorgan Chase & Co.', symbol: 'JPM', exchange: 'NYSE', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Visa Inc.', symbol: 'V', exchange: 'NYSE', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Mastercard Incorporated', symbol: 'MA', exchange: 'NYSE', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Salesforce, Inc.', symbol: 'CRM', exchange: 'NYSE', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Adobe Inc.', symbol: 'ADBE', exchange: 'NASDAQ', region: 'US', currency: 'USD', assetType: 'Public Company' },
  { companyName: 'Flipkart', symbol: 'FLIPKART', exchange: 'PRIVATE', region: 'IN', currency: 'INR', assetType: 'Private Company' },
  { companyName: 'Affinsys', symbol: 'AFFINSYS', exchange: 'PRIVATE', region: 'IN', currency: 'INR', assetType: 'Private Company' }
];

const SYMBOL_TO_DOMAIN = {
  'AAPL': 'apple.com',
  'AMZN': 'amazon.com',
  'MSFT': 'microsoft.com',
  'NVDA': 'nvidia.com',
  'GOOGL': 'google.com',
  'META': 'meta.com',
  'TSLA': 'tesla.com',
  'NFLX': 'netflix.com',
  'AVGO': 'broadcom.com',
  'AMD': 'amd.com',
  'WMT': 'walmart.com',
  'JPM': 'jpmorgan.com',
  'V': 'visa.com',
  'MA': 'mastercard.com',
  'CRM': 'salesforce.com',
  'ADBE': 'adobe.com',
  'FLIPKART': 'flipkart.com',
  'AFFINSYS': 'affinsys.ai'
};

function getLogoUrl(symbol, companyName) {
  const baseSym = symbol.split('.')[0].toUpperCase();
  const domain = SYMBOL_TO_DOMAIN[baseSym];
  if (domain) {
    return `https://img.logo.dev/${domain}?token=pk_eHjis_UGRou6oGR_UQ57vQ`;
  }
  const cleanComp = (companyName || '').toLowerCase().replace(/\b(inc|corp|corporation|ltd|co|group|holding|holdings)\b/g, '').replace(/[^a-z0-9]/g, '').trim();
  const guess = cleanComp.length > 2 ? `${cleanComp}.com` : 'placeholder.com';
  return `https://img.logo.dev/${guess}?token=pk_eHjis_UGRou6oGR_UQ57vQ`;
}

// UNIVERSAL HYBRID COMPANY SEARCH (SERPER + ALPHA VANTAGE)
router.get('/search', async (req, res) => {
  const keywords = req.query.keywords;
  
  if (!keywords || keywords.trim().length < 2) {
    return res.json([]);
  }

  const query = keywords.replace(/[^a-zA-Z0-9\s\.\-]/g, '').trim();
  if (query.length < 2) {
    return res.json([]);
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult) {
    console.log(`[Cache Hit] Autocomplete results for query: "${query}"`);
    return res.json(cachedResult);
  }

  console.log(`[Universal Search] Caching miss. Fetching query: "${query}"`);

  try {
    // 1. Alpha Vantage Search
    const publicSearchPromise = (async () => {
      try {
        const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${config.alphaVantageApiKey}`;
        const response = await axios.get(url);
        
        // Log raw Alpha Vantage response before filtering
        console.log('Raw Alpha Vantage Response:', JSON.stringify(response.data));
        
        const rawMatches = response.data.bestMatches || [];
        console.log(`✓ Alpha Vantage Search | Found: ${rawMatches.length} raw matches.`);
        
        return rawMatches.map((m) => {
          const symbol = m['1. symbol'] || '';
          const name = m['2. name'] || '';
          const region = m['4. region'] || 'Other';
          const currency = m['8. currency'] || 'USD';
          const type = m['3. type'] || 'Equity';
          
          let cleanExchange = 'Other';
          const upperSymbol = symbol.toUpperCase();
          
          if (upperSymbol.includes('.')) {
            const suffix = upperSymbol.split('.')[1];
            if (suffix === 'NS') cleanExchange = 'NSE';
            else if (suffix === 'BO') cleanExchange = 'BSE';
          }
          
          if (region.includes('United States') || region.includes('US')) {
            cleanExchange = upperSymbol.includes('.') ? 'NYSE/NASDAQ OTC' : 'NASDAQ/NYSE';
          } else if (region.includes('India')) {
            cleanExchange = cleanExchange === 'Other' ? 'NSE/BSE' : cleanExchange;
          }
          
          const cleanRegion = region.replace('United States', 'US').replace('India', 'IN');
          const cleanSymbol = symbol.split('.')[0];
          
          // Determine assetType (Public Company, Private Company, ETF, Fund, ADR, CDR)
          let assetType = 'Public Company';
          if (type.toLowerCase() === 'etf') {
            assetType = 'ETF';
          } else if (name.toUpperCase().includes(' CDR')) {
            assetType = 'CDR';
          } else if (name.toUpperCase().includes(' ADR') || name.toUpperCase().includes(' DEPOSITARY')) {
            assetType = 'ADR';
          } else if (name.toLowerCase().includes('trust') || name.toLowerCase().includes('fund')) {
            assetType = 'Fund';
          }

          return {
            companyName: name,
            symbol: symbol,
            exchange: cleanExchange,
            region: cleanRegion,
            currency: currency,
            matchScore: parseFloat(m['9. matchScore']) || 0.8,
            logoUrl: getLogoUrl(symbol, name),
            assetType
          };
        });
      } catch (err) {
        console.warn('[Universal Search] Alpha Vantage search error:', err);
        return [];
      }
    })();

    // 2. Serper Search
    const serperSearchPromise = (async () => {
      if (!config.serperApiKey) {
        return [];
      }
      try {
        const response = await axios.post(
          'https://google.serper.dev/search',
          {
            q: `${query} company official website profile overview`,
            num: 6
          },
          {
            headers: {
              'X-API-KEY': config.serperApiKey,
              'Content-Type': 'application/json'
            },
            timeout: 3000
          }
        );
        const organic = response.data.organic || [];
        console.log(`✓ Serper Search | Found: ${organic.length} raw organic links.`);
        
        return organic.map((item) => {
          const domain = getDomainFromUrl(item.link);
          
          // Extract base company name from title
          let name = item.title.split(' - ')[0].split(' | ')[0].trim();
          if (name.toLowerCase().includes('company info')) {
            name = name.replace(/company info/i, '').trim();
          }
          if (name.toLowerCase().includes('about us')) {
            name = name.replace(/about us/i, '').trim();
          }

          // Construct candidate symbol
          const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
          const symbolWords = cleanName.split(/\s+/);
          let symbol = symbolWords[0].toUpperCase();
          if (symbol.length < 2 && symbolWords[1]) {
            symbol = (symbol + symbolWords[1].charAt(0)).toUpperCase();
          }
          if (symbol.length > 6) {
            symbol = symbol.substring(0, 6);
          }

          return {
            companyName: name,
            symbol: symbol || 'ASSET',
            exchange: 'PRIVATE',
            region: 'US',
            currency: 'USD',
            matchScore: 0.9,
            logoUrl: `https://img.logo.dev/${domain}?token=pk_eHjis_UGRou6oGR_UQ57vQ`,
            assetType: 'Private Company'
          };
        });
      } catch (err) {
        console.warn('[Universal Search] Serper search error:', err.message);
        return [];
      }
    })();

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve([]), 5000));
    const [publicListings, serperDiscovered] = await Promise.all([
      Promise.race([publicSearchPromise, timeoutPromise]),
      Promise.race([serperSearchPromise, timeoutPromise])
    ]);

    // Local benchmark injection to guard against API rate limits
    const qLower = query.toLowerCase();
    const localMatches = LOCAL_BENCHMARK_ASSETS.filter(item => {
      return item.companyName.toLowerCase().includes(qLower) || item.symbol.toLowerCase().includes(qLower);
    }).map(item => ({
      ...item,
      matchScore: 1.0,
      logoUrl: getLogoUrl(item.symbol, item.companyName)
    }));

    // 3. Merge
    const mergedList = [...localMatches, ...publicListings, ...serperDiscovered];
    console.log(`✓ Merge | Combined Count: ${mergedList.length}`);

    // Compute scores for sorting and grouping
    const scoredList = mergedList.map((item) => {
      const score = calculateRelevanceScore(item, query);
      return { ...item, relevanceScore: score };
    });

    // 4. Deduplication
    const seenKeys = new Set();
    const unifiedList = [];

    for (const item of scoredList) {
      const key = `${item.symbol.toUpperCase()}:${item.companyName.toLowerCase().trim()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        unifiedList.push(item);
      }
    }
    console.log(`✓ Deduplication | Unique Count: ${unifiedList.length}`);

    // 5. Ranking
    unifiedList.sort((a, b) => b.relevanceScore - a.relevanceScore);
    console.log(`✓ Ranking | Completed ranking.`);

    // 6. Final Results
    const finalResult = unifiedList.length === 0 ? getLocalFallback(query) : unifiedList;
    console.log(`✓ Final Results | Returning: ${finalResult.length}`);

    apiCache.set(cacheKey, finalResult, 600);
    return res.json(finalResult);

  } catch (error) {
    console.error('[Universal Search Error] falling back to local fallback:', error);
    const fallback = getLocalFallback(query);
    apiCache.set(cacheKey, fallback, 600);
    return res.json(fallback);
  }
});

function getLocalFallback(query) {
  console.log(`[Search Fallback] Sourcing static local benchmark list for fallback...`);
  const qLower = query.toLowerCase();
  return LOCAL_BENCHMARK_ASSETS.filter(item => {
    return item.companyName.toLowerCase().includes(qLower) || item.symbol.toLowerCase().includes(qLower);
  }).map(item => ({
    ...item,
    matchScore: 1.0,
    logoUrl: getLogoUrl(item.symbol, item.companyName),
    relevanceScore: 100
  }));
}

// SSE ANALYZE ENDPOINT
router.get('/analyze', async (req, res) => {
  const companyName = req.query.company;
  const ticker = req.query.ticker || '';

  if (!companyName) {
    return res.status(400).json({ error: 'Missing required query parameter: company' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const cacheKey = `report:${companyName.toLowerCase().trim()}:${ticker.toLowerCase().trim()}`;
  const cachedReport = apiCache.get(cacheKey);

  const sendProgress = (step, message) => {
    res.write(`event: progress\ndata: ${JSON.stringify({ step, message })}\n\n`);
  };

  if (cachedReport) {
    console.log(`[Cache Hit] Serving cached investment report for: ${companyName}`);
    sendProgress('collecting_info', 'Verification Agent: Sourced official records from cache index...');
    await new Promise(r => setTimeout(r, 100));
    sendProgress('financials', 'Financial Analyst: Pulling cached balance sheets and assets ratios...');
    await new Promise(r => setTimeout(r, 100));
    sendProgress('news', 'News Analyst: Loading cached news sentiment indices...');
    await new Promise(r => setTimeout(r, 100));
    sendProgress('industry', 'Industry Analyst: Loading cached competitive moats and peer tables...');
    await new Promise(r => setTimeout(r, 100));
    sendProgress('risk', 'Risk Officer: Retrieving cached macro and geo-political hazard lists...');
    await new Promise(r => setTimeout(r, 100));
    sendProgress('committee', 'Investment Committee: Convening cached committee vote decision scorecard...');
    await new Promise(r => setTimeout(r, 150));
    sendProgress('preparing_report', 'Recompiling dashboard metrics from cache...');
    await new Promise(r => setTimeout(r, 100));

    res.write(`event: result\ndata: ${JSON.stringify(cachedReport)}\n\n`);
    res.write('event: done\ndata: {}\n\n');
    res.end();
    return;
  }

  console.log(`[SSE Connection] Starting live analysis stream for: ${companyName}`);

  try {
    const report = await runFullAnalysis(companyName, ticker, sendProgress);
    apiCache.set(cacheKey, report, 1800);

    res.write(`event: result\ndata: ${JSON.stringify(report)}\n\n`);
    res.write('event: done\ndata: {}\n\n');
    res.end();
    console.log(`[SSE Connection] Completed analysis and cached report for: ${companyName}`);
  } catch (error) {
    console.error(`[SSE Connection Error] for ${companyName}:`, error);
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'API quota exhausted.' })}\n\n`);
    res.end();
  }
});

export default router;
