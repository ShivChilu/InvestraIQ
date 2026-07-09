import axios from 'axios';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';
import path from 'path';

// Bypass TLS issues caused by local VPNs or firewalls
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();

async function testAllApis() {
  console.log('==================================================');
  console.log('   STARTING MULTI-API KEY ACTIVE PING TEST');
  console.log('==================================================\n');

  // Test 1: Alpha Vantage
  try {
    const avKey = process.env.ALPHA_VANTAGE_API_KEY;
    console.log(`[1/4] Alpha Vantage (Key: ${avKey ? avKey.substring(0, 4) + '...' : 'NONE'})`);
    const res = await axios.get(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=MSFT&apikey=${avKey}`);
    if (res.data && !res.data.Note && !res.data.Information) {
      console.log('  ✓ Alpha Vantage: ACTIVE (Matches retrieved successfully)\n');
    } else {
      console.log(`  ✗ Alpha Vantage: RATE LIMITED / EXHAUSTED (${JSON.stringify(res.data)})\n`);
    }
  } catch (err) {
    console.log(`  ✗ Alpha Vantage: FAILED (${err.message})\n`);
  }

  // Test 2: Serper API
  try {
    const serperKey = process.env.SERPER_API_KEY;
    console.log(`[2/4] Serper API (Key: ${serperKey ? serperKey.substring(0, 4) + '...' : 'NONE'})`);
    const res = await axios.post(
      'https://google.serper.dev/search',
      { q: 'Apple Inc corporate website', num: 1 },
      { headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' } }
    );
    if (res.data && res.data.organic) {
      console.log('  ✓ Serper API: ACTIVE (Search results returned)\n');
    } else {
      console.log(`  ✗ Serper API: FAILED (${JSON.stringify(res.data)})\n`);
    }
  } catch (err) {
    console.log(`  ✗ Serper API: FAILED (${err.message})\n`);
  }

  // Test 3: Tavily Search API
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    console.log(`[3/4] Tavily API (Key: ${tavilyKey ? tavilyKey.substring(0, 4) + '...' : 'NONE'})`);
    const res = await axios.post('https://api.tavily.com/search', {
      api_key: tavilyKey,
      query: 'Tesla stock news',
      max_results: 1
    });
    if (res.data && res.data.results) {
      console.log('  ✓ Tavily API: ACTIVE (News links found)\n');
    } else {
      console.log(`  ✗ Tavily API: FAILED (${JSON.stringify(res.data)})\n`);
    }
  } catch (err) {
    console.log(`  ✗ Tavily API: FAILED (${err.message})\n`);
  }

  // Test 4: Gemini API (via LangChain)
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    console.log(`[4/4] Gemini API (Key: ${geminiKey ? geminiKey.substring(0, 10) + '...' : 'NONE'})`);
    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      modelName: 'gemini-flash-latest',
      temperature: 0.1
    });
    const response = await model.invoke('Output only the word "ACTIVE"');
    console.log(`  ✓ Gemini API: ACTIVE (Response: "${response.content.toString().trim()}")\n`);
  } catch (err) {
    console.log(`  ✗ Gemini API: FAILED (${err.message})\n`);
  }

  console.log('==================================================');
  console.log('   API PING CHECKS COMPLETED');
  console.log('==================================================');
}

testAllApis();
