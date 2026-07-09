import axios from 'axios';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables
dotenv.config();

const geminiKey = process.env.GEMINI_API_KEY;

const TestSchema = z.object({
  status: z.string(),
  verdict: z.string()
});

async function runExperimentalTests() {
  console.log('==================================================');
  console.log('   GEMINI EXPERIMENTAL QUOTA DIAGNOSTICS');
  console.log('==================================================\n');
  console.log(`Using Key: ${geminiKey ? geminiKey.substring(0, 12) + '...' : 'NONE'}\n`);

  if (!geminiKey) {
    console.error('Error: GEMINI_API_KEY is not defined in your environment.');
    return;
  }

  // ==========================================
  // TEST A: Plain generateContent Request (REST API)
  // ==========================================
  console.log('[Test A] Plain generateContent Request (REST API)...');
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
    const start = Date.now();
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: 'Output only the word ACTIVE' }] }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`  ✓ Test A Response Status: ${res.status} (${res.statusText})`);
    console.log(`  ✓ Test A Headers:`, JSON.stringify(res.headers, null, 2));
    console.log(`  ✓ Test A Body:`, JSON.stringify(res.data, null, 2));
    console.log(`  ✓ Latency: ${Date.now() - start}ms\n`);
  } catch (err) {
    console.log(`  ✗ Test A FAILED`);
    if (err.response) {
      console.log(`    HTTP Status: ${err.response.status}`);
      console.log(`    Headers:`, JSON.stringify(err.response.headers, null, 2));
      console.log(`    Body:`, JSON.stringify(err.response.data, null, 2));
    } else {
      console.log(`    Error Message: ${err.message}`);
    }
    console.log('');
  }

  // ==========================================
  // TEST B: withStructuredOutput Request (LangChain Tool Calling)
  // ==========================================
  console.log('[Test B] withStructuredOutput Request (LangChain Tool Calling)...');
  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      modelName: 'gemini-flash-latest',
      temperature: 0.1,
      maxRetries: 0
    });
    
    const start = Date.now();
    const chain = model.withStructuredOutput(TestSchema);
    const response = await chain.invoke('Tell me if everything is active. Output status: active, verdict: pass.');
    
    console.log(`  ✓ Test B Succeeded!`);
    console.log(`  ✓ Test B Output:`, JSON.stringify(response, null, 2));
    console.log(`  ✓ Latency: ${Date.now() - start}ms\n`);
  } catch (err) {
    console.log(`  ✗ Test B FAILED`);
    console.log(`    Error Name: ${err.name}`);
    console.log(`    Error Message: ${err.message}`);
    if (err.stack) {
      console.log(`    Stack Trace snippet: ${err.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    console.log('');
  }

  // ==========================================
  // ESTIMATION OF GEMINI CALLS IN A COMPLETE ANALYSIS
  // ==========================================
  console.log('==================================================');
  console.log('   ANALYSIS PIPELINE COUNT & OPPORTUNITIES');
  console.log('==================================================');
  console.log('Currently, during one complete company analysis, the backend makes:');
  console.log('1. [News Verification Stage]: 1 Batch Gemini Call (combining up to 5 articles).');
  console.log('2. [Industry Analysis Stage]: 1 structured Gemini Call (competitors/growth/position).');
  console.log('3. [Risk Officer Stage]: 1 structured Gemini Call (company/macro/regulatory risks).');
  console.log('4. [Investment Committee Stage]: 1 structured Gemini Call (votes/bull-bear thesis/final verdict).');
  console.log('Total calls = 4 Gemini API Requests.\n');

  console.log('Opportunities to reduce to a SINGLE request:');
  console.log('- Collapse the Industry, Risk, and Investment Committee stages into a single composite prompt.');
  console.log('- Provide all fetched profile details, financial data, and news titles/sentiments to the model at once.');
  console.log('- Request a single unified structured output representing the merged IndustryData, RiskData, and CommitteeReport.');
}

runExperimentalTests();
