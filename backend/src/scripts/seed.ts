import dotenv from 'dotenv';
dotenv.config();

import { createRedisClient, REDIS_KEYS } from '../config/redis';
import { initializeDatabase, query } from '../config/database';
import { connectMongoDB } from '../config/mongodb';
import { cachePlayerMeta } from '../services/leaderboardService';
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

// Generates Pareto-distributed scores (realistic: few high earners, many low)
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
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for Redis connect

  await initializeDatabase();

  const passwordHash = await bcrypt.hash('password123', 12);

  // Clear existing data
  const pipeline = redis.pipeline();
  pipeline.del(REDIS_KEYS.LEADERBOARD);
  pipeline.set(REDIS_KEYS.PRIZE_POOL, '0');
  await pipeline.exec();
  await query('TRUNCATE players CASCADE');

  console.log('Cleared existing data');

  // Create demo player first (rank ~47 by design)
  await query(
    `INSERT INTO players (id, username, email, password_hash, country, total_earnings)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [DEMO_PLAYER_ID, DEMO_USERNAME, 'demo@leaderboard.com', passwordHash, 'TR', 0]
  );
  await cachePlayerMeta(DEMO_PLAYER_ID, {
    username: DEMO_USERNAME,
    country: 'TR',
    avatarUrl: undefined,
  });

  // Create all players
  const players: Array<{ id: string; username: string; country: string }> = [];

  for (let i = 1; i <= PLAYER_COUNT; i++) {
    const id = uuidv4();
    const username = generateUsername(i);
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

    await query(
      `INSERT INTO players (id, username, email, password_hash, country, total_earnings)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, username, `${username.toLowerCase()}@example.com`, passwordHash, country, 0]
    );

    await cachePlayerMeta(id, { username, country });
    players.push({ id, username, country });

    if (i % 50 === 0) console.log(`Created ${i}/${PLAYER_COUNT} players`);
  }

  // Insert demo player into the array at position ~47 worth of score
  const allPlayers = [...players];

  // Assign scores in rank order (sorted descending)
  const sortedPlayers = [...allPlayers];
  // Demo player gets rank ~47 score
  const demoScore = generateScore(47, PLAYER_COUNT + 1);

  // Score all other players
  const scoreBatch = redis.pipeline();
  let totalEarnings = 0;

  for (let i = 0; i < sortedPlayers.length; i++) {
    const score = generateScore(i + 1, PLAYER_COUNT + 1);
    totalEarnings += score;
    scoreBatch.zadd(REDIS_KEYS.LEADERBOARD, score, sortedPlayers[i].id);
    scoreBatch.incrbyfloat(REDIS_KEYS.PRIZE_POOL, score * 0.02);
  }

  // Add demo player
  scoreBatch.zadd(REDIS_KEYS.LEADERBOARD, demoScore, DEMO_PLAYER_ID);
  scoreBatch.incrbyfloat(REDIS_KEYS.PRIZE_POOL, demoScore * 0.02);

  await scoreBatch.exec();

  const finalPool = await redis.get(REDIS_KEYS.PRIZE_POOL);
  const totalInLeaderboard = await redis.zcard(REDIS_KEYS.LEADERBOARD);

  console.log(`\nSeed complete!`);
  console.log(`Players in leaderboard: ${totalInLeaderboard}`);
  console.log(`Prize pool: $${parseFloat(finalPool || '0').toFixed(2)}`);
  console.log(`\nDemo credentials:`);
  console.log(`  Email: demo@leaderboard.com`);
  console.log(`  Password: password123`);
  console.log(`  Player ID: ${DEMO_PLAYER_ID}`);

  process.exit(0);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}