class DiagnosticsTracker {
  constructor() {
    this.logs = [];
    this.currentCycle = null;
  }

  startCycle(companyName, ticker) {
    this.currentCycle = {
      timestamp: new Date().toISOString(),
      companyName,
      ticker,
      startTime: Date.now(),
      apiCalls: [],
      fieldsSources: {},
      cacheHits: [],
      cacheMisses: []
    };
  }

  logApiCall({ provider, endpoint, status, latency, attempts = 1, error = null }) {
    if (!this.currentCycle) return;
    this.currentCycle.apiCalls.push({
      provider,
      endpoint,
      status,
      latency,
      attempts,
      error: error || 'None'
    });
  }

  logFieldSource(fieldName, { source, status, details }) {
    if (!this.currentCycle) return;
    this.currentCycle.fieldsSources[fieldName] = {
      source,
      status,
      details
    };
  }

  logCacheHit(key) {
    if (!this.currentCycle) return;
    this.currentCycle.cacheHits.push(key);
  }

  logCacheMiss(key) {
    if (!this.currentCycle) return;
    this.currentCycle.cacheMisses.push(key);
  }

  endCycle() {
    if (!this.currentCycle) return null;
    this.currentCycle.totalLatency = Date.now() - this.currentCycle.startTime;
    const cycle = { ...this.currentCycle };
    this.logs.unshift(cycle);
    // Keep last 50 audit cycles
    if (this.logs.length > 50) {
      this.logs.pop();
    }
    
    // Output high-visibility diagnostic console report
    console.log(`\n====================================================`);
    console.log(`   DIAGNOSTIC REPORT FOR: ${cycle.companyName} (${cycle.ticker})`);
    console.log(`====================================================`);
    console.log(`✓ Total Processing Time: ${cycle.totalLatency}ms`);
    console.log(`✓ Cache Hits: ${cycle.cacheHits.join(', ') || 'None'}`);
    console.log(`✓ Cache Misses: ${cycle.cacheMisses.join(', ') || 'None'}`);
    console.log(`\n--- API Operations Audited ---`);
    cycle.apiCalls.forEach(call => {
      console.log(`- [${call.provider}] ${call.endpoint} | Status: ${call.status} | Time: ${call.latency}ms | Retries: ${call.attempts - 1} | Error: ${call.error}`);
    });
    console.log(`\n--- Final Fields Sourcing ---`);
    Object.entries(cycle.fieldsSources).forEach(([field, src]) => {
      console.log(`- ${field}: Source: ${src.source} | Status: ${src.status} | Details: ${src.details}`);
    });
    console.log(`====================================================\n`);

    this.currentCycle = null;
    return cycle;
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const diagnostics = new DiagnosticsTracker();
export default diagnostics;
