import { getRedisClient, REDIS_KEYS } from '../config/redis';
import { query, getClient } from '../config/database';
import { WeekResetLog } from '../config/mongodb';
import { getWeekBounds, calculatePrizeEstimate, getPlayerMeta } from './leaderboardService';
import { PRIZE_DISTRIBUTION_RULES } from '../types/shared';
import type { WeeklyRewardResult, PrizeDistribution } from '../types/shared';

export const distributeWeeklyRewards = async (): Promise<WeeklyRewardResult> => {
  const redis = getRedisClient();
  const { weekStart, weekEnd } = getWeekBounds();

  // Recalculate weekStart as the CURRENT week (which is ending)
  const now = new Date();
  const day = now.getUTCDay();
  const currentWeekStart = new Date(now);
  const daysToMonday = day === 0 ? -6 : -(day - 1);
  currentWeekStart.setUTCDate(now.getUTCDate() + daysToMonday);
  currentWeekStart.setUTCHours(0, 0, 0, 0);
  const currentWeekEnd = new Date(now);
  currentWeekEnd.setUTCHours(23, 59, 59, 999);

  console.log('Starting weekly reward distribution...');
  const startTime = Date.now();

  // Fetch prize pool and top 100
  const [prizePoolStr, top100Raw] = await Promise.all([
    redis.get(REDIS_KEYS.PRIZE_POOL),
    redis.zrevrange(REDIS_KEYS.LEADERBOARD, 0, PRIZE_DISTRIBUTION_RULES.TOP_REWARDED - 1, 'WITHSCORES'),
  ]);

  const totalPool = parseFloat(prizePoolStr || '0');

  if (totalPool <= 0) {
    console.log('No prize pool to distribute this week');
    return {
      weekStart: currentWeekStart.toISOString(),
      weekEnd: currentWeekEnd.toISOString(),
      totalPool: 0,
      distributions: [],
      distributedAt: new Date().toISOString(),
    };
  }

  // Parse entries
  const entries: Array<{ playerId: string; score: number; rank: number }> = [];
  for (let i = 0; i < top100Raw.length; i += 2) {
    entries.push({
      playerId: top100Raw[i],
      score: parseFloat(top100Raw[i + 1]),
      rank: Math.floor(i / 2) + 1,
    });
  }

  // Resolve player metadata
  const playerMetas = await Promise.all(
    entries.map((e) => getPlayerMeta(e.playerId))
  );

  // Calculate distributions
  const distributions: PrizeDistribution[] = entries.map((entry, i) => {
    const amount = calculatePrizeEstimate(entry.rank, totalPool);
    let percentage = 0;
    if (entry.rank === 1) percentage = 20;
    else if (entry.rank === 2) percentage = 15;
    else if (entry.rank === 3) percentage = 10;
    else {
      const totalWeight = 4753; // sum 1..97
      const playerWeight = 101 - entry.rank;
      percentage = 55 * (playerWeight / totalWeight);
    }

    return {
      playerId: entry.playerId,
      username: playerMetas[i]?.username || `Player_${entry.playerId.slice(0, 6)}`,
      rank: entry.rank,
      amount,
      percentage,
    };
  });

  // Persist to PostgreSQL in a transaction
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const weekStartStr = currentWeekStart.toISOString().split('T')[0];
    const weekEndStr = currentWeekEnd.toISOString().split('T')[0];

    // Create prize pool record
    const poolRes = await client.query(
      `INSERT INTO prize_pools (week_start, week_end, total_pool, distributed, distributed_at)
       VALUES ($1, $2, $3, TRUE, NOW())
       ON CONFLICT (week_start) DO UPDATE
       SET total_pool = EXCLUDED.total_pool, distributed = TRUE, distributed_at = NOW()
       RETURNING id`,
      [weekStartStr, weekEndStr, totalPool]
    );
    const prizePoolId = poolRes.rows[0].id;

    // Save snapshots and transactions
    for (const dist of distributions) {
      const entry = entries.find((e) => e.playerId === dist.playerId)!;

      await client.query(
        `INSERT INTO weekly_snapshots
           (player_id, week_start, week_end, rank, score, prize_pool_total, reward_amount, reward_percentage)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          dist.playerId,
          weekStartStr,
          weekEndStr,
          dist.rank,
          entry.score,
          totalPool,
          dist.amount,
          dist.percentage,
        ]
      );

      await client.query(
        `INSERT INTO reward_transactions
           (player_id, prize_pool_id, week_start, rank, amount, status, processed_at)
         VALUES ($1, $2, $3, $4, $5, 'completed', NOW())`,
        [dist.playerId, prizePoolId, weekStartStr, dist.rank, dist.amount]
      );

      // Update player total earnings with reward
      await client.query(
        'UPDATE players SET total_earnings = total_earnings + $1 WHERE id = $2',
        [dist.amount, dist.playerId]
      );
    }

    await client.query('COMMIT');
    console.log(`Prize distributions saved: ${distributions.length} players`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Reset Redis leaderboard and prize pool
  const pipeline = redis.pipeline();
  pipeline.del(REDIS_KEYS.LEADERBOARD);
  pipeline.set(REDIS_KEYS.PRIZE_POOL, '0');
  pipeline.set(REDIS_KEYS.WEEK_START, new Date().toISOString());
  await pipeline.exec();

  const result: WeeklyRewardResult = {
    weekStart: currentWeekStart.toISOString(),
    weekEnd: currentWeekEnd.toISOString(),
    totalPool,
    distributions,
    distributedAt: new Date().toISOString(),
  };

  // Log to MongoDB
  WeekResetLog.create({
    weekStart: currentWeekStart.toISOString().split('T')[0],
    weekEnd: currentWeekEnd.toISOString().split('T')[0],
    totalPlayers: entries.length,
    totalPool,
    distributionsCount: distributions.length,
    processedAt: new Date(),
    status: 'success',
  }).catch((err) => console.error('Failed to log week reset:', err));

  console.log(
    `Weekly distribution complete in ${Date.now() - startTime}ms. ` +
    `Pool: $${totalPool.toFixed(2)}, Recipients: ${distributions.length}`
  );

  return result;
};
