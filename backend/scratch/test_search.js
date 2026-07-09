import axios from 'axios';
import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

dotenv.config();

const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  serperApiKey: process.env.SERPER_API_KEY,
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY
};

async function testSearch() {
  console.log('--- TESTING ALPHA VANTAGE SEARCH ---');
  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=meta&apikey=${config.alphaVantageApiKey}`;
    const res = await axios.get(url);
    console.log('Alpha Vantage Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Alpha Vantage Error:', err.message);
  }

  console.log('\n--- TESTING SERPER SEARCH ---');
  try {
    const res = await axios.post(
      'https://google.serper.dev/search',
      { q: 'meta company official website profile overview', num: 6 },
      { headers: { 'X-API-KEY': config.serperApiKey, 'Content-Type': 'application/json' } }
    );
    console.log('Serper Organic Results Count:', res.data.organic?.length || 0);
    console.log('First Result:', JSON.stringify(res.data.organic?.[0], null, 2));

    if (res.data.organic?.length > 0) {
      console.log('\n--- TESTING GEMINI EXTRACTOR ---');
      const model = new ChatGoogleGenerativeAI({
        apiKey: config.geminiApiKey,
        modelName: 'gemini-flash-latest',
        temperature: 0.1,
      });

      const prompt = `
        Based on the Google Serper organic search results for "meta":
        ${JSON.stringify(res.data.organic.map((r) => ({ title: r.title, link: r.link, snippet: r.snippet })))}

        Extract the most relevant companies matching the search term "meta".
        For each company discovered, determine if it is likely a publicly traded stock or a private company/startup.
        If it is private or unlisted, map exchange to "PRIVATE" and suggest an uppercase symbol (e.g. FLIPKART, AFFINSYS).
        If it is public, suggest its primary stock exchange ticker (e.g. AAPL, TSLA, TCS).

        Return EXACTLY a JSON array of objects. Do not write markdown markers (\`\`\`json) or header commentaries.
        Each object must contain:
        - companyName: Full name of the entity
        - website: Clean official base website URL (e.g. "https://affinsys.ai" or "https://www.flipkart.com")
        - region: Country identifier code (e.g. "IN", "US")
        - exchange: Exchange tag ("PRIVATE" or stock exchange name)
        - symbol: Uppercase ticker or suggested symbol (e.g. "AFFINSYS", "FLIPKART")
        - currency: Operational currency (e.g. "INR", "USD")
      `;

      const geminiRes = await model.invoke(prompt);
      console.log('Gemini raw output:', geminiRes.content.toString().trim());
    }
  } catch (err) {
    console.error('Serper/Gemini Error:', err.message);
  }
}

testSearch();
