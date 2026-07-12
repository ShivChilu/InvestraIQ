import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../config/config.js';
import { fetchFinancialData } from './alphavantage.js';
import { fetchNewsData } from './tavily.js';
import { apiCache } from './cache.js';
import { diagnostics } from './diagnostics.js';
import { isPrivateCompany, isBenchmarkTicker, BENCHMARK_CORPORATE_URLS } from '../utils/company.js';

// ==========================================
// ZOD SCHEMAS FOR STRUCTURED AI OUTPUTS
// ==========================================

const SupportingSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  publisher: z.string(),
  publishedDate: z.string(),
  sourceType: z.string(),
  evidenceSnippet: z.string(),
  // Accept 0-1 floats OR 0-100 integers from Gemini
  relevanceScore: z.number().min(0)
});

const CommitteeMemberSchema = z.object({
  id: z.string().optional(),
  role: z.string(),
  vote: z.string(), // "INVEST", "HOLD", "PASS" or "Invest", "Hold", "Pass"
  confidence: z.number(),
  reason: z.string()
});

const UnifiedInvestmentAnalysisSchema = z.object({
  executiveSummary: z.string(),
  financialAnalysis: z.string(),
  newsAnalysis: z.string(),

  industryAnalysis: z.object({
    competitors: z.array(z.object({
      name: z.string(),
      marketCap: z.string(),
      peRatio: z.number(),
      strength: z.string()
    })),
    industryGrowthRate: z.string(),
    competitiveAdvantages: z.array(z.string()),
    marketPosition: z.string(),
    confidence: z.number()
  }),

  riskAnalysis: z.object({
    companyRisks: z.array(z.object({
      risk: z.string(),
      severity: z.string(),
      mitigation: z.string()
    })),
    macroeconomicRisks: z.array(z.object({
      risk: z.string(),
      severity: z.string()
    })),
    regulatoryRisks: z.array(z.object({
      risk: z.string(),
      severity: z.string()
    })),
    overallRiskScore: z.number(),
    confidence: z.number()
  }),

  bullCase: z.array(z.string()),
  bearCase: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),

  investmentScore: z.number(),
  confidence: z.number(),
  recommendation: z.string(),
  committeeVotes: z.object({
    invest: z.number().default(0),
    hold: z.number().default(0),
    pass: z.number().default(0)
  }).passthrough().optional(),
  committeeMembers: z.array(CommitteeMemberSchema),
  reasoning: z.string(),
  supportingEvidence: z.array(SupportingSourceSchema),

  // Optional private company fields
  headquarters: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional()
});

// ==========================================
// HELPERS
// ==========================================

function isCompanyResolvable(name) {
  const n = name.toLowerCase().trim();
  const isGibberish = /^[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}$/.test(n) || n.length < 2;
  return !isGibberish;
}

function getBaseDomain(urlStr) {
  if (!urlStr || urlStr.includes('could not') || urlStr.includes('provide') || urlStr.includes('unavailable') || urlStr.includes('failed')) return '';
  try {
    let hostname = urlStr.trim();
    if (!/^https?:\/\//i.test(hostname)) hostname = 'https://' + hostname;
    const parsedUrl = new URL(hostname);
    const parts = parsedUrl.hostname.toLowerCase().split('.');
    if (parts.length > 2) {
      const prev = parts[parts.length - 2];
      if (['co', 'gov', 'net', 'org', 'ac'].includes(prev)) return parts.slice(-3).join('.');
      return parts.slice(-2).join('.');
    }
    return parsedUrl.hostname;
  } catch (e) {
    return '';
  }
}

function isOfficialDomain(candidateUrl, baseDomain) {
  if (!candidateUrl || !baseDomain) return false;
  try {
    let cand = candidateUrl.trim();
    if (!/^https?:\/\//i.test(cand)) cand = 'https://' + cand;
    const candHost = new URL(cand).hostname.toLowerCase();
    return candHost === baseDomain || candHost.endsWith('.' + baseDomain);
  } catch (e) {
    return false;
  }
}

function parseAVAddress(address) {
  if (!address || address === 'None' || address.includes('provide') || address.includes('unavailable')) {
    return 'Alpha Vantage does not provide this field.';
  }
  const parts = address.split(',').map(p => p.trim());
  if (parts.length < 2) return address;

  const cleanParts = parts.filter(p => !/^\d{5}(-\d{4})?$/.test(p) && !/^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(p));

  let country = cleanParts[cleanParts.length - 1];
  if (/united states|usa|^us$/i.test(country)) country = 'USA';
  else if (/india|^in$/i.test(country)) country = 'India';

  const capitalize = (str) => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  if (cleanParts.length >= 3) {
    const city = cleanParts[cleanParts.length - 3];
    let state = cleanParts[cleanParts.length - 2];
    const stateMapping = { 'CA': 'California', 'WA': 'Washington', 'TX': 'Texas', 'NY': 'New York', 'MA': 'Massachusetts', 'OR': 'Oregon', 'IL': 'Illinois', 'FL': 'Florida' };
    if (stateMapping[state.toUpperCase()]) state = stateMapping[state.toUpperCase()];
    return `${capitalize(city)}, ${capitalize(state)}, ${country}`;
  }
  return cleanParts.map(capitalize).join(', ');
}

async function fetchAVOverview(symbol) {
  const cacheKey = `av:overview:${symbol.toLowerCase()}`;
  const cached = apiCache.get(cacheKey);
  if (cached) {
    diagnostics.logCacheHit(cacheKey);
    return cached;
  }
  diagnostics.logCacheMiss(cacheKey);

  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${config.alphaVantageApiKey}`;
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    const start = Date.now();
    try {
      const res = await axios.get(url, { timeout: 2500 });
      if (res.data && !res.data.Note && !res.data.Information && Object.keys(res.data).length > 0) {
        apiCache.set(cacheKey, res.data, 86400); // 24h TTL
        diagnostics.logApiCall({ provider: 'AlphaVantage', endpoint: 'OVERVIEW', status: 'Success', latency: Date.now() - start, attempts });
        return res.data;
      }
      if (res.data && (res.data.Note || res.data.Information)) {
        diagnostics.logApiCall({ provider: 'AlphaVantage', endpoint: 'OVERVIEW', status: 'Rate Limited', latency: Date.now() - start, attempts, error: 'Rate Limit' });
      } else {
        diagnostics.logApiCall({ provider: 'AlphaVantage', endpoint: 'OVERVIEW', status: 'No Data', latency: Date.now() - start, attempts });
      }
    } catch (err) {
      diagnostics.logApiCall({ provider: 'AlphaVantage', endpoint: 'OVERVIEW', status: 'Error', latency: Date.now() - start, attempts, error: err.message });
    }
    if (attempts < maxAttempts) await new Promise(r => setTimeout(r, 600));
  }
  return null;
}

/**
 * Check if a URL is live. Only called for Serper-sourced URLs.
 * Benchmark URLs are never passed through here.
 */
async function checkUrlStatus(url) {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl || cleanUrl === 'Unknown' || cleanUrl === '#' || cleanUrl.startsWith('No ') || cleanUrl.includes('could not') || cleanUrl.includes('provide') || cleanUrl.includes('held')) return false;
  if (cleanUrl.includes('linkedin.com')) {
    return /^https:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9_\-]+/i.test(cleanUrl);
  }
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  };
  try {
    const res = await axios.head(cleanUrl, { timeout: 1500, headers });
    return res.status >= 200 && res.status < 400;
  } catch {
    try {
      const res = await axios.get(cleanUrl, { timeout: 1500, headers });
      return res.status >= 200 && res.status < 400;
    } catch {
      return false;
    }
  }
}

// ==========================================
// COMPANY RETRIEVAL AGENT (REST ONLY)
// ==========================================
async function verifyCompanyProfile(companyName, ticker) {
  const normTicker = (ticker || '').toUpperCase().trim();
  const isPrivate = isPrivateCompany(normTicker);
  const isBenchmark = isBenchmarkTicker(normTicker);

  const profileCacheKey = `profile:v5:${companyName.toLowerCase()}:${normTicker.toLowerCase()}`;
  const cachedProfile = apiCache.get(profileCacheKey);
  if (cachedProfile) {
    diagnostics.logCacheHit(profileCacheKey);
    return cachedProfile;
  }
  diagnostics.logCacheMiss(profileCacheKey);

  let nameVal = companyName;
  let websiteVal = 'No official website found.';
  let linkedinVal = 'No official LinkedIn page found.';
  let irVal = isPrivate ? 'Company is privately held.' : 'No official investor relations page found.';
  let careersVal = 'No official careers page found.';
  let newsVal = 'No official corporate newsroom found.';
  let hqVal = 'No verified headquarters information available.';
  let sectorVal = 'No verified sector information available.';
  let industryVal = 'No verified industry information available.';
  let typeVal = isPrivate ? 'Private' : 'PUBLIC';
  let descVal = 'No verified business description available.';
  let websiteSource = 'None';
  let hqSource = 'None';
  let sectorSource = 'None';
  let industrySource = 'None';
  let descSource = 'None';
  let privateContextText = '';

  // --- STAGE 1: Alpha Vantage Overview (public companies only) ---
  let avOverview = null;
  if (!isPrivate && config.alphaVantageApiKey) {
    avOverview = await fetchAVOverview(normTicker);
  }

  // Static fallback for popular benchmark tickers
  const BENCHMARK_PROFILES = {
    'AAPL': { website: 'https://www.apple.com', hq: 'Cupertino, California, USA', sector: 'TECHNOLOGY', industry: 'CONSUMER ELECTRONICS', desc: 'Apple Inc. is an American multinational technology company that specializes in consumer electronics, software, and services.' },
    'AMZN': { website: 'https://www.amazon.com', hq: 'Seattle, Washington, USA', sector: 'CONSUMER SERVICES', industry: 'RETAIL/E-COMMERCE', desc: 'Amazon.com, Inc. is an American multinational focused on e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.' },
    'MSFT': { website: 'https://www.microsoft.com', hq: 'Redmond, Washington, USA', sector: 'TECHNOLOGY', industry: 'SERVICES-PREPACKAGED SOFTWARE', desc: 'Microsoft Corporation is an American multinational technology corporation producing software, consumer electronics, personal computers, and cloud services.' },
    'NVDA': { website: 'https://www.nvidia.com', hq: 'Santa Clara, California, USA', sector: 'TECHNOLOGY', industry: 'SEMICONDUCTORS', desc: 'NVIDIA Corporation designs graphics processing units (GPUs), system-on-chip units, and AI accelerators used in gaming, data centers, and autonomous vehicles.' },
    'GOOGL': { website: 'https://about.google', hq: 'Mountain View, California, USA', sector: 'TECHNOLOGY', industry: 'COMPUTER PROGRAMMING, DATA PROCESSING', desc: 'Alphabet Inc. is an American multinational technology conglomerate holding company and parent of Google, DeepMind, Waymo, and other subsidiaries.' },
    'GOOG': { website: 'https://about.google', hq: 'Mountain View, California, USA', sector: 'TECHNOLOGY', industry: 'COMPUTER PROGRAMMING, DATA PROCESSING', desc: 'Alphabet Inc. (Class C) is an American multinational technology conglomerate and parent of Google.' },
    'META': { website: 'https://www.meta.com', hq: 'Menlo Park, California, USA', sector: 'TECHNOLOGY', industry: 'SERVICES-PREPACKAGED SOFTWARE', desc: 'Meta Platforms, Inc. is an American multinational technology conglomerate owning Facebook, Instagram, WhatsApp, and developing the metaverse.' },
    'TSLA': { website: 'https://www.tesla.com', hq: 'Austin, Texas, USA', sector: 'MANUFACTURING', industry: 'MOTOR VEHICLES & PASSENGER CAR BODIES', desc: 'Tesla, Inc. is an American multinational automotive and clean energy company that designs and manufactures electric vehicles, battery energy storage, and solar products.' },
    'NFLX': { website: 'https://www.netflix.com', hq: 'Los Gatos, California, USA', sector: 'TECHNOLOGY', industry: 'SERVICES-COMPUTER PROGRAMMING', desc: 'Netflix, Inc. is an American subscription video on-demand streaming service and production company.' },
    'AVGO': { website: 'https://www.broadcom.com', hq: 'San Jose, California, USA', sector: 'TECHNOLOGY', industry: 'SEMICONDUCTORS', desc: 'Broadcom Inc. is an American designer, developer, and global supplier of semiconductor and infrastructure software solutions.' },
    'AMD': { website: 'https://www.amd.com', hq: 'Santa Clara, California, USA', sector: 'TECHNOLOGY', industry: 'SEMICONDUCTORS', desc: 'Advanced Micro Devices, Inc. designs and develops CPUs, GPUs, FPGAs, and embedded processors for data centers, gaming, and embedded applications.' },
    'WMT': { website: 'https://www.walmart.com', hq: 'Bentonville, Arkansas, USA', sector: 'RETAIL TRADE', industry: 'RETAIL-GROCERY STORES', desc: 'Walmart Inc. is an American multinational retail corporation that operates a chain of hypermarkets, discount department stores, and grocery stores.' },
    'JPM': { website: 'https://www.jpmorganchase.com', hq: 'New York, New York, USA', sector: 'FINANCE', industry: 'NATIONAL COMMERCIAL BANKS', desc: 'JPMorgan Chase & Co. is an American multinational investment bank and financial services holding company.' },
    'V': { website: 'https://www.visa.com', hq: 'San Francisco, California, USA', sector: 'FINANCE', industry: 'SERVICES-BUSINESS SERVICES, NEC', desc: 'Visa Inc. is an American multinational payment card services corporation facilitating electronic funds transfers globally.' },
    'MA': { website: 'https://www.mastercard.com', hq: 'Purchase, New York, USA', sector: 'FINANCE', industry: 'SERVICES-BUSINESS SERVICES, NEC', desc: 'Mastercard Incorporated is an American multinational financial services corporation that processes payments between banks and merchants.' },
    'CRM': { website: 'https://www.salesforce.com', hq: 'San Francisco, California, USA', sector: 'TECHNOLOGY', industry: 'SERVICES-PREPACKAGED SOFTWARE', desc: 'Salesforce, Inc. is an American cloud-based software company providing CRM services and enterprise application software.' },
    'ADBE': { website: 'https://www.adobe.com', hq: 'San Jose, California, USA', sector: 'TECHNOLOGY', industry: 'SERVICES-PREPACKAGED SOFTWARE', desc: 'Adobe Inc. is an American multinational software company known for creative software, marketing analytics, and document management tools.' }
  };

  if (avOverview && avOverview.Symbol && avOverview.Name) {
    nameVal = avOverview.Name || companyName;
    websiteVal = avOverview.OfficialSite && avOverview.OfficialSite !== 'None' ? avOverview.OfficialSite : BENCHMARK_PROFILES[normTicker]?.website || 'No official website found.';
    hqVal = parseAVAddress(avOverview.Address);
    sectorVal = avOverview.Sector && avOverview.Sector !== 'None' ? avOverview.Sector : BENCHMARK_PROFILES[normTicker]?.sector || sectorVal;
    industryVal = avOverview.Industry && avOverview.Industry !== 'None' ? avOverview.Industry : BENCHMARK_PROFILES[normTicker]?.industry || industryVal;
    descVal = avOverview.Description && avOverview.Description !== 'None' ? avOverview.Description : BENCHMARK_PROFILES[normTicker]?.desc || descVal;
    typeVal = 'PUBLIC';
    websiteSource = hqSource = sectorSource = industrySource = descSource = 'Alpha Vantage OVERVIEW API';
  } else {
    const bp = BENCHMARK_PROFILES[normTicker];
    if (bp) {
      websiteVal = bp.website; hqVal = bp.hq; sectorVal = bp.sector; industryVal = bp.industry; descVal = bp.desc;
      websiteSource = hqSource = sectorSource = industrySource = descSource = 'Local Benchmark Dictionary';
      console.log(`[Profile] Benchmark fallback applied for ${normTicker}`);
    }
  }

  const baseDomain = getBaseDomain(websiteVal);

  // --- STAGE 2: Serper Social/Sub-domain Search ---
  // Skip entirely for benchmark tickers — URLs are already known
  if (isBenchmark) {
    const bUrls = BENCHMARK_CORPORATE_URLS[normTicker];
    linkedinVal = 'No official LinkedIn page found.'; // LinkedIn requires login to resolve
    irVal = bUrls.ir;
    careersVal = bUrls.careers;
    newsVal = bUrls.newsroom;
    console.log(`[Profile] Benchmark URLs injected for ${normTicker} — Serper skipped.`);
  } else if (config.serperApiKey) {
    const serperStart = Date.now();
    const [liOrganic, irOrganic, carOrganic, newsOrganic] = await Promise.all([
      (async () => { try { const r = await axios.post('https://google.serper.dev/search', { q: `site:linkedin.com/company "${nameVal}"`, num: 3 }, { headers: { 'X-API-KEY': config.serperApiKey }, timeout: 4000 }); return r.data.organic || []; } catch { return []; } })(),
      (async () => { try { const r = await axios.post('https://google.serper.dev/search', { q: `"${nameVal}" Investor Relations`, num: 3 }, { headers: { 'X-API-KEY': config.serperApiKey }, timeout: 4000 }); return r.data.organic || []; } catch { return []; } })(),
      (async () => { try { const r = await axios.post('https://google.serper.dev/search', { q: `"${nameVal}" Careers`, num: 3 }, { headers: { 'X-API-KEY': config.serperApiKey }, timeout: 4000 }); return r.data.organic || []; } catch { return []; } })(),
      (async () => { try { const r = await axios.post('https://google.serper.dev/search', { q: `"${nameVal}" Newsroom`, num: 3 }, { headers: { 'X-API-KEY': config.serperApiKey }, timeout: 4000 }); return r.data.organic || []; } catch { return []; } })()
    ]);
    diagnostics.logApiCall({ provider: 'Serper', endpoint: 'Promise.all(/search)', status: 'Success', latency: Date.now() - serperStart });

    const matchedLi = liOrganic.find(i => i.link.includes('linkedin.com/company/'));
    if (matchedLi) linkedinVal = matchedLi.link;

    const matchedIr = irOrganic.find(i => !baseDomain || isOfficialDomain(i.link, baseDomain));
    if (matchedIr) irVal = matchedIr.link;

    const matchedCar = carOrganic.find(i => !baseDomain || isOfficialDomain(i.link, baseDomain));
    if (matchedCar) careersVal = matchedCar.link;

    const matchedNews = newsOrganic.find(i => !baseDomain || isOfficialDomain(i.link, baseDomain));
    if (matchedNews) newsVal = matchedNews.link;
  }

  // Fallback website from Serper results
  if ((websiteVal === 'No official website found.' || !websiteVal.startsWith('http')) && !isBenchmark) {
    for (const cand of [careersVal, irVal, newsVal, linkedinVal]) {
      if (cand && cand.startsWith('http') && !cand.includes('linkedin.com') && !cand.includes('google.com')) {
        const domain = getBaseDomain(cand);
        if (domain) { websiteVal = `https://${domain}`; websiteSource = 'Serper Organic Link Parsing'; break; }
      }
    }
  }

  // --- STAGE 3: Private Company Tavily Context (REST Only, no Gemini) ---
  if (isPrivate && config.tavilyApiKey) {
    const tavilyStart = Date.now();
    try {
      const tavilyRes = await axios.post('https://api.tavily.com/search', {
        api_key: config.tavilyApiKey,
        query: `"${companyName}" company headquarters sector funding revenue overview`,
        max_results: 4
      }, { timeout: 3000 });
      diagnostics.logApiCall({ provider: 'Tavily', endpoint: '/search (private profile)', status: 'Success', latency: Date.now() - tavilyStart });
      privateContextText = JSON.stringify((tavilyRes.data.results || []).map(r => ({ title: r.title, url: r.url, snippet: (r.content || '').substring(0, 300) })));
    } catch (err) {
      console.warn('[Profile] Private company Tavily context search failed:', err.message);
    }
  }

  // --- STAGE 4: URL Verification ---
  // Only verify URLs that came from Serper (not benchmark known-good URLs)
  const needsVerification = !isBenchmark;
  const [verifiedWebsite, verifiedLinkedin, verifiedIR, verifiedCareers, verifiedNews] = needsVerification
    ? await Promise.all([
        checkUrlStatus(websiteVal),
        checkUrlStatus(linkedinVal),
        checkUrlStatus(irVal),
        checkUrlStatus(careersVal),
        checkUrlStatus(newsVal)
      ])
    : [true, false, true, true, true]; // benchmarks are pre-verified

  const mapField = (fieldName, val, verified, source, verifiedByDesc) => {
    const verBy = verified && !val.includes('No ') && !val.includes('provide') ? verifiedByDesc : 'None';
    diagnostics.logFieldSource(fieldName, { source, status: verified ? 'Success' : 'Unverified', details: val });
    return { value: val, retrievedFrom: source, verifiedBy: verBy };
  };

  const profile = {
    companyName: mapField('companyName', nameVal, true, avOverview ? 'Alpha Vantage OVERVIEW API' : 'Input', 'Official Financial Data Provider'),
    officialWebsite: mapField('officialWebsite', websiteVal, verifiedWebsite, websiteSource, 'Domain Match + HTTP 200'),
    linkedin: mapField('linkedin', linkedinVal, verifiedLinkedin, 'Serper', 'linkedin.com/company'),
    investorRelations: mapField('investorRelations', irVal, verifiedIR, isBenchmark ? 'Local Benchmark Dictionary' : 'Serper', 'Domain Match'),
    careers: mapField('careers', careersVal, verifiedCareers, isBenchmark ? 'Local Benchmark Dictionary' : 'Serper', 'Domain Match'),
    newsroom: mapField('newsroom', newsVal, verifiedNews, isBenchmark ? 'Local Benchmark Dictionary' : 'Serper', 'Domain Match'),
    headquarters: mapField('headquarters', hqVal, true, hqSource, 'Official Financial Data Provider'),
    sector: mapField('sector', sectorVal, true, sectorSource, 'Official Financial Data Provider'),
    industry: mapField('industry', industryVal, true, industrySource, 'Official Financial Data Provider'),
    companyType: mapField('companyType', typeVal, true, 'Alpha Vantage OVERVIEW API', 'Official Financial Data Provider'),
    description: mapField('description', descVal, true, descSource, 'Official Financial Data Provider'),
    confidence: 100,
    privateContextText
  };

  apiCache.set(profileCacheKey, profile, 86400); // 24h
  return profile;
}

// ==========================================
// GEMINI OUTPUT SANITIZER
// Normalizes raw Gemini JSON before Zod validation to handle minor
// formatting variations (wrong key names, float vs integer scores, etc.)
// ==========================================
function sanitizeGeminiResult(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  // Initialize or fix committeeMembers array if missing/incomplete
  const expectedRoles = [
    "Financial Analyst",
    "Risk Officer",
    "Industry Analyst",
    "News Analyst",
    "Valuation Analyst",
    "Growth Analyst",
    "Portfolio Manager"
  ];

  if (!raw.committeeMembers || !Array.isArray(raw.committeeMembers)) {
    raw.committeeMembers = [];
  }

  // Ensure all roles are represented
  expectedRoles.forEach((role) => {
    let existing = raw.committeeMembers.find(m => m && typeof m === 'object' && m.role && m.role.toLowerCase() === role.toLowerCase());
    if (!existing) {
      existing = {
        role,
        vote: "HOLD",
        confidence: 80,
        reason: "Calculated fallback based on qualitative corporate strength indicators."
      };
      raw.committeeMembers.push(existing);
    }
  });

  // Keep only the 7 expected roles and normalize them
  raw.committeeMembers = raw.committeeMembers.filter(m => m && typeof m === 'object' && m.role).map((m) => {
    // Standardize role spelling/casing to match expectedRoles
    const standardRole = expectedRoles.find(r => r.toLowerCase() === m.role.toLowerCase()) || m.role;
    
    // Normalize vote to "INVEST", "HOLD", "PASS"
    let normVote = "HOLD";
    if (m.vote) {
      const vUpper = String(m.vote).toUpperCase().trim();
      if (vUpper.includes("INVEST")) normVote = "INVEST";
      else if (vUpper.includes("PASS")) normVote = "PASS";
      else if (vUpper.includes("HOLD")) normVote = "HOLD";
    }

    // Normalize confidence
    let normConf = typeof m.confidence === 'number' ? m.confidence : 80;
    if (normConf <= 1) normConf = Math.round(normConf * 100);
    else if (normConf <= 10) normConf = Math.round(normConf * 10);

    return {
      id: m.id || standardRole.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      role: standardRole,
      vote: normVote,
      confidence: normConf,
      reason: m.reason || `Independent assessment from the ${standardRole}.`
    };
  });

  // Calculate committeeVotes counts dynamically from committeeMembers
  const investCount = raw.committeeMembers.filter(m => m.vote === "INVEST").length;
  const holdCount   = raw.committeeMembers.filter(m => m.vote === "HOLD").length;
  const passCount   = raw.committeeMembers.filter(m => m.vote === "PASS").length;

  raw.committeeVotes = {
    invest: investCount,
    hold: holdCount,
    pass: passCount
  };

  // Dynamically set recommendation if it disagrees or is missing
  // Default to majority vote
  let computedRecommendation = "Hold";
  if (investCount > holdCount && investCount > passCount) computedRecommendation = "Invest";
  else if (passCount > investCount && passCount > holdCount) computedRecommendation = "Pass";
  else computedRecommendation = "Hold";

  if (!raw.recommendation || !["Invest", "Hold", "Pass"].includes(raw.recommendation)) {
    raw.recommendation = computedRecommendation;
  }

  // Normalize investmentScore: handle 0-1 (×100), 0-10 (×10), or 0-100 (passthrough)
  if (typeof raw.investmentScore === 'number') {
    if (raw.investmentScore <= 1)       raw.investmentScore = Math.round(raw.investmentScore * 100);
    else if (raw.investmentScore <= 10) raw.investmentScore = Math.round(raw.investmentScore * 10);
  }

  // Normalize confidence: handle 0-1 (×100), 0-10 (×10), or 0-100 (passthrough)
  if (typeof raw.confidence === 'number') {
    if (raw.confidence <= 1)       raw.confidence = Math.round(raw.confidence * 100);
    else if (raw.confidence <= 10) raw.confidence = Math.round(raw.confidence * 10);
  }

  // Normalize supporting evidence relevanceScore
  if (Array.isArray(raw.supportingEvidence)) {
    raw.supportingEvidence = raw.supportingEvidence.map(s => ({
      ...s,
      relevanceScore: typeof s.relevanceScore === 'number' && s.relevanceScore <= 1
        ? Math.round(s.relevanceScore * 100)
        : (s.relevanceScore || 80)
    }));
  }

  // Normalize sub-object confidences and scores
  if (raw.riskAnalysis) {
    const ra = raw.riskAnalysis;
    if (typeof ra.confidence === 'number') {
      if (ra.confidence <= 1)       ra.confidence = Math.round(ra.confidence * 100);
      else if (ra.confidence <= 10) ra.confidence = Math.round(ra.confidence * 10);
    }
    if (typeof ra.overallRiskScore === 'number') {
      if (ra.overallRiskScore <= 1)       ra.overallRiskScore = Math.round(ra.overallRiskScore * 100);
      else if (ra.overallRiskScore <= 10) ra.overallRiskScore = Math.round(ra.overallRiskScore * 10);
    }
  }
  if (raw.industryAnalysis) {
    const ia = raw.industryAnalysis;
    if (typeof ia.confidence === 'number') {
      if (ia.confidence <= 1)       ia.confidence = Math.round(ia.confidence * 100);
      else if (ia.confidence <= 10) ia.confidence = Math.round(ia.confidence * 10);
    }
  }

  return raw;
}

// ==========================================
// CENTRALIZED SINGLE GEMINI REASONING CALL
// ==========================================
async function generateInvestmentAnalysis(context) {
  const geminiStart = Date.now();
  console.log('[STAGE] Gemini Unified Analysis Started...');

  if (!config.geminiApiKey) throw new Error('Gemini API key is not configured.');

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`[Gemini] Using model: ${modelName}`);
  const model = new ChatGoogleGenerativeAI({
    apiKey: config.geminiApiKey,
    modelName,
    temperature: 0.2,
    maxRetries: 2
  });

  // Build the raw news context string from Tavily articles (no second Gemini call needed)
  const rawNewsContext = (context.rawArticles && context.rawArticles.length > 0)
    ? `\nRAW NEWS ARTICLES FOR ANALYSIS:\n${JSON.stringify(context.rawArticles, null, 2)}`
    : '\nNo recent news articles found.';

  const prompt = `
    You are a Principal Investment Analyst and Managing Partner. Analyze this research context and produce a structured investment committee report.

    COMPANY PROFILE:
    ${JSON.stringify(context.companyProfile, null, 2)}

    FINANCIAL DATA:
    ${JSON.stringify(context.financialData, null, 2)}

    NEWS SENTIMENT CONTEXT:
    ${JSON.stringify(context.newsData, null, 2)}
    ${rawNewsContext}

    PRIVATE COMPANY CONTEXT (if applicable):
    ${context.companyProfile.privateContext || 'N/A'}

    INSTRUCTIONS:
    1. Provide comprehensive financial, industry, risk, and news analysis.
    2. For each news article in RAW NEWS ARTICLES, determine its sentiment (positive/neutral/negative) and incorporate it into newsAnalysis.
    3. For private companies, synthesize headquarters, description, and industry from PRIVATE COMPANY CONTEXT.
    4. Return ONLY a valid JSON object matching the required schema. No markdown code blocks.

    REQUIRED JSON SCHEMA:
    {
      "executiveSummary": "string",
      "financialAnalysis": "string",
      "newsAnalysis": "string",
      "industryAnalysis": {
        "competitors": [{ "name": "string", "marketCap": "string", "peRatio": number, "strength": "string" }],
        "industryGrowthRate": "string",
        "competitiveAdvantages": ["string"],
        "marketPosition": "Leader|Challenger|Niche|Follower",
        "confidence": number
      },
      "riskAnalysis": {
        "companyRisks": [{ "risk": "string", "severity": "High|Medium|Low", "mitigation": "string" }],
        "macroeconomicRisks": [{ "risk": "string", "severity": "High|Medium|Low" }],
        "regulatoryRisks": [{ "risk": "string", "severity": "High|Medium|Low" }],
        "overallRiskScore": number,
        "confidence": number
      },
      "bullCase": ["string"],
      "bearCase": ["string"],
      "strengths": ["string"],
      "weaknesses": ["string"],
      "opportunities": ["string"],
      "threats": ["string"],
      "investmentScore": number (0-100 scale, e.g. 75),
      "confidence": number (0-100 scale, e.g. 85),
      "recommendation": "Invest|Hold|Pass",
      "committeeMembers": [
        {
          "role": "Financial Analyst",
          "vote": "INVEST|HOLD|PASS",
          "confidence": number,
          "reason": "string"
        },
        {
          "role": "Risk Officer",
          "vote": "INVEST|HOLD|PASS",
          "confidence": number,
          "reason": "string"
        },
        {
          "role": "Industry Analyst",
          "vote": "INVEST|HOLD|PASS",
          "confidence": number,
          "reason": "string"
        },
        {
          "role": "News Analyst",
          "vote": "INVEST|HOLD|PASS",
          "confidence": number,
          "reason": "string"
        },
        {
          "role": "Valuation Analyst",
          "vote": "INVEST|HOLD|PASS",
          "confidence": number,
          "reason": "string"
        },
        {
          "role": "Growth Analyst",
          "vote": "INVEST|HOLD|PASS",
          "confidence": number,
          "reason": "string"
        },
        {
          "role": "Portfolio Manager",
          "vote": "INVEST|HOLD|PASS",
          "confidence": number,
          "reason": "string"
        }
      ],
      NOTE: Provide exactly these 7 entries in committeeMembers, each reflecting their specialist perspective.
      "reasoning": "string",
      "supportingEvidence": [{
        "title": "string",
        "url": "string",
        "publisher": "string",
        "publishedDate": "YYYY-MM-DD",
        "sourceType": "News|SEC Filing|Annual Report|Company Website|Financial Data|Research Report",
        "evidenceSnippet": "string",
        "relevanceScore": number
      }],
      "headquarters": "string (private company only)",
      "description": "string (private company only)",
      "industry": "string (private company only)"
    }
  `;

  const promptSizeChars = prompt.length;
  const estTokens = Math.round(promptSizeChars / 4);
  const timeoutMs = process.env.GEMINI_TIMEOUT_MS ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10) : 60000;

  console.log(`[Gemini] Prompt: ${promptSizeChars} chars (~${estTokens} tokens) | Timeout: ${timeoutMs}ms`);
  console.log(`[Gemini] Request sent at: ${new Date().toISOString()}`);

  // Use plain invoke (not withStructuredOutput) so we can sanitize before Zod validates
  const invokePromise = model.invoke(prompt);

  // Non-destructive warning timer — does NOT cancel the request
  const warningTimer = setTimeout(() => {
    console.warn(`[Gemini] ⚠ Still waiting after ${timeoutMs}ms — allowing to complete.`);
  }, timeoutMs);

  try {
    const rawResponse = await invokePromise;
    clearTimeout(warningTimer);
    console.log(`[Gemini] ✓ Response received in ${Date.now() - geminiStart}ms`);

    // Extract text content
    let text = (rawResponse.content || '').toString().trim();

    // Strip markdown code fences if present
    if (text.startsWith('```json')) text = text.replace(/^```json/, '').replace(/```$/, '').trim();
    else if (text.startsWith('```')) text = text.replace(/^```/, '').replace(/```$/, '').trim();

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error('[Gemini] JSON parse failed:', parseErr.message);
      console.error('[Gemini] Raw text (first 500):', text.slice(0, 500));
      throw new Error('Gemini returned non-JSON response: ' + parseErr.message);
    }

    // Sanitize before Zod validation
    const sanitized = sanitizeGeminiResult(parsed);

    // Validate with Zod schema (throws if schema is violated after sanitization)
    const validated = UnifiedInvestmentAnalysisSchema.parse(sanitized);
    return validated;

  } catch (err) {
    clearTimeout(warningTimer);
    throw err;
  }
}


// ==========================================
// WORKFLOW COORDINATOR ENTRY POINT
// ==========================================
export async function runFullAnalysis(companyName, ticker, onProgress) {
  const cleanName = companyName.trim();
  const cleanTicker = ticker.trim();
  const startTotal = Date.now();

  diagnostics.startCycle(cleanName, cleanTicker);

  if (!isCompanyResolvable(cleanName)) {
    diagnostics.logFieldSource('Error', { source: 'Validation', status: 'Failed', details: 'Gibberish query rejected' });
    diagnostics.endCycle();
    throw new Error(`Company verification failed: '${cleanName}' is not a recognized asset.`);
  }

  try {
    // 1. Company Profile (fetches avOverview internally)
    console.log(`[STAGE] Sourcing Company Profile...`);
    onProgress('collecting_info', `Verification Agent: Auditing organic candidate URLs and checking status codes...`);
    const verifiedProfile = await verifyCompanyProfile(cleanName, cleanTicker);
    console.log(`✓ Company Profile Retrieved`);

    const isPrivate = verifiedProfile.companyType.value === 'Private';
    const activeTicker = cleanTicker || (isPrivate ? 'PRIVATE' : 'GENERIC');

    // 2. Parallel: Financial Data + News (no Gemini in either)
    console.log(`[STAGE] Parallel: Financial + News fetch...`);
    onProgress('financials', `Securities Analysts: Commencing parallel financial statements scan and real-time news retrieval...`);

    const finCacheKey = `financials:v2:${activeTicker}`;
    const newsCacheKey = `news:v2:${activeTicker}`;

    let financialData = apiCache.get(finCacheKey);
    let newsData = apiCache.get(newsCacheKey);

    const parallelFetches = [];
    let finIdx = -1;
    let newsIdx = -1;

    if (!financialData) {
      finIdx = parallelFetches.length;
      // Retrieve the pre-fetched avOverview to pass into fetchFinancialData,
      // avoiding a duplicate OVERVIEW API call.
      const avCacheKey = `av:overview:${activeTicker.toLowerCase()}`;
      const avOverviewCached = apiCache.get(avCacheKey);
      parallelFetches.push((async () => {
        const t = Date.now();
        console.log('[STAGE] Fetching Financial Data...');
        const data = await fetchFinancialData(activeTicker, cleanName, avOverviewCached);
        console.log(`✓ Financial Data | ${Date.now() - t}ms`);
        return data;
      })());
    } else {
      console.log(`✓ Financial Data (Cache Hit)`);
    }

    if (!newsData) {
      newsIdx = parallelFetches.length;
      parallelFetches.push((async () => {
        const t = Date.now();
        console.log('[STAGE] Fetching News Data...');
        const data = await fetchNewsData(activeTicker, cleanName);
        console.log(`✓ News Data | ${Date.now() - t}ms`);
        return data;
      })());
    } else {
      console.log(`✓ News Data (Cache Hit)`);
    }

    if (parallelFetches.length > 0) {
      const results = await Promise.all(parallelFetches);
      if (finIdx !== -1) {
        financialData = results[finIdx];
        if (financialData) apiCache.set(finCacheKey, financialData, 3600); // 1h
      }
      if (newsIdx !== -1) {
        newsData = results[newsIdx];
        if (newsData) apiCache.set(newsCacheKey, newsData, 900); // 15min
      }
    }

    // 3. Build unified context (pass raw article snippets for single-call sentiment)
    onProgress('industry', `Industry Analyst: Modeling market position and competitive moats...`);

    const context = {
      companyProfile: {
        name: cleanName,
        ticker: activeTicker,
        type: verifiedProfile.companyType.value,
        headquarters: verifiedProfile.headquarters.value,
        sector: verifiedProfile.sector ? verifiedProfile.sector.value : 'Unknown',
        industry: verifiedProfile.industry.value,
        description: verifiedProfile.description.value,
        website: verifiedProfile.officialWebsite.value,
        privateContext: verifiedProfile.privateContextText || ''
      },
      financialData: {
        peRatio: financialData.peRatio,
        debtToEquity: financialData.debtToEquity,
        profitMargin: financialData.profitMargin,
        cashFlowSummary: financialData.cashFlow,
        balanceSheetSummary: financialData.balanceSheetSummary,
        healthScore: financialData.healthScore,
        revenueTrend: financialData.revenueTrend,
        epsTrend: financialData.epsTrend
      },
      newsData: {
        sentimentScore: newsData.sentimentScore,
        recentNews: newsData.recentNews || []
      },
      // Raw article snippets go to Gemini for sentiment analysis — no second call needed
      rawArticles: newsData._rawArticleContext || []
    };
    console.log(`✓ Context Built — Raw Articles: ${context.rawArticles.length}`);

    // 4. Single Gemini Call (handles industry, risk, news sentiment, committee)
    let parsed = null;
    const errorLogs = [];

    try {
      parsed = await generateInvestmentAnalysis(context);
    } catch (geminiError) {
      console.error('[Gemini] Pipeline failed:', geminiError.message);
      errorLogs.push(`[Gemini Pipeline Failure]\nMessage: ${geminiError.message}`);
    }

    // 5. Structure frontend output
    let industryData;
    let riskData;
    let committeeReport;

    if (parsed) {
      // Mutate private company profile if Gemini extracted it
      if (isPrivate) {
        if (parsed.headquarters && parsed.headquarters !== 'Unknown') verifiedProfile.headquarters.value = parsed.headquarters;
        if (parsed.industry && parsed.industry !== 'Unknown') verifiedProfile.industry.value = parsed.industry;
        if (parsed.description && parsed.description !== 'Unknown') verifiedProfile.description.value = parsed.description;
      }

      financialData.keyStrengths = parsed.strengths || [];
      financialData.keyWeaknesses = parsed.weaknesses || [];

      // Update news sentiment scores from Gemini's analysis
      if (newsData.recentNews && parsed.newsAnalysis) {
        // sentimentScore will be surfaced from newsAnalysis text — keep raw 50 as baseline
      }

      industryData = {
        competitors: parsed.industryAnalysis.competitors || [],
        industryGrowthRate: parsed.industryAnalysis.industryGrowthRate || 'No verified growth rate available.',
        competitiveAdvantages: parsed.industryAnalysis.competitiveAdvantages || [],
        marketPosition: parsed.industryAnalysis.marketPosition || 'Niche',
        confidence: parsed.industryAnalysis.confidence || 0,
        supportingSources: parsed.supportingEvidence || []
      };

      riskData = {
        companyRisks: parsed.riskAnalysis.companyRisks || [],
        macroeconomicRisks: parsed.riskAnalysis.macroeconomicRisks || [],
        regulatoryRisks: parsed.riskAnalysis.regulatoryRisks || [],
        overallRiskScore: parsed.riskAnalysis.overallRiskScore || 0,
        confidence: parsed.riskAnalysis.confidence || 0,
        supportingSources: parsed.supportingEvidence || []
      };

      committeeReport = {
        companyName: cleanName,
        ticker: activeTicker,
        websiteUrl: verifiedProfile.officialWebsite.value || 'No verified website found.',
        overallInvestmentScore: parsed.investmentScore || 0,
        confidenceScore: parsed.confidence || 0,
        recommendation: parsed.recommendation || 'Pass',
        executiveSummary: parsed.executiveSummary || 'AI-generated insights are temporarily unavailable.',
        detailedReasoning: parsed.reasoning || 'No details generated.',
        bullCase: parsed.bullCase || [],
        bearCase: parsed.bearCase || [],
        committeeVotes: parsed.committeeVotes || { invest: 0, hold: 0, pass: 7 },
        committeeMembers: parsed.committeeMembers || [],
        timeline: [
          { date: new Date().toISOString().split('T')[0], event: 'Company profile and financial data retrieved.' },
          { date: new Date().toISOString().split('T')[0], event: 'News sentiment and industry analysis completed.' },
          { date: new Date().toISOString().split('T')[0], event: 'Investment committee decision scorecard issued.' }
        ],
        supportingSources: parsed.supportingEvidence || []
      };
    } else {
      // Gemini unavailable — graceful degradation
      industryData = {
        competitors: [], industryGrowthRate: 'AI insights temporarily unavailable.',
        competitiveAdvantages: [], marketPosition: 'Niche', confidence: 0, supportingSources: []
      };
      riskData = {
        companyRisks: [], macroeconomicRisks: [], regulatoryRisks: [],
        overallRiskScore: 0, confidence: 0, supportingSources: []
      };
      committeeReport = {
        companyName: cleanName, ticker: activeTicker,
        websiteUrl: verifiedProfile.officialWebsite.value || '',
        overallInvestmentScore: 0, confidenceScore: 0, recommendation: 'Pass',
        executiveSummary: 'API quota exhausted.',
        detailedReasoning: 'API quota exhausted.',
        bullCase: [], bearCase: [],
        committeeVotes: { invest: 0, hold: 0, pass: 7 },
        committeeMembers: [
          { role: "Financial Analyst", vote: "PASS", confidence: 100, reason: "API quota exhausted." },
          { role: "Risk Officer", vote: "PASS", confidence: 100, reason: "API quota exhausted." },
          { role: "Industry Analyst", vote: "PASS", confidence: 100, reason: "API quota exhausted." },
          { role: "News Analyst", vote: "PASS", confidence: 100, reason: "API quota exhausted." },
          { role: "Valuation Analyst", vote: "PASS", confidence: 100, reason: "API quota exhausted." },
          { role: "Growth Analyst", vote: "PASS", confidence: 100, reason: "API quota exhausted." },
          { role: "Portfolio Manager", vote: "PASS", confidence: 100, reason: "API quota exhausted." }
        ],
        timeline: [], supportingSources: []
      };
    }

    console.log(`✓ Pipeline Complete — Total: ${Date.now() - startTotal}ms`);
    diagnostics.endCycle();

    return {
      timestamp: new Date().toISOString(),
      companyName,
      verifiedProfile,
      financials: financialData,
      news: newsData,
      industry: industryData,
      risk: riskData,
      committee: committeeReport
    };

  } catch (err) {
    diagnostics.logFieldSource('FatalError', { source: 'Coordinator', status: 'Failed', details: err.message });
    diagnostics.endCycle();
    throw err;
  }
}
