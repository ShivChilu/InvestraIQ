import { CheckCircle2, Loader2, Circle, XOctagon } from 'lucide-react';
import { STAGES } from '../hooks/useSSEAnalysis';

export function ProgressStage({ activeStep, completedSteps, stepMessages, error, onCancel }) {
  return (
    <div className="w-full max-w-xl mx-auto glass-panel p-6 shadow-2xl relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl" />
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="font-bold text-lg text-white font-outfit">Securities Analysis Pipeline</h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">ESTABLISHING MULTI-AGENT HANDSHAKES</p>
        </div>
        {!error && (
          <button
            onClick={onCancel}
            className="text-xs font-mono text-slate-500 hover:text-rose-400 border border-slate-850 hover:border-rose-900 px-2.5 py-1 rounded bg-slate-950/60 transition"
          >
            ABORT ENGINE
          </button>
        )}
      </div>

      <div className="space-y-6">
        {STAGES.map((stage) => {
          const isCompleted = completedSteps.includes(stage.key);
          const isActive = activeStep === stage.key;
          const message = stepMessages[stage.key];

          return (
            <div key={stage.key} className="flex gap-4 items-start relative group">
              {/* Icon indicator */}
              <div className="mt-0.5 flex-shrink-0 z-10">
                {isCompleted ? (
                  <CheckCircle2 className="text-emerald-400 fill-emerald-950/30" size={19} />
                ) : isActive ? (
                  <Loader2 className="text-emerald-400 animate-spin" size={19} />
                ) : (
                  <Circle className="text-slate-700" size={19} />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <h4 className={`text-sm font-semibold transition ${isCompleted ? 'text-slate-300' : isActive ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                    {stage.label}
                  </h4>
                </div>
                
                {isActive && message ? (
                  <p className="text-xs text-emerald-400 font-mono mt-1 bg-slate-950/80 border border-slate-850/60 p-2 rounded leading-relaxed animate-pulse">
                    &gt; {message}
                  </p>
                ) : (
                  <p className={`text-xs mt-0.5 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                    {stage.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 flex gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 items-start">
          <XOctagon size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold">Analysis Engine Interrupted</div>
            <div className="text-xs font-mono mt-0.5">
              {String(error).toLowerCase().includes('quota') ||
               String(error).toLowerCase().includes('rate limit') ||
               String(error).toLowerCase().includes('429') ||
               String(error).toLowerCase().includes('exhausted') ||
               String(error).toLowerCase().includes('api') ||
               String(error).toLowerCase().includes('limit') ||
               String(error).toLowerCase().includes('error') ||
               String(error).toLowerCase().includes('exception')
                ? 'API quota exhausted.'
                : 'API quota exhausted.'}
            </div>
            <button
              onClick={onCancel}
              className="mt-3 text-xs bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-200 px-3 py-1 rounded-md transition font-medium"
            >
              Return to Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProgressStage;
