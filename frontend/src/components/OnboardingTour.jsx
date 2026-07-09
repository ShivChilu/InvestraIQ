import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';

// ─── Step Definitions ────────────────────────────────────────────────────────

const SEARCH_STEPS = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: '👋 Welcome to ALTUNI.AI LABS',
    content: 'This guided tour will walk you through every feature of the AI Investment Research platform. Use the search bar below to start your first analysis.',
  },
  {
    target: '#tour-search-bar',
    placement: 'bottom',
    disableBeacon: true,
    title: '🔍 Search Bar',
    content: 'Type any company name or stock ticker. The AI runs 5 specialized agents — financial, news, industry, valuation, and risk — in parallel.',
  },
];

const DASHBOARD_STEPS = [
  {
    target: '#tour-asset-summary',
    disableBeacon: true,
    title: '📊 Asset Analysis Summary',
    content: 'The overall investment verdict (Invest / Hold / Pass) with key asset metadata from the full committee analysis.',
  },
  {
    target: '#tour-investment-score',
    disableBeacon: true,
    title: '🎯 Investment Score & Confidence',
    content: 'A quantified score from 0–100 reflecting overall investment attractiveness, plus the model\'s confidence in its own output.',
  },
  {
    target: '#tour-committee-ballot',
    disableBeacon: true,
    title: '🗳️ Committee Ballot',
    content: 'The aggregate vote tally from the 7-member AI committee: Invest, Hold, or Pass.',
  },
  {
    target: '#tour-committee-breakdown',
    disableBeacon: true,
    title: '👥 Committee Decision Breakdown',
    content: "Each specialist analyst's individual vote, confidence percentage, and one-line reasoning. Expand any card for the full argument.",
  },
  {
    target: '#tour-company-profile',
    disableBeacon: true,
    title: '🏢 Verified Company Profile',
    content: 'Verified company details: sector, headquarters, ownership structure, and official corporate description pulled from live sources.',
  },
  {
    target: '#tour-executive-summary',
    disableBeacon: true,
    title: '📝 Executive Summary',
    content: 'The consolidated investment narrative and detailed reasoning trace log from the full committee debate.',
  },
  {
    target: '#tour-bull-case',
    disableBeacon: true,
    title: '🐂 Bull Case Thesis',
    content: 'Primary upward catalysts and growth drivers identified by the AI agents supporting the investment thesis.',
  },
  {
    target: '#tour-bear-case',
    disableBeacon: true,
    title: '🐻 Bear Case Thesis',
    content: 'Primary risk factors and downward catalysts that could negatively impact the investment.',
  },
  {
    target: '#tour-metrics-tabs',
    disableBeacon: true,
    title: '📈 Detailed Analytical Indicators',
    content: 'Switch between Financial Health, News & Sentiment, Industry Moats, Risk Profile, and Source References tabs.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingTour({ run, setRun }) {
  const [steps, setSteps]     = useState([]);
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    if (!run) {
      setSteps([]);
      return;
    }

    // Detect which screen is active
    const hasDashboard = !!document.querySelector('#tour-asset-summary');
    const chosen = hasDashboard ? DASHBOARD_STEPS : SEARCH_STEPS;

    // Filter only to steps whose targets actually exist in the DOM
    // 'body' always exists, dashboard steps may not exist on search screen
    const available = chosen.filter(step => {
      if (step.target === 'body') return true;
      return !!document.querySelector(step.target);
    });

    console.log(`[Tour] Screen: ${hasDashboard ? 'dashboard' : 'search'}. Steps available: ${available.length}`);

    if (available.length === 0) {
      console.warn('[Tour] No valid targets found — aborting');
      setRun(false);
      return;
    }

    setSteps(available);
    setTourKey(k => k + 1); // Force Joyride to remount fresh every time
  }, [run]);

  const handleCallback = ({ status, action }) => {
    const isDone    = status === STATUS.FINISHED;
    const isSkipped = status === STATUS.SKIPPED || action === 'skip' || action === 'close';

    if (isDone) {
      console.log('[Tour] Tour completed by user');
      localStorage.setItem('onboarding_tour_completed', 'true');
      setRun(false);
    } else if (isSkipped) {
      console.log('[Tour] Tour skipped by user');
      localStorage.setItem('onboarding_tour_skipped', 'true');
      setRun(false);
    }
  };

  // Only mount Joyride when we have valid steps and run=true
  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      key={tourKey}
      steps={steps}
      run={true}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      disableOverlayClose={false}
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#10b981',
          backgroundColor: '#0f172a',
          arrowColor: '#0f172a',
          overlayColor: 'rgba(2, 6, 23, 0.82)',
          textColor: '#94a3b8',
          width: 340,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: '✓ Finish',
        next: 'Next →',
        skip: 'Skip tour',
      }}
    />
  );
}

export default OnboardingTour;
