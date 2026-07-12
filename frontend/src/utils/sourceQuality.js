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
