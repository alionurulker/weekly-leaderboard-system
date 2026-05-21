import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { initializeDatabase } from './config/database';
import { createRedisClient } from './config/redis';
import { connectMongoDB } from './config/mongodb';
import { initWebSocketServer, getConnectedCount } from './websocket';
import { startWeeklyResetJob } from './jobs/weeklyReset';

import leaderboardRoutes from './routes/leaderboard';
import playerRoutes from './routes/players';
import rewardRoutes from './routes/rewards';

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Handled by frontend
}));

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/rewards', rewardRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    connectedClients: getConnectedCount(),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Bootstrap ─────────────────────────────────────────────────────────────
const bootstrap = async (): Promise<void> => {
  try {
    // Initialize all connections
    await initializeDatabase();
    createRedisClient();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for Redis

    // MongoDB is optional (analytics only)
    if (process.env.MONGODB_URI) {
      await connectMongoDB().catch((err) => {
        console.warn('MongoDB connection failed (optional):', err.message);
      });
    }

    // Initialize WebSocket server
    initWebSocketServer(server);

    // Start cron jobs
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      startWeeklyResetJob();
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Leaderboard API running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   WebSocket:   ws://localhost:${PORT}/ws`);
      console.log(`   Health:      http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

bootstrap();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
