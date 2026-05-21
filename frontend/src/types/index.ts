export type { LeaderboardEntry, LeaderboardResponse, Player, WebSocketMessage } from '../../../shared/types/index';

export interface LeaderboardState {
  top100: import('../../../shared/types/index').LeaderboardEntry[];
  currentPlayer: import('../../../shared/types/index').LeaderboardResponse['currentPlayer'];
  prizePool: number;
  totalPlayers: number;
  weekStart: string | null;
  weekEnd: string | null;
  nextResetAt: string | null;
  serverTime: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  wsConnected: boolean;
}

export interface PlayerState {
  id: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  country: string | null;
  token: string | null;
  totalEarnings: number;
  isAuthenticated: boolean;
}

export interface RootState {
  leaderboard: LeaderboardState;
  player: PlayerState;
}
