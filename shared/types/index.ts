export interface Player {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  country?: string;
  totalEarnings: number;
  weeklyScore: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  avatarUrl?: string;
  country?: string;
  score: number;
  prizeEstimate: number;
  change?: number; // rank change since last check
  isCurrentPlayer?: boolean;
}

export interface LeaderboardResponse {
  top100: LeaderboardEntry[];
  currentPlayer: {
    entry: LeaderboardEntry;
    surrounding: LeaderboardEntry[];
    isInTop100: boolean;
  } | null;
  prizePool: number;
  totalPlayers: number;
  weekStart: string;
  weekEnd: string;
  nextResetAt: string;
  serverTime: string;
}

export interface ScoreUpdateRequest {
  playerId: string;
  earnings: number;
}

export interface ScoreUpdateResponse {
  newScore: number;
  newRank: number;
  prizePool: number;
}

export interface PrizeDistribution {
  playerId: string;
  username: string;
  rank: number;
  amount: number;
  percentage: number;
}

export interface WeeklyRewardResult {
  weekStart: string;
  weekEnd: string;
  totalPool: number;
  distributions: PrizeDistribution[];
  distributedAt: string;
}

export interface WebSocketMessage {
  type:
    | 'LEADERBOARD_UPDATE'
    | 'PRIZE_POOL_UPDATE'
    | 'RANK_CHANGE'
    | 'WEEK_RESET'
    | 'PLAYER_SCORE_UPDATE';
  payload: unknown;
}

export interface PRIZE_TIERS {
  rank: number;
  percentage: number;
}

export const PRIZE_DISTRIBUTION_RULES = {
  POOL_PERCENTAGE: 0.02, // 2% of earnings go to prize pool
  TOP_3: [
    { rank: 1, percentage: 0.20 },
    { rank: 2, percentage: 0.15 },
    { rank: 3, percentage: 0.10 },
  ],
  RANK_4_TO_100_POOL: 0.55, // 55% split among ranks 4-100
  TOP_REWARDED: 100,
};
