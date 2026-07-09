import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Download, Printer, Check, Info, Calendar, History, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { SearchSection } from './components/SearchSection';
import { ProgressStage } from './components/ProgressStage';
import { ScoreWidget } from './components/ScoreWidget';
import { BullBearCard } from './components/BullBearCard';
import { PerformanceCharts } from './components/Charts/PerformanceCharts';
import { MetricsTabs } from './components/MetricsTabs';
import { VerifiedProfileCard } from './components/VerifiedProfileCard';
import { OnboardingTour } from './components/OnboardingTour';
import { useSSEAnalysis } from './hooks/useSSEAnalysis';
import type { FullAnalysisReport } from './types';



export function App() {
  const {
    loading,
    activeStep,
    completedSteps,
    stepMessages,
    report,
    error,
    triggerAnalysis,
    cancelAnalysis
  } = useSSEAnalysis();

  const [copied, setCopied] = useState(false);
  const [tourRun, setTourRun] = useState(false);

  console.log('[App] App.tsx (TypeScript) is rendering!');

  // Monitor for manual start onboarding tour event
  useEffect(() => {
    const handleStartTour = () => {
      console.log('[Tour] Received start-onboarding-tour custom event. Setting tourRun = true');
      setTourRun(true);
    };
    window.addEventListener('start-onboarding-tour', handleStartTour);
    return () => window.removeEventListener('start-onboarding-tour', handleStartTour);
  }, []);

  // Monitor for first successful company analysis
  useEffect(() => {
    if (report && localStorage.getItem('onboarding_tour_completed') !== 'true') {
      // Delay slightly for render transitions
      const t = setTimeout(() => {
        setTourRun(true);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [report]);

  const handleSearch = (company: string, ticker: string) => {
    triggerAnalysis(company, ticker);
  };

  const getMarkdown = (rep: FullAnalysisReport) => {
    return `# Investment Committee Report: ${rep.committee.companyName} (${rep.committee.ticker.toUpperCase()})
Date: ${new Date(rep.timestamp).toLocaleDateString()}
Website: ${rep.committee.websiteUrl || 'N/A'}
Recommendation: **${rep.committee.recommendation.toUpperCase()}**
Investment Score: ${rep.committee.overallInvestmentScore}/100
Confidence Score: ${rep.committee.confidenceScore}%


## Executive Summary
${rep.committee.executiveSummary}

## Detailed Reasoning
${rep.committee.detailedReasoning}

## Bull Case Thesis
${rep.committee.bullCase.map(item => `- ${item}`).join('\n')}

## Bear Case Thesis
${rep.committee.bearCase.map(item => `- ${item}`).join('\n')}

## Committee Vote Tally
- Invest: ${rep.committee.committeeVotes.invest}
- Hold: ${rep.committee.committeeVotes.hold}
- Pass: ${rep.committee.committeeVotes.pass}

## Financial Metrics
- P/E Ratio: ${rep.financials.peRatio}
- Debt to Equity: ${rep.financials.debtToEquity}
- Profit Margin: ${(rep.financials.profitMargin * 100).toFixed(1)}%
- Health Score: ${rep.financials.healthScore}/100
`;
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(getMarkdown(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([getMarkdown(report)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Investment_Report_${report.committee.ticker || 'Asset'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <OnboardingTour run={tourRun} setRun={setTourRun} />
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* State 1: Search Landing Console */}
        {!loading && !report && (
          <SearchSection onSearch={handleSearch} loading={loading} />
        )}

        {/* State 2: Progress Streaming Checklists */}
        {loading && !report && (
          <div className="py-12">
            <ProgressStage
              activeStep={activeStep}
              completedSteps={completedSteps}
              stepMessages={stepMessages}
              error={error}
              onCancel={cancelAnalysis}
            />
          </div>
        )}

        {/* State 3: Final Securities Dashboard */}
        {report && (
          <div className="animate-fade-in print-page">
            {/* Toolbar - hidden on printing */}
            <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 mb-6 gap-4">
              <button
                onClick={cancelAnalysis}
                className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40"
              >
                <ArrowLeft size={13} />
                <span>Return to Search Console</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-350 hover:text-white px-3.5 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 transition"
                  title="Copy Markdown Report"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-350 hover:text-white px-3.5 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 transition"
                  title="Download Markdown File"
                >
                  <Download size={14} />
                  <span>Markdown</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-350 hover:text-white px-3.5 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 transition"
                  title="Save Report as PDF"
                >
                  <Printer size={14} />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

             {/* Scorecard Widget Block */}
            <ScoreWidget committee={report.committee} timestamp={report.timestamp} />

            {/* Verified Company Profile Card */}
            {report.verifiedProfile && (
              <VerifiedProfileCard profile={report.verifiedProfile} />
            )}

            {/* Financial Narrative Executive Summary Card */}
            <div id="tour-executive-summary" className="glass-panel p-6 mb-8 relative overflow-hidden">

              <div className="absolute right-0 top-0 p-6 opacity-[0.02] pointer-events-none">
                <Sparkles size={140} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-450 border border-emerald-500/10">
                  <Info size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-outfit">Investment Executive Summary</h3>
                  <span className="text-[10px] text-slate-500 font-mono">CONSOLIDATED PORTFOLIO ADVISORY BRIEF</span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                {report.committee.executiveSummary}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                <span className="text-emerald-400 font-mono font-bold block mb-1">Detailed Discussion Log:</span>
                {report.committee.detailedReasoning}
              </div>
            </div>

            {/* Side-by-side Bull vs Bear Case Catalysts */}
            <BullBearCard bullCase={report.committee.bullCase} bearCase={report.committee.bearCase} />

            {/* Recharts Performance Trends (Revenue & EPS) */}
            <PerformanceCharts
              revenueTrend={report.financials.revenueTrend}
              epsTrend={report.financials.epsTrend}
              confidence={report.financials.confidence}
              supportingSources={report.financials.supportingSources}
            />


            {/* Metric Detailed Analysts Tabs */}
            <MetricsTabs
              financials={report.financials}
              news={report.news}
              industry={report.industry}
              risk={report.risk}
            />

            {/* Investment Timeline and Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 print-page-break">
              {/* Timeline */}
              <div className="glass-panel p-6">
                <h4 className="font-bold text-sm text-white font-outfit mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-400" />
                  Securities Catalytic Timeline
                </h4>
                <div className="relative border-l border-slate-850 pl-5 space-y-5">
                  {report.committee.timeline.map((item, i) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border border-emerald-500/80" />
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block">{item.date}</span>
                      <p className="text-xs text-slate-300 font-semibold mt-0.5 leading-snug">{item.event}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="glass-panel p-6 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white font-outfit mb-4 flex items-center gap-2">
                    <History size={16} className="text-indigo-400" />
                    Citational Sources Feed
                  </h4>
                  <p className="text-xs text-slate-400 leading-normal mb-4">
                    The following indexes, registries, and search providers were fetched and analyzed to construct this securities profile:
                  </p>
                  <ul className="space-y-2.5">
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Alpha Vantage Global Overview Registry (Balance sheets, earnings, metrics)</span>
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Tavily Real-Time Business Search Index (Press, articles, catalysts)</span>
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>SEC Edgar Filings Database (Simulated regulatory compliance audits)</span>
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>Google Gemini LLM Reasoning Engine (Structured agent handshakes)</span>
                    </li>
                  </ul>
                </div>
                <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-4 mt-4">
                  COMPLIANCE DISCLAIMER: This dashboard provides simulated financial analytics for product research demonstration and is not certified investment advice.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="no-print w-full py-6 text-center border-t border-slate-900/60 mt-12 bg-slate-950/40 text-xs text-slate-500 font-mono select-none">
        InsideIIM × Altuni AI Labs Internship Assignment. Built with LangChain.js & Gemini.
      </footer>
    </div>
  );
}
export default App;
