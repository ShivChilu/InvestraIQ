import { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Newspaper,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  FileCheck
} from 'lucide-react';
import { ExplainabilityModal, getSourceQuality } from './ExplainabilityModal';

export function MetricsTabs({ financials, news, industry, risk }) {
  const [activeTab, setActiveTab] = useState('financials');
  
  // Explainability Modal State
  const [selectedClaim, setSelectedClaim] = useState(null);

  const tabs = [
    { id: 'financials', label: 'Financial Health', icon: DollarSign },
    { id: 'news', label: 'News & Sentiment', icon: Newspaper },
    { id: 'industry', label: 'Industry & Moats', icon: TrendingUp },
    { id: 'risk', label: 'Risk Profile', icon: ShieldAlert },
    { id: 'references', label: 'References & Citations', icon: BookOpen }
  ];

  // Union of all unique references across all agents
  const allSources = [
    ...(financials.supportingSources || []),
    ...(news.supportingSources || []),
    ...(industry.supportingSources || []),
    ...(risk.supportingSources || [])
  ];

  // Deduplicate sources by URL
  const uniqueUrls = new Set();
  const deduplicatedSources = [];
  for (const src of allSources) {
    if (!uniqueUrls.has(src.url)) {
      uniqueUrls.add(src.url);
      deduplicatedSources.push(src);
    }
  }

  // Group references by quality class
  const groupedSources = {
    Official: deduplicatedSources.filter(s => getSourceQuality(s.sourceType, s.publisher) === 'Official'),
    Financial: deduplicatedSources.filter(s => getSourceQuality(s.sourceType, s.publisher) === 'Financial'),
    News: deduplicatedSources.filter(s => getSourceQuality(s.sourceType, s.publisher) === 'News'),
    Research: deduplicatedSources.filter(s => getSourceQuality(s.sourceType, s.publisher) === 'Research')
  };

  const triggerExplainability = (title, claim, persona, confidence, sources) => {
    setSelectedClaim({ title, claim, persona, confidence, sources });
  };

  return (
    <div className="w-full mb-8">
      {/* Tab Selectors */}
      <div id="tour-metrics-tabs" className="flex border-b border-slate-800 bg-slate-900/20 rounded-t-xl p-1 gap-1.5 no-print overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition flex-shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-md border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'references' && deduplicatedSources.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-emerald-400">
                  {deduplicatedSources.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="glass-panel p-6 rounded-b-xl border-t-0">
        
        {/* FINANCIALS TAB */}
        {activeTab === 'financials' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-6">
              <div>
                <h4 className="font-bold text-sm text-white font-outfit">Balance Sheets & Profit Ratios</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">SOURCED FROM AUDITED FINANCIAL OVERVIEWS</p>
              </div>
              <button 
                onClick={() => triggerExplainability(
                  'Financial Health Analysis Sources',
                  'Metrics evaluated: PE Ratio, Debt-to-Equity, Cash Flow statements, and Balance Sheet health.',
                  'Financial Analyst',
                  financials.confidence || 85,
                  financials.supportingSources || []
                )}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-350 transition flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 rounded border border-slate-850"
              >
                <FileCheck size={12} />
                <span>Verify Financial Evidence</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div 
                className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/60 cursor-pointer hover:border-slate-700 transition group"
                onClick={() => triggerExplainability(
                  'Price-to-Earnings Evaluation',
                  `Company PE ratio is at ${financials.peRatio || 'N/A'}. Higher ratios indicate higher premium growth expectations.`,
                  'Financial Analyst',
                  financials.confidence || 85,
                  financials.supportingSources || []
                )}
              >
                <span className="text-[10px] font-mono text-slate-500 uppercase group-hover:text-emerald-400 transition">P/E Ratio</span>
                <div className="text-xl font-bold text-white mt-1 flex items-center justify-between">
                  <span>{financials.peRatio || 'N/A'}</span>
                  <span className="text-[9px] font-mono text-slate-650 opacity-0 group-hover:opacity-100 transition">Trace</span>
                </div>
              </div>
              <div 
                className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/60 cursor-pointer hover:border-slate-700 transition group"
                onClick={() => triggerExplainability(
                  'Debt-to-Equity Leverage Audits',
                  `Debt-to-equity leverage sits at ${financials.debtToEquity || 'N/A'}. Safe thresholds fall below 1.5x.`,
                  'Financial Analyst',
                  financials.confidence || 85,
                  financials.supportingSources || []
                )}
              >
                <span className="text-[10px] font-mono text-slate-500 uppercase group-hover:text-emerald-400 transition">Debt to Equity</span>
                <div className="text-xl font-bold text-white mt-1 flex items-center justify-between">
                  <span>{financials.debtToEquity || 'N/A'}</span>
                  <span className="text-[9px] font-mono text-slate-650 opacity-0 group-hover:opacity-100 transition">Trace</span>
                </div>
              </div>
              <div 
                className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/60 cursor-pointer hover:border-slate-700 transition group"
                onClick={() => triggerExplainability(
                  'Topline Operating Profit Margin',
                  `Operating net profit margin is recorded at ${financials.profitMargin ? `${(financials.profitMargin * 100).toFixed(1)}%` : 'N/A'}.`,
                  'Financial Analyst',
                  financials.confidence || 85,
                  financials.supportingSources || []
                )}
              >
                <span className="text-[10px] font-mono text-slate-500 uppercase group-hover:text-emerald-400 transition">Profit Margin</span>
                <div className="text-xl font-bold text-white mt-1 flex items-center justify-between">
                  <span>{financials.profitMargin ? `${(financials.profitMargin * 100).toFixed(1)}%` : 'N/A'}</span>
                  <span className="text-[9px] font-mono text-slate-650 opacity-0 group-hover:opacity-100 transition">Trace</span>
                </div>
              </div>
              <div 
                className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/60 flex items-center justify-between cursor-pointer hover:border-slate-700 transition group"
                onClick={() => triggerExplainability(
                  'Composite Asset Health Index',
                  `Algorithmic health score evaluated at ${financials.healthScore}/100 based on leverage ratios and margin metrics.`,
                  'Financial Analyst',
                  financials.confidence || 85,
                  financials.supportingSources || []
                )}
              >
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase group-hover:text-emerald-400 transition">Health Score</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{financials.healthScore}/100</div>
                </div>
                <Activity className="text-emerald-500/20 group-hover:text-emerald-400/50 transition" size={24} />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div 
                onClick={() => triggerExplainability(
                  'Cash Flow Statement Insight Trace',
                  financials.cashFlow,
                  'Financial Analyst',
                  financials.confidence || 85,
                  financials.supportingSources || []
                )}
                className="cursor-pointer hover:bg-slate-950/70 transition rounded-lg group"
              >
                <div className="flex justify-between items-center px-1 mb-1">
                  <h5 className="text-xs font-mono text-slate-450 uppercase group-hover:text-emerald-400 transition">Cash Flow Statement Summary</h5>
                  <span className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">Explain Insight</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-850/40 group-hover:border-slate-700 transition">
                  {financials.cashFlow}
                </p>
              </div>
              <div 
                onClick={() => triggerExplainability(
                  'Balance Sheet Audit Summary Trace',
                  financials.balanceSheetSummary,
                  'Financial Analyst',
                  financials.confidence || 85,
                  financials.supportingSources || []
                )}
                className="cursor-pointer hover:bg-slate-950/70 transition rounded-lg group"
              >
                <div className="flex justify-between items-center px-1 mb-1">
                  <h5 className="text-xs font-mono text-slate-450 uppercase group-hover:text-emerald-400 transition">Balance Sheet Audit Summary</h5>
                  <span className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">Explain Insight</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-850/40 group-hover:border-slate-700 transition">
                  {financials.balanceSheetSummary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  Operational Strengths
                </h5>
                <ul className="space-y-2">
                  {financials.keyStrengths.map((str, i) => (
                    <li 
                      key={i} 
                      onClick={() => triggerExplainability(
                        `Operational Strength #${i+1} Trace`,
                        str,
                        'Financial Analyst',
                        financials.confidence || 85,
                        financials.supportingSources || []
                      )}
                      className="text-xs text-slate-300 flex gap-2 items-start leading-relaxed bg-slate-900/20 p-2.5 rounded border border-slate-850/40 hover:border-slate-700 cursor-pointer transition group"
                    >
                      <span className="text-emerald-400 font-bold">•</span>
                      <span className="flex-1">{str}</span>
                      <span className="text-[8px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0">Verify</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-mono text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Financial Weaknesses
                </h5>
                <ul className="space-y-2">
                  {financials.keyWeaknesses.map((weak, i) => (
                    <li 
                      key={i}
                      onClick={() => triggerExplainability(
                        `Financial Weakness #${i+1} Trace`,
                        weak,
                        'Financial Analyst',
                        financials.confidence || 85,
                        financials.supportingSources || []
                      )}
                      className="text-xs text-slate-300 flex gap-2 items-start leading-relaxed bg-slate-900/20 p-2.5 rounded border border-slate-850/40 hover:border-slate-700 cursor-pointer transition group"
                    >
                      <span className="text-rose-450 font-bold">•</span>
                      <span className="flex-1">{weak}</span>
                      <span className="text-[8px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0">Verify</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* NEWS & SENTIMENT TAB */}
        {activeTab === 'news' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h4 className="font-bold text-sm text-white font-outfit">Real-Time News Stream</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">CRAWLED PUBLIC PRESS & HEADLINES</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => triggerExplainability(
                    'News Sentiments & Crawl Sources',
                    'Crawled active press releases and evaluated sentiments using relevance filters.',
                    'News Analyst',
                    news.confidence || 85,
                    news.supportingSources || []
                  )}
                  className="text-[10px] font-mono text-emerald-400 hover:text-emerald-350 transition flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 rounded border border-slate-850"
                >
                  <FileCheck size={12} />
                  <span>Verify Sentiment Evidence</span>
                </button>
                <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Sentiment Index</span>
                  <span className="text-lg font-bold text-emerald-400 font-outfit">{news.sentimentScore}/100</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {news.recentNews.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-800/80">
                  <p className="text-slate-400 text-sm font-medium">
                    No relevant news articles were found for this company.
                  </p>
                </div>
              ) : (
                news.recentNews.map((article, i) => {
                  const badge = 
                    article.sentiment === 'positive' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    article.sentiment === 'negative' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                    'text-slate-400 bg-slate-800/40 border-slate-800';

                  return (
                    <div 
                      key={i} 
                      className="bg-slate-950/30 p-4 rounded-xl border border-slate-850/60 flex items-start justify-between gap-4 hover:bg-slate-950/70 cursor-pointer transition group"
                      onClick={() => triggerExplainability(
                        `News Sentiment Verification: ${article.source}`,
                        article.title,
                        'News Analyst',
                        news.confidence || 88,
                        (news.supportingSources || []).filter(s => s.url === article.url || s.title === article.title)
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500">{article.date}</span>
                          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                            {article.source}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${badge}`}>
                            {article.sentiment}
                          </span>
                        </div>
                        <h5 className="font-semibold text-sm text-white leading-snug group-hover:text-emerald-400 transition">
                          {article.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[8px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">Trace Relevance</span>
                        {article.url && article.url !== '#' && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 p-1 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ArrowUpRight size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-xs font-mono text-slate-450 uppercase mb-2.5">Key Market Catalysts</h5>
                <ul className="space-y-1.5">
                  {news.marketEvents.map((evt, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed list-disc list-inside bg-slate-950/20 p-2 rounded border border-slate-850/40">
                      {evt}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-mono text-slate-450 uppercase mb-2.5">Regulatory Filings & Audits</h5>
                <ul className="space-y-1.5">
                  {news.regulatoryUpdates.map((reg, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed list-disc list-inside bg-slate-950/20 p-2 rounded border border-slate-850/40">
                      {reg}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* INDUSTRY TAB */}
        {activeTab === 'industry' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h4 className="font-bold text-sm text-white font-outfit">Market Standings & Competitive Moats</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">COMPETITIVE SEGMENTS AND PROFILING</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => triggerExplainability(
                    'Industry standing and moats evidence',
                    `Market Position is modeled as ${industry.marketPosition}. Advantages and growth rate sourced from verified industry research files.`,
                    'Industry Analyst',
                    industry.confidence || 85,
                    industry.supportingSources || []
                  )}
                  className="text-[10px] font-mono text-emerald-400 hover:text-emerald-350 transition flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 rounded border border-slate-850"
                >
                  <FileCheck size={12} />
                  <span>Verify Moats Evidence</span>
                </button>
                <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Market Position</span>
                  <span className="text-md font-bold text-blue-400 uppercase font-outfit">{industry.marketPosition}</span>
                </div>
              </div>
            </div>

            {/* Growth rate */}
            <div 
              className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60 mb-6 cursor-pointer hover:border-slate-700 transition group flex justify-between items-center"
              onClick={() => triggerExplainability(
                'Industry Growth Rate Calculation',
                industry.industryGrowthRate,
                'Industry Analyst',
                industry.confidence || 85,
                industry.supportingSources || []
              )}
            >
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase group-hover:text-emerald-400 transition">Projected Industry Growth Rate</span>
                <p className="text-sm font-semibold text-white mt-1">{industry.industryGrowthRate}</p>
              </div>
              <span className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">Trace Growth Source</span>
            </div>

            {/* Competitors Table */}
            <div className="mb-6">
              <h5 className="text-xs font-mono text-slate-450 uppercase mb-3">Key Strategic Competitors</h5>
              <div className="w-full overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase">
                      <th className="p-3.5 font-bold">Company</th>
                      <th className="p-3.5 font-bold">Market Cap</th>
                      <th className="p-3.5 font-bold text-center">P/E Ratio</th>
                      <th className="p-3.5 font-bold">Core Capability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                    {industry.competitors.map((peer, i) => (
                      <tr 
                        key={i} 
                        className="hover:bg-slate-950/30 transition cursor-pointer"
                        onClick={() => triggerExplainability(
                          `Peer Standings: ${peer.name}`,
                          `Competitor evaluated: ${peer.name} (${peer.marketCap}) has core capability: ${peer.strength}.`,
                          'Industry Analyst',
                          industry.confidence || 85,
                          industry.supportingSources || []
                        )}
                      >
                        <td className="p-3.5 font-bold text-white">{peer.name}</td>
                        <td className="p-3.5 text-slate-300 font-mono">{peer.marketCap}</td>
                        <td className="p-3.5 text-slate-355 text-center font-mono">{peer.peRatio || 'N/A'}</td>
                        <td className="p-3.5 text-slate-450 leading-normal">{peer.strength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Competitive Advantages */}
            <div>
              <h5 className="text-xs font-mono text-slate-450 uppercase mb-3">Core Structural Moats</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {industry.competitiveAdvantages.map((adv, i) => (
                  <div 
                    key={i} 
                    onClick={() => triggerExplainability(
                      `Competitive Moat #${i+1} Trace`,
                      adv,
                      'Industry Analyst',
                      industry.confidence || 85,
                      industry.supportingSources || []
                    )}
                    className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60 cursor-pointer hover:border-slate-700 transition group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block">MOAT #{i + 1}</span>
                      <span className="text-[8px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">Trace</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">{adv}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RISK PROFILE TAB */}
        {activeTab === 'risk' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h4 className="font-bold text-sm text-white font-outfit">Asset Risk Assessment</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">CHIEF RISK OFFICER AUDIT DISCLOSURE</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => triggerExplainability(
                    'Risk Factors & SEC disclosures',
                    `Risk score computed at ${risk.overallRiskScore}/100. Sources parsed from official filings.`,
                    'Risk Officer',
                    risk.confidence || 85,
                    risk.supportingSources || []
                  )}
                  className="text-[10px] font-mono text-emerald-400 hover:text-emerald-355 transition flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 rounded border border-slate-850"
                >
                  <FileCheck size={12} />
                  <span>Verify Risks Evidence</span>
                </button>
                <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Composite Risk Score</span>
                  <span className="text-lg font-bold text-rose-400 font-outfit">{risk.overallRiskScore}/100</span>
                </div>
              </div>
            </div>

            {/* Company Risks Table */}
            <div className="mb-6">
              <h5 className="text-xs font-mono text-slate-450 uppercase mb-3">Company Specific Risk Exposures</h5>
              <div className="w-full overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase">
                      <th className="p-3.5 font-bold">Identified Threat</th>
                      <th className="p-3.5 font-bold text-center">Severity</th>
                      <th className="p-3.5 font-bold">Active Mitigation Strategy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                    {risk.companyRisks.map((item, i) => {
                      const badge = 
                        item.severity === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                        item.severity === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        'text-blue-400 bg-blue-500/10 border-blue-500/20';

                      return (
                        <tr 
                          key={i} 
                          className="hover:bg-slate-950/30 transition cursor-pointer"
                          onClick={() => triggerExplainability(
                            `Specific Corporate Threat: ${item.risk}`,
                            `Risk identified: ${item.risk}. Severity: ${item.severity}. Mitigation: ${item.mitigation}`,
                            'Risk Officer',
                            risk.confidence || 85,
                            risk.supportingSources || []
                          )}
                        >
                          <td className="p-3.5 font-bold text-white max-w-xs">{item.risk}</td>
                          <td className="p-3.5 text-center">
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badge}`}>
                              {item.severity}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-350 leading-relaxed max-w-sm">{item.mitigation}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Macro & Reg */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                <h5 className="text-xs font-mono text-slate-450 uppercase mb-3">Macroeconomic Pressures</h5>
                <ul className="space-y-2">
                  {risk.macroeconomicRisks.map((mac, i) => (
                    <li 
                      key={i} 
                      onClick={() => triggerExplainability(
                        `Macro Threat: ${mac.risk}`,
                        `Severity score is ${mac.severity} for global macro impact: ${mac.risk}.`,
                        'Risk Officer',
                        risk.confidence || 85,
                        risk.supportingSources || []
                      )}
                      className="flex justify-between items-center text-xs border-b border-slate-850 pb-2 last:border-0 last:pb-0 hover:border-slate-700 cursor-pointer transition group"
                    >
                      <span className="text-slate-350 font-semibold group-hover:text-emerald-400 transition">{mac.risk}</span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                        mac.severity === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {mac.severity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                <h5 className="text-xs font-mono text-slate-450 uppercase mb-3">Regulatory & Geopolitical Risks</h5>
                <ul className="space-y-2">
                  {risk.regulatoryRisks.map((reg, i) => (
                    <li 
                      key={i} 
                      onClick={() => triggerExplainability(
                        `Regulatory Pressure: ${reg.risk}`,
                        `Severity score is ${reg.severity} for regulatory threat: ${reg.risk}.`,
                        'Risk Officer',
                        risk.confidence || 85,
                        risk.supportingSources || []
                      )}
                      className="flex justify-between items-center text-xs border-b border-slate-850 pb-2 last:border-0 last:pb-0 hover:border-slate-700 cursor-pointer transition group"
                    >
                      <span className="text-slate-355 font-semibold group-hover:text-emerald-400 transition">{reg.risk}</span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                        reg.severity === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {reg.severity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* REFERENCES TAB */}
        {activeTab === 'references' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h4 className="font-bold text-sm text-white font-outfit">Verified Evidence Database</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">COMPREHENSIVE PRIMARY SOURCE CITATIONS INDEX</p>
              </div>
              <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
                <span>Unique Citations Indexed: </span>
                <span className="font-bold text-emerald-400">{deduplicatedSources.length}</span>
              </div>
            </div>

            {deduplicatedSources.length === 0 ? (
              <div className="py-16 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-800/80">
                <BookOpen className="text-slate-650 mx-auto mb-3" size={32} />
                <p className="text-slate-400 text-sm font-medium">
                  No reliable supporting evidence was found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Official Sources */}
                <div className="space-y-3">
                  <h5 className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider pb-1.5 border-b border-slate-850 flex justify-between">
                    <span>🏛️ Official Filings & Corporate</span>
                    <span className="text-slate-500">({groupedSources.Official.length})</span>
                  </h5>
                  {groupedSources.Official.length === 0 ? (
                    <p className="text-[10px] font-mono text-slate-500 italic">No official sources cited.</p>
                  ) : (
                    groupedSources.Official.map((s, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/45 rounded-lg border border-slate-850/60 text-xs hover:border-slate-800 transition">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mb-1">
                          <span>{s.publisher} • {s.publishedDate}</span>
                          <span className="text-emerald-400 bg-emerald-500/5 px-1 rounded">{s.relevanceScore}% rel</span>
                        </div>
                        <h6 className="font-semibold text-slate-200 leading-snug">{s.title}</h6>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 mt-1.5">
                          <span>Open Original Filing</span>
                          <ArrowUpRight size={10} />
                        </a>
                      </div>
                    ))
                  )}
                </div>

                {/* Financial Sources */}
                <div className="space-y-3">
                  <h5 className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider pb-1.5 border-b border-slate-850 flex justify-between">
                    <span>📈 Financial Data Engines</span>
                    <span className="text-slate-500">({groupedSources.Financial.length})</span>
                  </h5>
                  {groupedSources.Financial.length === 0 ? (
                    <p className="text-[10px] font-mono text-slate-500 italic">No financial feeds cited.</p>
                  ) : (
                    groupedSources.Financial.map((s, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/45 rounded-lg border border-slate-850/60 text-xs hover:border-slate-800 transition">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mb-1">
                          <span>{s.publisher} • {s.publishedDate}</span>
                          <span className="text-blue-400 bg-blue-500/5 px-1 rounded">{s.relevanceScore}% rel</span>
                        </div>
                        <h6 className="font-semibold text-slate-200 leading-snug">{s.title}</h6>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 mt-1.5">
                          <span>Open Financial Stream</span>
                          <ArrowUpRight size={10} />
                        </a>
                      </div>
                    ))
                  )}
                </div>

                {/* News Sources */}
                <div className="space-y-3">
                  <h5 className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider pb-1.5 border-b border-slate-850 flex justify-between">
                    <span>📰 Corporate News & Feeds</span>
                    <span className="text-slate-500">({groupedSources.News.length})</span>
                  </h5>
                  {groupedSources.News.length === 0 ? (
                    <p className="text-[10px] font-mono text-slate-500 italic">No news feeds cited.</p>
                  ) : (
                    groupedSources.News.map((s, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/45 rounded-lg border border-slate-850/60 text-xs hover:border-slate-800 transition">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mb-1">
                          <span>{s.publisher} • {s.publishedDate}</span>
                          <span className="text-amber-400 bg-amber-500/5 px-1 rounded">{s.relevanceScore}% rel</span>
                        </div>
                        <h6 className="font-semibold text-slate-200 leading-snug">{s.title}</h6>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 mt-1.5">
                          <span>Open News Article</span>
                          <ArrowUpRight size={10} />
                        </a>
                      </div>
                    ))
                  )}
                </div>

                {/* Research Sources */}
                <div className="space-y-3">
                  <h5 className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider pb-1.5 border-b border-slate-850 flex justify-between">
                    <span>🔬 Equity Research & Analytics</span>
                    <span className="text-slate-500">({groupedSources.Research.length})</span>
                  </h5>
                  {groupedSources.Research.length === 0 ? (
                    <p className="text-[10px] font-mono text-slate-500 italic">No research papers cited.</p>
                  ) : (
                    groupedSources.Research.map((s, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/45 rounded-lg border border-slate-850/60 text-xs hover:border-slate-800 transition">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mb-1">
                          <span>{s.publisher} • {s.publishedDate}</span>
                          <span className="text-indigo-400 bg-indigo-500/5 px-1 rounded">{s.relevanceScore}% rel</span>
                        </div>
                        <h6 className="font-semibold text-slate-200 leading-snug">{s.title}</h6>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5 mt-1.5">
                          <span>Open Research Document</span>
                          <ArrowUpRight size={10} />
                        </a>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      </div>

      {/* Reusable Explainability Modal Injection */}
      <ExplainabilityModal
        isOpen={selectedClaim !== null}
        onClose={() => setSelectedClaim(null)}
        title={selectedClaim?.title || ''}
        claim={selectedClaim?.claim || ''}
        persona={selectedClaim?.persona || 'Financial Analyst'}
        confidence={selectedClaim?.confidence || 85}
        sources={selectedClaim?.sources || []}
      />
    </div>
  );
}
export default MetricsTabs;
