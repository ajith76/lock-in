import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import habitRoutes from './routes/habit.routes';
import completionRoutes from './routes/completion.routes';
import statsRoutes from './routes/stats.routes';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] ?? 3000;

// ── Middleware ──
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/completions', completionRoutes);
app.use('/api/stats', statsRoutes);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ──
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
