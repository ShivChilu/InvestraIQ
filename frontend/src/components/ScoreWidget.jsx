import { useState } from 'react';
import { 
  Award, Compass, ThumbsUp, Globe, ShieldCheck, 
  TrendingUp, ShieldAlert, Layers, Newspaper, Scale, 
  Zap, Target, ChevronDown, ChevronUp, UserCheck 
} from 'lucide-react';
import { ExplainabilityModal } from './ExplainabilityModal';

const roleIcons = {
  "Financial Analyst": TrendingUp,
  "Risk Officer": ShieldAlert,
  "Industry Analyst": Layers,
  "News Analyst": Newspaper,
  "Valuation Analyst": Scale,
  "Growth Analyst": Zap,
  "Portfolio Manager": Target
};

function CommitteeMemberCard({ member }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = roleIcons[member.role] || UserCheck;

  const voteLower = (member.vote || '').toLowerCase();
  const voteColor = 
    voteLower === 'invest' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
    voteLower === 'hold' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
    'bg-rose-500/10 text-rose-400 border-rose-500/20';

  const dotColor = 
    voteLower === 'invest' ? 'bg-emerald-400' :
    voteLower === 'hold' ? 'bg-amber-400' :
    'bg-rose-400';

  return (
    <div className="glass-panel p-5 hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400 transition-colors">
              <IconComponent size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight font-outfit">{member.role}</h4>
              <span className="text-[10px] text-slate-500 font-mono">AGENT ANALYST</span>
            </div>
          </div>

          <div className={`px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold flex items-center gap-1.5 ${voteColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
            {member.vote}
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
            <span className="text-slate-500">CONFIDENCE:</span>
            <span className="text-slate-300 font-bold">{member.confidence}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${member.confidence}%` }}></div>
          </div>
        </div>

        {/* Reasoning */}
        <p className={`text-xs text-slate-400 leading-relaxed font-mono transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {member.reason}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-850 flex justify-end">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-350 flex items-center gap-1 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Detailed Analysis'}
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
    </div>
  );
}

export function ScoreWidget({ committee, timestamp }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    companyName,
    ticker,
    websiteUrl,
    overallInvestmentScore,
    confidenceScore,
    recommendation,
    committeeVotes,
    committeeMembers,
    supportingSources
  } = committee;

  const members = committeeMembers || [];

  const recColor = 
    recommendation === 'Invest' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 glow-emerald' :
    recommendation === 'Hold' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5 glow-amber' :
    'text-rose-400 border-rose-500/30 bg-rose-500/5 glow-rose';

  // Calculate dynamic counts and percentages
  const totalVotes = committeeVotes.invest + committeeVotes.hold + committeeVotes.pass;
  const investPct = totalVotes > 0 ? (committeeVotes.invest / totalVotes) * 100 : 0;
  const holdPct = totalVotes > 0 ? (committeeVotes.hold / totalVotes) * 100 : 0;
  const passPct = totalVotes > 0 ? (committeeVotes.pass / totalVotes) * 100 : 0;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Target Asset header and Recommendation */}
        <div id="tour-asset-summary" className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Award size={100} />
          </div>
          <div>
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              Asset Analysis Summary
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1 font-outfit">
              {companyName}
            </h2>
            <div className="font-mono text-xs text-slate-400 mt-1 flex flex-col gap-1.5">
              <div className="flex gap-4">
                <span>Ticker: <b className="text-slate-200">{ticker.toUpperCase()}</b></span>
                <span>Analyzed: <b className="text-slate-200">{new Date(timestamp).toLocaleDateString()}</b></span>
              </div>
              {websiteUrl && (
                <a 
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-350 transition flex items-center gap-1 mt-0.5"
                >
                  <Globe size={12} className="flex-shrink-0" />
                  <span className="underline truncate max-w-[250px]">{websiteUrl}</span>
                </a>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">
              Committee Action Verdict
            </div>
            <div className={`inline-flex items-center gap-3 px-6 py-2.5 border rounded-xl ${recColor} w-full justify-center transition`}>
              <Compass className="animate-spin-slow" size={20} />
              <span className="text-xl font-black uppercase tracking-widest font-outfit">
                {recommendation}
              </span>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 rounded-xl text-center text-xs font-mono text-emerald-400 hover:text-emerald-350 transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={13} />
              <span>Trace Verdict Evidence</span>
            </button>
          </div>
        </div>

        {/* Dials for Investment Score & Confidence */}
        <div id="tour-investment-score" className="glass-panel p-6 grid grid-cols-2 gap-4">

          {/* Investment Score */}
          <div className="flex flex-col items-center justify-center border-r border-slate-800/80">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-emerald-500"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * overallInvestmentScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white font-outfit">{overallInvestmentScore}</span>
                <span className="text-[9px] text-slate-500 font-mono">SCORE</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-3 font-mono">Investment Score</span>
          </div>

          {/* Confidence score */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-blue-500"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * confidenceScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white font-outfit">{confidenceScore}%</span>
                <span className="text-[9px] text-slate-500 font-mono">CONFIDENCE</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-3 font-mono">Analysis Confidence</span>
          </div>
        </div>

        {/* Committee Votes breakdown */}
        <div id="tour-committee-ballot" className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ThumbsUp size={13} className="text-emerald-400" />
                Committee Ballot (7 Members)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal mb-4">
              Simulated vote tally representing distinct expert agents debating raw asset data.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Invest votes */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">Invest</span>
                <span className="text-emerald-400 font-bold">{committeeVotes.invest} ({Math.round(investPct)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded" style={{ width: `${investPct}%` }} />
              </div>
            </div>

            {/* Hold votes */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">Hold</span>
                <span className="text-amber-400 font-bold">{committeeVotes.hold} ({Math.round(holdPct)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded overflow-hidden border border-slate-800">
                <div className="bg-amber-500 h-full rounded" style={{ width: `${holdPct}%` }} />
              </div>
            </div>

            {/* Pass votes */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">Pass</span>
                <span className="text-rose-400 font-bold">{committeeVotes.pass} ({Math.round(passPct)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded overflow-hidden border border-slate-800">
                <div className="bg-rose-500 h-full rounded" style={{ width: `${passPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Committee Decision Breakdown Section */}
      {members.length > 0 && (
        <div id="tour-committee-breakdown" className="mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-2">
            <h3 className="text-lg font-bold text-white font-outfit tracking-wide flex items-center gap-2">
              <UserCheck size={18} className="text-emerald-400" />
              Committee Decision Breakdown
            </h3>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest">7 EXPERT PERSONAS DEBATING</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((member, idx) => (
              <CommitteeMemberCard key={member.id || idx} member={member} />
            ))}
          </div>
        </div>
      )}

      <ExplainabilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Investment Committee Recommendation Trace"
        claim={`The committee reached a "${recommendation}" decision with an overall investment score of ${overallInvestmentScore}/100 and a confidence level of ${confidenceScore}%.`}
        persona="Investment Committee"
        confidence={confidenceScore}
        sources={supportingSources || []}
      />
    </>
  );
}
export default ScoreWidget;


