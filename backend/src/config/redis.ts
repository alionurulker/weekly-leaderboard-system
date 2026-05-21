import Redis from 'ioredis';

let redisClient: Redis;

export const REDIS_KEYS = {
  LEADERBOARD: 'leaderboard:weekly',
  PRIZE_POOL: 'leaderboard:prize_pool',
  WEEK_START: 'leaderboard:week_start',
  PLAYER_META: (id: string) => `player:meta:${id}`,
  PLAYER_PREV_RANK: (id: string) => `player:prev_rank:${id}`,
} as const;

export const createRedisClient = (): Redis => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on('connect', () => console.log('Redis connected'));
  redisClient.on('ready', () => console.log('Redis ready'));
  redisClient.on('error', (err) => console.error('Redis error:', err));
  redisClient.on('close', () => console.warn('Redis connection closed'));

  return redisClient;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redisClient;
};

export default getRedisClient;
