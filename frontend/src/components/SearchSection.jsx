import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Building2, Bookmark } from 'lucide-react';

const POPULAR_TICKERS = [
  { name: 'Nvidia Corp.', ticker: 'NVDA' },
  { name: 'Apple Inc.', ticker: 'AAPL' },
  { name: 'Tesla, Inc.', ticker: 'TSLA' },
  { name: 'Microsoft Corp.', ticker: 'MSFT' }
];

// Persistent client-side cache for autocomplete queries
const autocompleteCache = {};

export function SearchSection({ onSearch, loading }) {
  const [company, setCompany] = useState('');
  const [ticker, setTicker] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showSuggestions && filteredSuggestions.length > 0) {
      const topSuggestion = filteredSuggestions[0];
      handleSelectSuggestion(topSuggestion.companyName, topSuggestion.symbol);
      onSearch(topSuggestion.companyName, topSuggestion.symbol);
      return;
    }
    if (!company.trim()) return;
    onSearch(company.trim(), ticker.trim());
  };

  // Debounced API autocomplete fetching with request cancellation & client caching
  useEffect(() => {
    const searchVal = company.trim();
    if (searchVal.length > 0) {
      // 1. Check local cache first for instant resolution
      if (autocompleteCache[searchVal.toLowerCase()]) {
        setFilteredSuggestions(autocompleteCache[searchVal.toLowerCase()]);
        setShowSuggestions(true);
        return;
      }

      const controller = new AbortController();
      const timer = setTimeout(async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin.replace('5173', '5000');
          const res = await fetch(
            `${API_BASE_URL}/api/search?keywords=${encodeURIComponent(searchVal)}`,
            { signal: controller.signal }
          );
          if (res.ok) {
            const data = await res.json();
            // 2. Save to cache
            autocompleteCache[searchVal.toLowerCase()] = data;
            setFilteredSuggestions(data);
            setShowSuggestions(true);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('[Autocomplete fetch error]:', error);
          }
        }
      }, 200); // Faster 200ms debounce response

      return () => {
        clearTimeout(timer);
        controller.abort(); // Cancel preceding pending request
      };
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [company]);

  const handleSelectSuggestion = (name, symbol) => {
    setCompany(name);
    setTicker(symbol);
    setShowSuggestions(false);
  };

  const handleSelectQuick = (name, symbol) => {
    setCompany(name);
    setTicker(symbol);
    onSearch(name, symbol);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 flex flex-col items-center">
      {/* Title / Hero */}
      <div className="text-center mb-10 select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800/80 mb-4 text-emerald-400 text-xs font-mono">
          <Sparkles size={13} />
          <span>MULTI-AGENT AI INVESTMENT SECURITIES INTELLIGENCE</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight font-outfit mb-3">
          SaaS Investment Committee
        </h1>
        <p className="text-slate-400 text-md max-w-xl mx-auto">
          Deploy five specialized AI agents to analyze financials, crawl real-time news, model industry moats, and simulate committee decisions.
        </p>
      </div>

      {/* Main Search Console */}
      <form id="tour-search-bar" onSubmit={handleSubmit} className="w-full glass-panel p-2 flex flex-col md:flex-row gap-2 shadow-2xl relative">
        <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-950/60 rounded-lg border border-slate-800/60 focus-within:border-emerald-500/40 transition relative">
          <Building2 className="text-slate-400 flex-shrink-0" size={18} />
          <input
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onFocus={() => {
              if (company.trim().length > 0) setShowSuggestions(true);
            }}
            disabled={loading}
            placeholder="Company Name (e.g. Tesla, Apple)"
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50"
          />

          {/* Autocomplete Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-850/60"
            >
              {filteredSuggestions.map((item) => (
                <button
                   key={`${item.symbol}:${item.companyName}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(item.companyName, item.symbol)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-200 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Logo with Image Fallback */}
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-805 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={item.logoUrl} 
                        alt="" 
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => {
                          e.target.src = `https://placehold.co/32x32/020617/10b981?text=${item.symbol.charAt(0)}`;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 group-hover:text-white transition truncate text-sm">
                        {item.companyName || 'Unknown Entity'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-slate-350">{item.symbol}</span>
                        <span>•</span>
                        <span className="text-emerald-450 font-bold">{item.assetType}</span>
                        <span>•</span>
                        <span>{item.exchange}</span>
                        <span>•</span>
                        <span>{item.region}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs font-bold text-slate-500 font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-850 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition flex-shrink-0">
                    {item.currency}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-32 flex items-center gap-2.5 px-3 py-2 bg-slate-950/60 rounded-lg border border-slate-800/60 focus-within:border-emerald-500/40 transition">
          <Bookmark className="text-slate-400 flex-shrink-0" size={18} />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            disabled={loading}
            placeholder="Ticker"
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50 uppercase"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !company.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-semibold px-6 py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
        >
          <Search size={16} />
          <span>Analyze Asset</span>
        </button>
      </form>

      {/* Quick Suggestions */}
      <div className="mt-8 w-full">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-widest text-center mb-3">
          Simulated Benchmark Assets
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {POPULAR_TICKERS.map((item) => (
            <button
              key={item.ticker}
              type="button"
              disabled={loading}
              onClick={() => handleSelectQuick(item.name, item.ticker)}
              className="flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-900/90 active:bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-xl transition text-left group"
            >
              <div>
                <div className="text-xs font-mono text-emerald-400 font-bold">{item.ticker}</div>
                <div className="text-sm font-semibold text-slate-300 group-hover:text-white transition">{item.name}</div>
              </div>
              <div className="text-xs text-slate-600 font-mono border border-slate-800 rounded px-1 group-hover:border-slate-700 group-hover:text-slate-400 transition bg-slate-950/60">
                AUTO
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default SearchSection;
