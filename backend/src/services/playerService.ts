import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { cachePlayerMeta } from './leaderboardService';
import type { Player } from '../types/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  country?: string;
  avatarUrl?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  player: Omit<Player, 'weeklyScore'>;
}

export const registerPlayer = async (req: RegisterRequest): Promise<AuthResponse> => {
  const { username, email, password, country, avatarUrl } = req;

  const existing = await query(
    'SELECT id FROM players WHERE email = $1 OR username = $2',
    [email, username]
  );
  if (existing.rows.length > 0) {
    throw new Error('Username or email already taken');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = uuidv4();

  const result = await query(
    `INSERT INTO players (id, username, email, password_hash, country, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, username, email, passwordHash, country || null, avatarUrl || null]
  );

  const player = result.rows[0];

  // Cache metadata in Redis for fast leaderboard lookups
  await cachePlayerMeta(id, {
    username: player.username,
    avatarUrl: player.avatar_url,
    country: player.country,
  });

  const token = jwt.sign({ playerId: id, username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    player: {
      id: player.id,
      username: player.username,
      email: player.email,
      avatarUrl: player.avatar_url,
      country: player.country,
      totalEarnings: parseFloat(player.total_earnings),
      createdAt: player.created_at,
    },
  };
};

export const loginPlayer = async (req: LoginRequest): Promise<AuthResponse> => {
  const { email, password } = req;

  const result = await query('SELECT * FROM players WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const player = result.rows[0];
  const valid = await bcrypt.compare(password, player.password_hash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  // Re-cache metadata on login
  await cachePlayerMeta(player.id, {
    username: player.username,
    avatarUrl: player.avatar_url,
    country: player.country,
  });

  const token = jwt.sign(
    { playerId: player.id, username: player.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    player: {
      id: player.id,
      username: player.username,
      email: player.email,
      avatarUrl: player.avatar_url,
      country: player.country,
      totalEarnings: parseFloat(player.total_earnings),
      createdAt: player.created_at,
    },
  };
};

export const getPlayerById = async (id: string): Promise<Player | null> => {
  const result = await query('SELECT * FROM players WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;

  const p = result.rows[0];
  return {
    id: p.id,
    username: p.username,
    email: p.email,
    avatarUrl: p.avatar_url,
    country: p.country,
    totalEarnings: parseFloat(p.total_earnings),
    weeklyScore: 0,
    createdAt: p.created_at,
  };
};

export const getPlayerHistory = async (playerId: string) => {
  const result = await query(
    `SELECT ws.*, pp.total_pool
     FROM weekly_snapshots ws
     JOIN prize_pools pp ON pp.week_start = ws.week_start
     WHERE ws.player_id = $1
     ORDER BY ws.week_start DESC
     LIMIT 20`,
    [playerId]
  );
  return result.rows;
};

export const verifyToken = (token: string): { playerId: string; username: string } => {
  return jwt.verify(token, JWT_SECRET) as { playerId: string; username: string };
};
