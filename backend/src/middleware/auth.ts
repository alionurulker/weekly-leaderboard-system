import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/playerService';

export interface AuthRequest extends Request {
  playerId?: string;
  username?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyToken(token);
    req.playerId = payload.playerId;
    req.username = payload.username;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(authHeader.substring(7));
      req.playerId = payload.playerId;
      req.username = payload.username;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
};
