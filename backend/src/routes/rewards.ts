import { Router, Request, Response } from 'express';
import { distributeWeeklyRewards } from '../services/rewardService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-change-me';

/** Shared admin-secret guard — no JWT needed, matches the seed endpoint pattern. */
const requireAdminSecret = (req: Request, res: Response): boolean => {
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }
  return true;
};

// ── POST /api/rewards/distribute ─────────────────────────────────────────────
// Manually trigger reward distribution (requires JWT + admin secret).
router.post('/distribute', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireAdminSecret(req, res)) return;

  try {
    const result = await distributeWeeklyRewards();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Manual distribution failed:', err);
    res.status(500).json({ error: 'Distribution failed' });
  }
});

// ── POST /api/rewards/reset ──────────────────────────────────────────────────
// Testing endpoint: runs a full end-of-week cycle right now.
//
// Exactly what happens (in order, inside distributeWeeklyRewards):
//   1. Reads the current prize pool and top-100 from Redis.
//   2. Distributes the pool to top-100 players:
//        Rank 1  → 20 %
//        Rank 2  → 15 %
//        Rank 3  → 10 %
//        Rank 4-100 → 55 % split by inverse-rank weight (rank 4 gets most)
//   3. Persists prize_pools, weekly_snapshots and reward_transactions to PostgreSQL.
//   4. Resets Redis: deletes the leaderboard sorted set, zeroes the prize pool,
//      and stamps a new week_start — ready for the new week immediately.
//
// Auth: x-admin-secret header only (no JWT), matching the seed endpoint pattern.
//
// Example (PowerShell):
//   Invoke-WebRequest -Uri "https://<host>/api/rewards/reset" `
//     -Method POST `
//     -Headers @{ "x-admin-secret" = "your-admin-secret" }
router.post('/reset', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdminSecret(req, res)) return;

  try {
    const result = await distributeWeeklyRewards();
    res.json({
      success: true,
      message: 'Weekly reset complete. Prize pool distributed and leaderboard cleared.',
      data: {
        weekStart: result.weekStart,
        weekEnd: result.weekEnd,
        totalPool: result.totalPool,
        distributedAt: result.distributedAt,
        recipientCount: result.distributions.length,
        // Top 10 for a quick sanity-check in the response
        topDistributions: result.distributions.slice(0, 10).map((d) => ({
          rank: d.rank,
          username: d.username,
          amount: d.amount,
          percentage: Number(d.percentage.toFixed(4)),
        })),
      },
    });
  } catch (err) {
    console.error('Reset endpoint failed:', err);
    res.status(500).json({ error: 'Reset failed', detail: err instanceof Error ? err.message : String(err) });
  }
});

// ── GET /api/rewards/history ─────────────────────────────────────────────────
// Reward history for the authenticated player.
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

// ── GET /api/rewards/current-pool ────────────────────────────────────────────
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