import { useEffect, useState } from 'react';
import { Terminal, Sparkles } from 'lucide-react';

export function Header({ onStartTour }) {
  const [time, setTime] = useState(new Date().toString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="no-print w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
          <Terminal size={22} className="animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight text-white font-outfit">
            ALTUNI<span className="text-emerald-400">.AI</span> LABS
          </span>
          <span className="text-xs ml-2 text-slate-400 border border-slate-700/60 rounded px-1.5 py-0.5 bg-slate-900/60">
            PRO TERMINAL v2.6
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            console.log('[Tour] Manual Start Tour clicked in Header');
            if (onStartTour) onStartTour();
          }}
          className="px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 bg-slate-900/60 hover:bg-slate-905 text-emerald-400 hover:text-emerald-350 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/5 cursor-pointer animate-fade-in"
        >
          <Sparkles size={12} className="text-emerald-400 animate-pulse" />
          <span>Start Tour</span>
        </button>

        <div className="text-slate-400 text-xs font-mono select-none hidden sm:block">
          {time}
        </div>
      </div>
    </header>
  );
}
export default Header;
