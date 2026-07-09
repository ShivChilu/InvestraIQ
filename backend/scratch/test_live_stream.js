import http from 'http';

async function testLiveAnalysisStream() {
  console.log('==================================================');
  console.log('   STARTING FRESH E2E PIPELINE STREAM TEST');
  console.log('   Target: NVIDIA Corporation (NVDA)');
  console.log('==================================================\n');

  const url = 'http://localhost:5000/api/analyze?ticker=NVDA&company=NVIDIA%20Corporation';

  http.get(url, (res) => {
    console.log(`Connection Status: ${res.statusCode}`);
    console.log(`Headers Sourced:`, JSON.stringify(res.headers, null, 2));
    console.log('\n--- STREAMING EVENTS STARTED ---\n');

    res.setEncoding('utf8');
    let buffer = '';

    res.on('data', (chunk) => {
      buffer += chunk;
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Keep partial line in buffer

      for (const line of lines) {
        if (line.startsWith('event:')) {
          console.log(`Event Sourced: ${line}`);
        } else if (line.startsWith('data:')) {
          try {
            const data = JSON.parse(line.substring(5).trim());
            if (data.step) {
              console.log(`   └─ Step: ${data.step} | Progress: ${data.message}`);
            } else if (data.committee) {
              console.log('\n✓ [Pipeline Result Sourced Successfully]');
              console.log(`   └─ Score: ${data.committee.overallInvestmentScore}/100`);
              console.log(`   └─ Recommendation: ${data.committee.recommendation}`);
              console.log(`   └─ Executive Summary snippet: ${data.committee.executiveSummary.substring(0, 150)}...`);
            }
          } catch (e) {
            // Log raw line if not standard JSON
            console.log(`   └─ Raw Data: ${line}`);
          }
        }
      }
    });

    res.on('end', () => {
      console.log('\n--- STREAMING EVENTS FINISHED ---');
      process.exit(0);
    });

  }).on('error', (err) => {
    console.error('SSE connection failed:', err.message);
    process.exit(1);
  });
}

testLiveAnalysisStream();
