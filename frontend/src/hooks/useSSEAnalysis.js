import { useState, useCallback, useRef } from 'react';

export const STAGES = [
  { key: 'collecting_info', label: 'Company Retrieval', desc: 'Acquiring profile and basic records' },
  { key: 'financials', label: 'Financial Analyst', desc: 'Analyzing balance sheets & income statements' },
  { key: 'news', label: 'News Analyst', desc: 'Evaluating market sentiment & recent press' },
  { key: 'industry', label: 'Industry Analyst', desc: 'Profiling competitors & market moats' },
  { key: 'risk', label: 'Risk Officer', desc: 'Assessing legal, geo, and macro hazards' },
  { key: 'committee', label: 'Investment Committee', desc: 'Voting and compiling final scorecard' },
  { key: 'preparing_report', label: 'Report Compilation', desc: 'Assembling final dashboard widgets' }
];

export function useSSEAnalysis() {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [stepMessages, setStepMessages] = useState({});
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  
  const eventSourceRef = useRef(null);

  const cancelAnalysis = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLoading(false);
    setReport(null);
  }, []);

  const triggerAnalysis = useCallback((companyName, ticker) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setActiveStep('collecting_info');
    setCompletedSteps([]);
    setStepMessages({
      collecting_info: 'Initializing analyst network...'
    });

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const backendUrl = `http://localhost:5000/api/analyze?company=${encodeURIComponent(companyName)}&ticker=${encodeURIComponent(ticker)}`;
    const es = new EventSource(backendUrl);
    eventSourceRef.current = es;

    es.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        
        setActiveStep(data.step);
        setStepMessages(prev => ({
          ...prev,
          [data.step]: data.message
        }));

        const stepIdx = STAGES.findIndex(s => s.key === data.step);
        if (stepIdx > 0) {
          const finishedKeys = STAGES.slice(0, stepIdx).map(s => s.key);
          setCompletedSteps(finishedKeys);
        }
      } catch (err) {
        console.error('Error parsing progress SSE event', err);
      }
    });

    es.addEventListener('result', (e) => {
      try {
        const finalReport = JSON.parse(e.data);
        setReport(finalReport);
        setCompletedSteps(STAGES.map(s => s.key));
        setActiveStep(null);
      } catch (err) {
        console.error('Error parsing result SSE event', err);
        setError('Failed to parse analysis report.');
      }
    });

    es.addEventListener('error', (e) => {
      console.error('SSE Error occurred:', e);
      let errMsg = 'Connection to analysis engine interrupted.';
      try {
        if (e.data) {
          const parsed = JSON.parse(e.data);
          if (parsed.message) errMsg = parsed.message;
        }
      } catch {}
      setError(errMsg);
      setLoading(false);
      es.close();
    });

    es.addEventListener('done', () => {
      console.log('SSE Stream closed naturally.');
      setLoading(false);
      es.close();
    });
  }, []);

  return {
    loading,
    activeStep,
    completedSteps,
    stepMessages,
    report,
    error,
    triggerAnalysis,
    cancelAnalysis
  };
}
