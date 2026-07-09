import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/config.js';
import analysisRouter from './routes/analysis.js';

// Bypass self-signed SSL certificate issues caused by local VPNs, proxies, or firewalls
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();

// ─── CORS (env-configurable whitelist) ────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl requests (no Origin header)
    if (!origin) return callback(null, true);
    const isAllowed = config.corsOrigins.includes(origin) || 
                      origin.endsWith('.onrender.com') || 
                      /^https?:\/\/localhost:\d+$/.test(origin);
    if (isAllowed) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
  },
  credentials: true
}));

app.use(express.json());

// ─── Rate Limiting ────────────────────────────────────────────────────────
// Heavy AI analysis endpoint: max 5 requests per 2 minutes per IP
const analysisLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analysis requests. Please wait 2 minutes before retrying.' },
  skip: (req) => {
    // Skip rate-limiting for cached requests (they return instantly)
    return false;
  }
});

// General API limiter: 60 requests per minute per IP (covers /search etc.)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

// Apply limiters
app.use('/api/analyze', analysisLimiter);
app.use('/api', generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api', analysisRouter);

// ─── Index / Welcome Route ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'InvestraIQ Multi-Agent AI Investment Research Engine API is running.',
    docs: '/api'
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0' });
});

// ─── Start Server ─────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  AI INVESTMENT ANALYST BACKEND — PORT ${config.port}`);
  console.log(`  CORS Origins: ${config.corsOrigins.join(', ')}`);
  console.log(`====================================================`);
});
