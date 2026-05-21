import { getRedisClient, REDIS_KEYS } from '../config/redis';
import { query } from '../config/database';
import { ScoreEvent } from '../config/mongodb';
import { PRIZE_DISTRIBUTION_RULES } from '../types/shared';
import type {
  LeaderboardEntry,
  LeaderboardResponse,
  ScoreUpdateRequest,
  ScoreUpdateResponse,
} from '../types/shared';

interface PlayerMeta {
  username: string;
  avatarUrl?: string;
  country?: string;
}

export const getWeekBounds = (): { weekStart: Date; weekEnd: Date; nextResetAt: Date } => {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysToMonday = day === 0 ? 1 : day === 1 ? 0 : -(day - 1);
  const daysToNextMonday = day === 0 ? 1 : 8 - day;

  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() + daysToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  const nextResetAt = new Date(now);
  nextResetAt.setUTCDate(now.getUTCDate() + daysToNextMonday);
  nextResetAt.setUTCHours(0, 0, 0, 0);

  const weekEnd = new Date(nextResetAt);
  weekEnd.setUTCMilliseconds(-1);

  return { weekStart, weekEnd, nextResetAt };
};

export const calculatePrizeEstimate = (rank: number, prizePool: number): number => {
  if (rank < 1 || rank > 100) return 0;
  if (rank === 1) return prizePool * 0.20;
  if (rank === 2) return prizePool * 0.15;
  if (rank === 3) return prizePool * 0.10;

  // Ranks 4-100: 55% split proportionally by inverse rank weight
  const totalWeight = Array.from({ length: 97 }, (_, i) => 97 - i).reduce((a, b) => a + b, 0); // sum 1..97 = 4753
  const playerWeight = 101 - rank; // rank 4 → 97, rank 100 → 1
  return prizePool * 0.55 * (playerWeight / totalWeight);
};

export const updatePlayerScore = async (
  req: ScoreUpdateRequest
): Promise<ScoreUpdateResponse> => {
  const redis = getRedisClient();
  const { playerId, earnings } = req;

  // Get current state
  const [currentScoreStr, prevPoolStr] = await redis.mget(
    `zscore_cache:${playerId}`,
    REDIS_KEYS.PRIZE_POOL
  );

  const scoreBefore = parseFloat(await redis.zscore(REDIS_KEYS.LEADERBOARD, playerId) || '0');
  const prevPool = parseFloat(prevPoolStr || '0');
  const prizeContribution = earnings * PRIZE_DISTRIBUTION_RULES.POOL_PERCENTAGE;

  // Update Redis atomically using pipeline
  const pipeline = redis.pipeline();
  pipeline.zadd(REDIS_KEYS.LEADERBOARD, 'INCR', earnings, playerId);
  pipeline.incrbyfloat(REDIS_KEYS.PRIZE_POOL, prizeContribution);
  const results = await pipeline.exec();

  const newScore = parseFloat((results?.[0]?.[1] as string) || '0');
  const newPool = parseFloat((results?.[1]?.[1] as string) || '0');

  // Get new rank (0-indexed, so add 1)
  const rankIndex = await redis.zrevrank(REDIS_KEYS.LEADERBOARD, playerId);
  const newRank = rankIndex !== null ? rankIndex + 1 : -1;

  // Get previous rank for change calculation
  const prevRankStr = await redis.get(REDIS_KEYS.PLAYER_PREV_RANK(playerId));
  const prevRank = prevRankStr ? parseInt(prevRankStr) : newRank;
  await redis.setex(REDIS_KEYS.PLAYER_PREV_RANK(playerId), 3600 * 24 * 7, newRank.toString());

  // Log event to MongoDB asynchronously
  const { weekStart } = getWeekBounds();
  ScoreEvent.create({
    playerId,
    username: 'unknown',
    earnings,
    prizeContribution,
    scoreBefore,
    scoreAfter: newScore,
    rankBefore: prevRank,
    rankAfter: newRank,
    weekStart: weekStart.toISOString().split('T')[0],
    timestamp: new Date(),
  }).catch((err) => console.error('Failed to log score event:', err));

  // Update PostgreSQL total earnings asynchronously
  query(
    'UPDATE players SET total_earnings = total_earnings + $1, updated_at = NOW() WHERE id = $2',
    [earnings, playerId]
  ).catch((err) => console.error('Failed to update player earnings:', err));

  return {
    newScore,
    newRank,
    prizePool: newPool,
  };
};

export const cachePlayerMeta = async (
  playerId: string,
  meta: PlayerMeta
): Promise<void> => {
  const redis = getRedisClient();
  await redis.setex(
    REDIS_KEYS.PLAYER_META(playerId),
    3600 * 24 * 7,
    JSON.stringify(meta)
  );
};

export const getPlayerMeta = async (playerId: string): Promise<PlayerMeta | null> => {
  const redis = getRedisClient();
  const data = await redis.get(REDIS_KEYS.PLAYER_META(playerId));
  return data ? JSON.parse(data) : null;
};

const enrichEntries = async (
  entries: Array<{ playerId: string; score: number; rank: number }>,
  prizePool: number
): Promise<LeaderboardEntry[]> => {
  const redis = getRedisClient();

  // Batch fetch metadata from Redis
  const metaKeys = entries.map((e) => REDIS_KEYS.PLAYER_META(e.playerId));
  const prevRankKeys = entries.map((e) => REDIS_KEYS.PLAYER_PREV_RANK(e.playerId));

  const [metas, prevRanks] = await Promise.all([
    metaKeys.length > 0 ? redis.mget(...metaKeys) : Promise.resolve([]),
    prevRankKeys.length > 0 ? redis.mget(...prevRankKeys) : Promise.resolve([]),
  ]);

  return entries.map((entry, i) => {
    const meta: PlayerMeta = metas[i] ? JSON.parse(metas[i]!) : { username: `Player_${entry.playerId.slice(0, 6)}` };
    const prevRank = prevRanks[i] ? parseInt(prevRanks[i]!) : entry.rank;

    return {
      rank: entry.rank,
      playerId: entry.playerId,
      username: meta.username,
      avatarUrl: meta.avatarUrl,
      country: meta.country,
      score: entry.score,
      prizeEstimate: calculatePrizeEstimate(entry.rank, prizePool),
      change: prevRank - entry.rank, // positive = moved up
    };
  });
};

export const getLeaderboard = async (
  currentPlayerId?: string
): Promise<LeaderboardResponse> => {
  const redis = getRedisClient();
  const { weekStart, weekEnd, nextResetAt } = getWeekBounds();

  // Fetch top 100 and prize pool concurrently
  const [top100Raw, prizePoolStr, totalPlayersStr] = await Promise.all([
    redis.zrevrange(REDIS_KEYS.LEADERBOARD, 0, 99, 'WITHSCORES'),
    redis.get(REDIS_KEYS.PRIZE_POOL),
    redis.zcard(REDIS_KEYS.LEADERBOARD),
  ]);

  const prizePool = parseFloat(prizePoolStr || '0');
  const totalPlayers = totalPlayersStr || 0;

  // Parse top100 from flat [id, score, id, score, ...] array
  const top100Parsed: Array<{ playerId: string; score: number; rank: number }> = [];
  for (let i = 0; i < top100Raw.length; i += 2) {
    top100Parsed.push({
      playerId: top100Raw[i],
      score: parseFloat(top100Raw[i + 1]),
      rank: Math.floor(i / 2) + 1,
    });
  }

  const top100 = await enrichEntries(top100Parsed, prizePool);

  // Handle current player context
  let currentPlayerData: LeaderboardResponse['currentPlayer'] = null;

  if (currentPlayerId) {
    const rankIndex = await redis.zrevrank(REDIS_KEYS.LEADERBOARD, currentPlayerId);
    const playerScore = await redis.zscore(REDIS_KEYS.LEADERBOARD, currentPlayerId);

    if (rankIndex !== null && playerScore !== null) {
      const playerRank = rankIndex + 1;
      const isInTop100 = playerRank <= 100;

      if (!isInTop100) {
        // Get surrounding: 3 above + player + 2 below (rank indices)
        const startIndex = Math.max(0, rankIndex - 3);
        const endIndex = Math.min(rankIndex + 2, totalPlayers as number - 1);

        const surroundingRaw = await redis.zrevrange(
          REDIS_KEYS.LEADERBOARD,
          startIndex,
          endIndex,
          'WITHSCORES'
        );

        const surroundingParsed: Array<{ playerId: string; score: number; rank: number }> = [];
        for (let i = 0; i < surroundingRaw.length; i += 2) {
          surroundingParsed.push({
            playerId: surroundingRaw[i],
            score: parseFloat(surroundingRaw[i + 1]),
            rank: startIndex + Math.floor(i / 2) + 1,
          });
        }

        const surroundingEnriched = await enrichEntries(surroundingParsed, prizePool);
        const playerEntry = surroundingEnriched.find((e) => e.playerId === currentPlayerId);

        currentPlayerData = {
          entry: playerEntry || surroundingEnriched[Math.floor(surroundingEnriched.length / 2)],
          surrounding: surroundingEnriched,
          isInTop100: false,
        };
      } else {
        const playerEntry = top100.find((e) => e.playerId === currentPlayerId);
        if (playerEntry) {
          currentPlayerData = {
            entry: playerEntry,
            surrounding: [],
            isInTop100: true,
          };
        }
      }
    }
  }

  // Mark current player in top100
  if (currentPlayerId) {
    top100.forEach((entry) => {
      if (entry.playerId === currentPlayerId) {
        entry.isCurrentPlayer = true;
      }
    });
  }

  return {
    top100,
    currentPlayer: currentPlayerData,
    prizePool,
    totalPlayers: totalPlayers as number,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    nextResetAt: nextResetAt.toISOString(),
    serverTime: new Date().toISOString(),
  };
};
