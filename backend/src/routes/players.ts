import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { registerPlayer, loginPlayer, getPlayerById, getPlayerHistory } from '../services/playerService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/players/register
router.post(
  '/register',
  [
    body('username').isLength({ min: 3, max: 50 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('country').optional().isLength({ min: 2, max: 2 }).toUpperCase(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const result = await registerPlayer(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      res.status(400).json({ error: message });
    }
  }
);

// POST /api/players/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const result = await loginPlayer(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
);

// GET /api/players/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const player = await getPlayerById(req.playerId!);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json({ success: true, data: player });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// GET /api/players/me/history
router.get('/me/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await getPlayerHistory(req.playerId!);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/players/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const player = await getPlayerById(req.params.id);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    // Omit sensitive fields
    const { email: _email, ...publicProfile } = player;
    res.json({ success: true, data: publicProfile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

export default router;
