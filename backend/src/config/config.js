import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─── Startup environment validation ────────────────────────────────────────
// These keys are REQUIRED. The server will not start if any are missing.
const REQUIRED_KEYS = [
  'GEMINI_API_KEY',
  'ALPHA_VANTAGE_API_KEY',
  'TAVILY_API_KEY',
  'SERPER_API_KEY',
];

const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missing.forEach((k) => console.error(`   • ${k}`));
  console.error('\nCreate a .env file in the backend/ directory with all required keys.');
  console.error('See .env.example for the expected format.\n');
  process.exit(1);
}

// ─── Exported config object ─────────────────────────────────────────────────
export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  geminiApiKey: process.env.GEMINI_API_KEY,
  tavilyApiKey: process.env.TAVILY_API_KEY,
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
  serperApiKey: process.env.SERPER_API_KEY,
  // Allowed CORS origins (comma-separated list in .env, defaults to localhost dev)
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
