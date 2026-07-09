import express from 'express';
import cors from 'cors';
import { config } from './config/config';
import analysisRouter from './routes/analysis';

const app = express();

app.use(cors({
  origin: '*', // Allow connections from frontend dev server
}));
app.use(express.json());

// API Routes
app.use('/api', analysisRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mockMode: config.isMockMode });
});

// Start Server
app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  AI INVESTMENT ANALYST BACKEND RUNNING ON PORT ${config.port}`);
  console.log(`  MOCK MODE: ${config.isMockMode ? 'ENABLED (Fallbacks Active)' : 'DISABLED (Real APIs Active)'}`);
  console.log(`====================================================`);
});
