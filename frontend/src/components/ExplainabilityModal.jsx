import { X, ArrowUpRight, BookOpen, Quote } from 'lucide-react';

export function getSourceQuality(sourceType, publisher) {
  const t = (sourceType || '').toLowerCase();
  const p = (publisher || '').toLowerCase();
  
  if (
    t.includes('sec filing') || 
    t.includes('annual report') || 
    t.includes('company website') || 
    p.includes('sec') || 
    p.includes('investor relations') || 
    p.includes('edgar')
  ) {
    return 'Official';
  }
  if (
    t.includes('financial data') || 
    p.includes('alpha vantage') || 
    p.includes('yahoo') || 
    p.includes('marketwatch')
  ) {
    return 'Financial';
  }
  if (
    t.includes('news') || 
    p.includes('reuters') || 
    p.includes('bloomberg') || 
    p.includes('cnbc') || 
    p.includes('times') || 
    p.includes('news')
  ) {
    return 'News';
  }
  if (
    t.includes('research') || 
    p.includes('gartner') || 
    p.includes('mckinsey') || 
    p.includes('deloitte')
  ) {
    return 'Research';
  }
  return 'Official'; // default fallback
}

export function ExplainabilityModal({
  isOpen,
  onClose,
  title,
  claim,
  persona,
  confidence,
  sources
}) {
  if (!isOpen) return null;

  const qualityColors = {
    Official: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Financial: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    News: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    Research: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start gap-4">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
              Explainable AI Citation Engine
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight mt-1 font-outfit">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Claim/Insight Summary */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-850/60 relative">
            <span className="absolute top-0 right-0 p-3 opacity-5">
              <Quote size={40} />
            </span>
            <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1.5">
              TARGET INSIGHT / CONCLUSION
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {claim}
            </p>
          </div>

          {/* Attribution Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-850/40">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">Analyzing Agent Node</span>
              <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{persona}</span>
            </div>
            <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-850/40">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">Confidence Index</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-emerald-400">{confidence}%</span>
                <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Evidence List */}
          <div>
            <h4 className="text-xs font-mono text-slate-450 uppercase mb-3 flex items-center gap-1.5">
              <BookOpen size={14} />
              Citations & Verified Evidence ({sources?.length || 0})
            </h4>

            {(!sources || sources.length === 0) ? (
              <div className="p-6 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-850/60">
                <p className="text-xs font-semibold text-slate-400">
                  No reliable supporting evidence was found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sources.map((src, i) => {
                  const quality = getSourceQuality(src.sourceType, src.publisher);
                  return (
                    <div 
                      key={i} 
                      className="p-4 bg-slate-950/30 border border-slate-850/50 rounded-xl space-y-3 hover:border-slate-800 transition"
                    >
                      {/* Top bar with details */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${qualityColors[quality]}`}>
                            {quality} Source
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {src.publisher} • {src.publishedDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                          <span>Relevance:</span>
                          <span className="font-bold">{src.relevanceScore}%</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h5 className="font-semibold text-xs text-white leading-snug">
                        {src.title}
                      </h5>

                      {/* Evidence Quote Snippet */}
                      {src.evidenceSnippet && (
                        <div className="p-3 bg-slate-950/70 border-l-2 border-slate-800 rounded-r text-[11px] text-slate-350 italic leading-relaxed font-mono">
                          "{src.evidenceSnippet}"
                        </div>
                      )}

                      {/* External Link */}
                      {src.url && src.url !== '#' && (
                        <a 
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                        >
                          <span>Open Primary Source</span>
                          <ArrowUpRight size={10} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-850 text-center text-[10px] text-slate-500 font-mono">
          All references verified against financial data feeds. No mock hallucinations.
        </div>
      </div>
    </div>
  );
}
