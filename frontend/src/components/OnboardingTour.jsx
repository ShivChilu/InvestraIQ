import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';

const SEARCH_STEPS = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: '👋 Welcome to InvestraIQ',
    content: 'Let\'s take a quick tour to help you get familiar with this multi-agent AI investment research terminal.',
  },
  {
    target: '#tour-search-bar',
    placement: 'bottom',
    disableBeacon: true,
    title: '🔍 Search & Analyze',
    content: 'Enter a company name or ticker symbol here to deploy specialized AI agents analyzing financials, sentiment, competitive moats, and risk profile.',
  },
];

const DASHBOARD_STEPS = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: '📈 Analysis Dashboard Tour',
    content: 'The AI multi-agent research is complete! Let\'s walk through the generated scorecard, vote tallies, financial profiles, and agent reasoning logs.',
  },
  {
    target: '#tour-asset-summary',
    disableBeacon: true,
    title: '📊 Asset Analysis Summary',
    content: 'View the final consolidated verdict (Invest / Hold / Pass) and key metadata for the analyzed security.',
  },
  {
    target: '#tour-investment-score',
    disableBeacon: true,
    title: '🎯 Quantified Investment Score',
    content: 'View the quantified model score (0-100) alongside the research confidence indicator.',
  },
  {
    target: '#tour-committee-ballot',
    disableBeacon: true,
    title: '🗳️ Committee Ballot',
    content: 'Check the simulated votes tallied across the 7-member specialized AI investment committee.',
  },
  {
    target: '#tour-committee-breakdown',
    disableBeacon: true,
    title: '👥 Decision Breakdown',
    content: 'Inspect each individual analyst agent\'s vote, confidence rating, and short reasoning brief.',
  },
  {
    target: '#tour-company-profile',
    disableBeacon: true,
    title: '🏢 Verified Profile',
    content: 'Examine audited profile details including sector, exchange, headquarters, and description.',
  },
  {
    target: '#tour-executive-summary',
    disableBeacon: true,
    title: '📝 Executive Summary & Discussion Log',
    content: 'Read the comprehensive narrative summary and the detailed reasoning trace log from the committee debate.',
  },
  {
    target: '#tour-bull-case',
    disableBeacon: true,
    title: '🐂 Bull Case catalysts',
    content: 'Understand key upward catalysts and positive drivers supporting the investment thesis.',
  },
  {
    target: '#tour-bear-case',
    disableBeacon: true,
    title: '🐻 Bear Case risks',
    content: 'Inspect risk factors and negative drivers identified during the agent analysis.',
  },
  {
    target: '#tour-metrics-tabs',
    disableBeacon: true,
    title: '📈 Detailed Metrics tabs',
    content: 'Switch between detailed metrics tabs: Financial Health, News Sentiment, competitive moats, and risk profile.',
  },
];

export function OnboardingTour({ run, setRun, isDashboard }) {
  const [steps, setSteps]     = useState([]);
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    if (!run) {
      setSteps([]);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20; // 2 seconds total

    const pollTargets = () => {
      if (isDashboard) {
        const coreEl = document.querySelector('#tour-asset-summary');
        if (!coreEl && attempts < maxAttempts) {
          attempts++;
          setTimeout(pollTargets, 100);
          return;
        }
      } else {
        const coreEl = document.querySelector('#tour-search-bar');
        if (!coreEl && attempts < maxAttempts) {
          attempts++;
          setTimeout(pollTargets, 100);
          return;
        }
      }

      const chosen = isDashboard ? DASHBOARD_STEPS : SEARCH_STEPS;

      // Check which targets are present in the DOM
      const available = chosen.filter(step => {
        if (step.target === 'body') return true;
        return !!document.querySelector(step.target);
      });

      console.log(`[Tour] Mode: ${isDashboard ? 'dashboard' : 'search'}. Available targets: ${available.length}`);

      if (available.length === 0) {
        console.warn('[Tour] No target elements found in DOM. Aborting.');
        setRun(false);
        return;
      }

      setSteps(available);
      setTourKey(k => k + 1); // Force new instance lifecycle
    };

    pollTargets();
  }, [run, isDashboard, setRun]);

  const handleCallback = (data) => {
    const { status, type } = data;
    console.log('[Tour] Callback type:', type, 'status:', status);

    const isFinished = status === STATUS.FINISHED;
    const isSkipped  = status === STATUS.SKIPPED || type === 'tour:end';

    if (isFinished || isSkipped) {
      const prefix = isDashboard ? 'onboarding_dashboard' : 'onboarding_home';

      // Always mark the tour as completed so it never auto-starts again
      console.log(`[Tour] Tour concluded. Setting ${prefix}_completed = true`);
      localStorage.setItem(`${prefix}_completed`, 'true');
      setRun(false);
    }
  };

  if (!run || steps.length === 0) {
    return null;
  }

  // Premium Custom Tooltip Component to guarantee button controls layout without overlaps
  const TourTooltip = ({
    index,
    step,
    backProps,
    primaryProps,
    skipProps,
    tooltipProps,
    isLastStep
  }) => {
    return (
      <div {...tooltipProps} className="tour-tooltip-container bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-6 max-w-sm shadow-2xl relative select-none">
        {step.title && (
          <h3 className="font-extrabold text-white text-base mb-2 font-outfit flex items-center gap-2">
            {step.title}
          </h3>
        )}
        <div className="text-slate-350 text-sm leading-relaxed mb-6 font-sans">
          {step.content}
        </div>
        
        <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 pt-4 mt-2">
          {/* End Tour (Skip) Button - always visible */}
          <button
            {...skipProps}
            type="button"
            onClick={(e) => {
              console.log('[Tour] End Tour clicked manually');
              const prefix = isDashboard ? 'onboarding_dashboard' : 'onboarding_home';
              localStorage.setItem(`${prefix}_completed`, 'true');
              if (skipProps.onClick) skipProps.onClick(e);
            }}
            className="px-3 py-1.5 rounded-lg border border-red-500/10 hover:border-red-500/35 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-mono font-semibold transition cursor-pointer"
          >
            End Tour
          </button>

          <div className="flex items-center gap-2">
            {/* Previous (Back) Button - hide on step 0 */}
            {index > 0 && (
              <button
                {...backProps}
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-700/60 hover:border-slate-650 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-300 text-xs font-mono font-semibold transition cursor-pointer"
              >
                ← Previous
              </button>
            )}

            {/* Next / Finish Button */}
            <button
              {...primaryProps}
              type="button"
              onClick={(e) => {
                if (isLastStep) {
                  console.log('[Tour] Finish clicked manually');
                  const prefix = isDashboard ? 'onboarding_dashboard' : 'onboarding_home';
                  localStorage.setItem(`${prefix}_completed`, 'true');
                }
                if (primaryProps.onClick) primaryProps.onClick(e);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-mono font-bold transition shadow-lg shadow-blue-500/15 cursor-pointer"
            >
              {isLastStep ? '✓ Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Joyride
      key={tourKey}
      steps={steps}
      run={true}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={false}
      showSkipButton={true}
      callback={handleCallback}
      tooltipComponent={TourTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.75)', // overlay mask
        }
      }}
    />
  );
}

export default OnboardingTour;
