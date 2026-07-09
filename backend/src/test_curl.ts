import axios from 'axios';
import { config } from './config/config';

async function test() {
  console.log("Testing endpoint with Axios...");
  try {
    const res = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: "Explain how AI works in a few words"
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': config.geminiApiKey
        }
      }
    );
    console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error("FAILED:", e.response ? e.response.data : e.message);
  }
}
test();
