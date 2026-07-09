import axios from 'axios';
import http from 'http';

async function runTestCases() {
  console.log('==================================================');
  console.log('   RUNNING COMPREHENSIVE ENDPOINT TEST SUITE');
  console.log('==================================================\n');

  // Test Case 1: Autocomplete Company Search for "Apple"
  try {
    console.log('[Test Case 1] GET /api/search?keywords=Apple');
    const res = await axios.get('http://localhost:5000/api/search?keywords=Apple');
    console.log(`  ✓ Search Response Status: ${res.status}`);
    console.log(`  ✓ Suggestions Found: ${res.data.length}`);
    if (res.data.length > 0) {
      console.log(`  ✓ Top Result: ${res.data[0].companyName} (${res.data[0].symbol}) on ${res.data[0].exchange}`);
    }
    console.log('');
  } catch (err) {
    console.log(`  ✗ Search Failed: ${err.message}\n`);
  }

  // Test Case 2: Autocomplete Company Search for "Microsoft"
  try {
    console.log('[Test Case 2] GET /api/search?keywords=Microsoft');
    const res = await axios.get('http://localhost:5000/api/search?keywords=Microsoft');
    console.log(`  ✓ Search Response Status: ${res.status}`);
    console.log(`  ✓ Suggestions Found: ${res.data.length}`);
    if (res.data.length > 0) {
      console.log(`  ✓ Top Result: ${res.data[0].companyName} (${res.data[0].symbol}) on ${res.data[0].exchange}`);
    }
    console.log('');
  } catch (err) {
    console.log(`  ✗ Search Failed: ${err.message}\n`);
  }

  // Test Case 3: SSE Analysis Stream for AAPL
  console.log('[Test Case 3] Connecting to SSE /api/analyze?ticker=AAPL&company=Apple%20Inc.');
  
  const sseUrl = 'http://localhost:5000/api/analyze?ticker=AAPL&company=Apple%20Inc.';
  
  await new Promise((resolve) => {
    let completed = false;
    const req = http.get(sseUrl, (res) => {
      console.log(`  ✓ SSE Connection Status: ${res.statusCode}`);
      console.log(`  ✓ Content-Type: ${res.headers['content-type']}`);
      
      res.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.replace('data:', '').trim();
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.companyName || parsed.committee) {
                console.log(`\n  ✓ SSE Complete Event Received!`);
                console.log(`    → Verdict: ${parsed.committee.recommendation} | Score: ${parsed.committee.overallInvestmentScore}/100`);
                console.log(`    → HQ Sourced: ${parsed.verifiedProfile.headquarters.value}`);
                console.log(`    → Website Sourced: ${parsed.verifiedProfile.officialWebsite.value}`);
                completed = true;
                req.destroy();
                resolve();
                break;
              } else {
                console.log(`    → Stream Event [${parsed.step || 'progress'}]: ${parsed.message}`);
              }
            } catch (e) {
              // ignore buffer lines or progress strings
            }
          }
        }
      });

      res.on('end', () => {
        if (!completed) {
          console.log('  ✗ SSE Stream ended.');
          resolve();
        }
      });
    });

    req.on('error', (err) => {
      console.log(`  ✗ SSE Request Connection Error: ${err.message}`);
      resolve();
    });

    // Set a 25-second timeout to allow the live scraping to finish
    setTimeout(() => {
      if (!completed) {
        console.log('  ✗ SSE Stream timed out after 25s.');
        req.destroy();
        resolve();
      }
    }, 25000);
  });

  console.log('\n==================================================');
  console.log('   TEST CASES RESOLVED');
  console.log('==================================================');
}

runTestCases();
