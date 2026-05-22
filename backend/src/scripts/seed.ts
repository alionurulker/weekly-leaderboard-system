import dotenv from 'dotenv';
dotenv.config();

import { createRedisClient, REDIS_KEYS } from '../config/redis';
import { initializeDatabase, query } from '../config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const PLAYER_COUNT = 250;

const COUNTRIES = ['US', 'TR', 'DE', 'GB', 'FR', 'JP', 'BR', 'KR', 'CA', 'AU', 'RU', 'CN', 'IN', 'MX', 'IT'];
const ADJECTIVES = ['Swift', 'Dark', 'Iron', 'Shadow', 'Storm', 'Blaze', 'Frost', 'Silent', 'Golden', 'Crimson', 'Thunder', 'Phantom', 'Royal', 'Savage', 'Cosmic'];
const NOUNS = ['Wolf', 'Eagle', 'Tiger', 'Dragon', 'Phoenix', 'Viper', 'Raven', 'Knight', 'Hunter', 'Warrior', 'Ghost', 'Legend', 'Titan', 'Storm', 'Blade'];

const generateUsername = (i: number): string => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}${noun}${i}`;
};

const generateScore = (rank: number, total: number): number => {
  const t = 1 - (rank - 1) / total;
  const base = Math.pow(t, 2.5) * 500_000;
  const jitter = (Math.random() - 0.5) * base * 0.2;
  return Math.max(100, base + jitter);
};

const DEMO_PLAYER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USERNAME = 'YouAreHere';

export async function seed() {
  console.log('Starting seed...');

  const redis = createRedisClient();
  await new Promise(resolve => setTimeout(resolve, 500));

  await initializeDatabase();

  // Use lower bcrypt rounds for speed (10 instead of 12)
  const passwordHash = await bcrypt.hash('password123', 10);

  // Clear existing data
  const clearPipeline = redis.pipeline();
  clearPipeline.del(REDIS_KEYS.LEADERBOARD);
  clearPipeline.set(REDIS_KEYS.PRIZE_POOL, '0');
  await clearPipeline.exec();
  await query('TRUNCATE players CASCADE');

  console.log('Cleared existing data');

  // ── Batch insert all players in one query ──────────────────────────
  const players: Array<{ id: string; username: string; country: string }> = [];

  // Build demo player row
  const allRows = [{
    id: DEMO_PLAYER_ID,
    username: DEMO_USERNAME,
    email: 'demo@leaderboard.com',
    country: 'TR',
  }];

  // Build all player rows
  for (let i = 1; i <= PLAYER_COUNT; i++) {
    const id = uuidv4();
    const username = generateUsername(i);
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    allRows.push({
      id,
      username,
      email: `${username.toLowerCase()}@example.com`,
      country,
    });
    players.push({ id, username, country });
  }

  // Single batch INSERT for all 251 players
  const valuePlaceholders = allRows.map((_, i) =>
    `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, 0)`
  ).join(', ');

  const valueParams = allRows.flatMap(r => [r.id, r.username, r.email, passwordHash, r.country]);

  await query(
    `INSERT INTO players (id, username, email, password_hash, country, total_earnings)
     VALUES ${valuePlaceholders}`,
    valueParams
  );

  console.log(`Inserted ${allRows.length} players in one batch`);

  // ── Batch all Redis operations in one pipeline ─────────────────────
  const scorePipeline = redis.pipeline();
  const demoScore = generateScore(47, PLAYER_COUNT + 1);

  for (let i = 0; i < players.length; i++) {
    const score = generateScore(i + 1, PLAYER_COUNT + 1);
    scorePipeline.zadd(REDIS_KEYS.LEADERBOARD, score, players[i].id);
    scorePipeline.incrbyfloat(REDIS_KEYS.PRIZE_POOL, score * 0.02);
    // Cache player metadata
    scorePipeline.setex(
      `player:meta:${players[i].id}`,
      604800,
      JSON.stringify({ username: players[i].username, country: players[i].country })
    );
  }

  // Demo player scores and metadata
  scorePipeline.zadd(REDIS_KEYS.LEADERBOARD, demoScore, DEMO_PLAYER_ID);
  scorePipeline.incrbyfloat(REDIS_KEYS.PRIZE_POOL, demoScore * 0.02);
  scorePipeline.setex(
    `player:meta:${DEMO_PLAYER_ID}`,
    604800,
    JSON.stringify({ username: DEMO_USERNAME, country: 'TR' })
  );

  await scorePipeline.exec();

  const finalPool = await redis.get(REDIS_KEYS.PRIZE_POOL);
  const totalInLeaderboard = await redis.zcard(REDIS_KEYS.LEADERBOARD);

  console.log(`Seed complete! Players: ${totalInLeaderboard}, Prize pool: $${parseFloat(finalPool || '0').toFixed(2)}`);

  // Do NOT call process.exit() here — only exit when run directly
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  }).then(() => process.exit(0));
}