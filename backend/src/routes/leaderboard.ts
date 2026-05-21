import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { getLeaderboard, updatePlayerScore } from '../services/leaderboardService';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { broadcastToAll, broadcastToPlayer } from '../websocket';

const router = Router();

const scoreUpdateLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10,
  message: { error: 'Too many score updates, slow down' },
});

// GET /api/leaderboard
// Returns top 100 + current player context
router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getLeaderboard(req.playerId);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/leaderboard/score
// Update player score (called when player earns money)
router.post(
  '/score',
  authenticate,
  scoreUpdateLimiter,
  [
    body('earnings')
      .isFloat({ min: 0.01, max: 1_000_000 })
      .withMessage('Earnings must be between 0.01 and 1,000,000'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { earnings } = req.body as { earnings: number };
      const result = await updatePlayerScore({
        playerId: req.playerId!,
        earnings,
      });

      // Broadcast updated leaderboard to all connected clients
      const leaderboard = await getLeaderboard();
      broadcastToAll({
        type: 'LEADERBOARD_UPDATE',
        payload: {
          top100: leaderboard.top100,
          prizePool: leaderboard.prizePool,
          totalPlayers: leaderboard.totalPlayers,
        },
      });

      // Notify the specific player of their new rank
      broadcastToPlayer(req.playerId!, {
        type: 'PLAYER_SCORE_UPDATE',
        payload: {
          newScore: result.newScore,
          newRank: result.newRank,
          prizePool: result.prizePool,
        },
      });

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Failed to update score:', err);
      res.status(500).json({ error: 'Failed to update score' });
    }
  }
);

// GET /api/leaderboard/player/:playerId
// Get specific player's rank context
router.get('/player/:playerId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { playerId } = req.params;
    const data = await getLeaderboard(playerId);
    res.json({ success: true, data: data.currentPlayer });
  } catch (err) {
    console.error('Failed to fetch player rank:', err);
    res.status(500).json({ error: 'Failed to fetch player rank' });
  }
});

export default router;
