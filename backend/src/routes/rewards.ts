import { Router, Response } from 'express';
import { distributeWeeklyRewards } from '../services/rewardService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-change-me';

// POST /api/rewards/distribute
// Admin endpoint to manually trigger reward distribution
router.post('/distribute', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== ADMIN_SECRET) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  try {
    const result = await distributeWeeklyRewards();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Manual distribution failed:', err);
    res.status(500).json({ error: 'Distribution failed' });
  }
});

// GET /api/rewards/history
// Get reward history for current player
router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT rt.*, ws.rank, ws.score, pp.total_pool
       FROM reward_transactions rt
       JOIN weekly_snapshots ws ON ws.player_id = rt.player_id AND ws.week_start = rt.week_start
       JOIN prize_pools pp ON pp.week_start = rt.week_start
       WHERE rt.player_id = $1
       ORDER BY rt.week_start DESC
       LIMIT 20`,
      [req.playerId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reward history' });
  }
});

// GET /api/rewards/current-pool
router.get('/current-pool', async (_req, res: Response): Promise<void> => {
  try {
    const { getRedisClient, REDIS_KEYS } = await import('../config/redis');
    const redis = getRedisClient();
    const pool = await redis.get(REDIS_KEYS.PRIZE_POOL);
    res.json({ success: true, data: { prizePool: parseFloat(pool || '0') } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prize pool' });
  }
});

export default router;
