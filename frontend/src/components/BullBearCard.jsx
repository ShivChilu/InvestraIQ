import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function BullBearCard({ bullCase, bearCase }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Bull Case Card */}
      <div id="tour-bull-case" className="glass-panel p-6 border-l-4 border-l-emerald-500/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 p-6 opacity-[0.03] pointer-events-none">
          <TrendingUp size={120} className="text-emerald-500" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="font-bold text-md text-white font-outfit">The Bull Case Thesis</h3>
            <span className="text-[10px] text-slate-500 font-mono">POSITIVE DRIVERS & UPWARD CATALYSTS</span>
          </div>
        </div>

        <ul className="space-y-3">
          {bullCase.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-355 leading-relaxed">
              <ArrowUpRight size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bear Case Card */}
      <div id="tour-bear-case" className="glass-panel p-6 border-l-4 border-l-rose-500/80 relative overflow-hidden font-sans">
        <div className="absolute right-0 top-0 p-6 opacity-[0.03] pointer-events-none">
          <TrendingDown size={120} className="text-rose-500" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="bg-rose-500/10 p-2 rounded-lg text-rose-400">
            <TrendingDown size={18} />
          </div>
          <div>
            <h3 className="font-bold text-md text-white font-outfit">The Bear Case Thesis</h3>
            <span className="text-[10px] text-slate-500 font-mono">PRIMARY RISKS & DOWNWARD CATALYSTS</span>
          </div>
        </div>

        <ul className="space-y-3">
          {bearCase.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-355 leading-relaxed">
              <ArrowDownRight size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
export default BullBearCard;
