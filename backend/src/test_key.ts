import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from './config/config';

async function test() {
  console.log("Config key starts with:", config.geminiApiKey.substring(0, 10));
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
  
  for (const modelName of models) {
    console.log(`\nTesting model: ${modelName}`);
    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: config.geminiApiKey,
        modelName: modelName,
      });
      const res = await model.invoke("Say hello");
      console.log(`SUCCESS [${modelName}]:`, res.content);
    } catch (e: any) {
      console.error(`FAILED [${modelName}]:`, e.message);
    }
  }
}
test();
