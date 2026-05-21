import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import type { LeaderboardState } from '../types';
import type { LeaderboardResponse } from '../../../shared/types/index';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { player: { token: string | null } };
      const headers: Record<string, string> = {};
      if (state.player.token) {
        headers['Authorization'] = `Bearer ${state.player.token}`;
      }
      const response = await axios.get<{ success: boolean; data: LeaderboardResponse }>(
        `${API_BASE}/leaderboard`,
        { headers }
      );
      return response.data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error || 'Failed to fetch leaderboard');
      }
      return rejectWithValue('Network error');
    }
  }
);

const initialState: LeaderboardState = {
  top100: [],
  currentPlayer: null,
  prizePool: 0,
  totalPlayers: 0,
  weekStart: null,
  weekEnd: null,
  nextResetAt: null,
  serverTime: null,
  loading: false,
  error: null,
  lastUpdated: null,
  wsConnected: false,
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setWsConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
    },
    updateFromWebSocket: (
      state,
      action: PayloadAction<{
        top100?: LeaderboardResponse['top100'];
        prizePool?: number;
        totalPlayers?: number;
      }>
    ) => {
      const { top100, prizePool, totalPlayers } = action.payload;
      if (top100) state.top100 = top100;
      if (prizePool !== undefined) state.prizePool = prizePool;
      if (totalPlayers !== undefined) state.totalPlayers = totalPlayers;
      state.lastUpdated = Date.now();
    },
    updatePlayerRankFromWs: (
      state,
      action: PayloadAction<{ newRank: number; newScore: number; prizePool: number }>
    ) => {
      const { newRank, newScore, prizePool } = action.payload;
      if (state.currentPlayer) {
        state.currentPlayer.entry.rank = newRank;
        state.currentPlayer.entry.score = newScore;
        state.currentPlayer.isInTop100 = newRank <= 100;
      }
      state.prizePool = prizePool;
      state.lastUpdated = Date.now();
    },
    weekReset: (state) => {
      state.top100 = [];
      state.prizePool = 0;
      state.totalPlayers = 0;
      state.lastUpdated = Date.now();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.top100 = action.payload.top100;
        state.currentPlayer = action.payload.currentPlayer;
        state.prizePool = action.payload.prizePool;
        state.totalPlayers = action.payload.totalPlayers;
        state.weekStart = action.payload.weekStart;
        state.weekEnd = action.payload.weekEnd;
        state.nextResetAt = action.payload.nextResetAt;
        state.serverTime = action.payload.serverTime;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setWsConnected,
  updateFromWebSocket,
  updatePlayerRankFromWs,
  weekReset,
  clearError,
} = leaderboardSlice.actions;

export default leaderboardSlice.reducer;
