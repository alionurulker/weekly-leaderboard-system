import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlayerState {
  isAuthenticated: boolean;
  id: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  country: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  country?: string;
  avatarUrl?: string;
}

interface AuthSuccessData {
  token: string;
  player: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    country?: string;
  };
}

interface EarningsResult {
  newScore: number;
  newRank: number;
  prizePool: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'leaderboard_token';

const saveToken = (token: string) => {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
};

const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

export const getSavedToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Thunks ──────────────────────────────────────────────────────────────────

/** Log in with email + password via POST /api/players/login */
export const loginWithCredentials = createAsyncThunk<
  AuthSuccessData,
  LoginPayload,
  { rejectValue: string }
>(
  'player/loginWithCredentials',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<{ success: boolean; data: AuthSuccessData }>(
        `${API_BASE}/players/login`,
        payload
      );
      return data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error || 'Login failed');
      }
      return rejectWithValue('Login failed');
    }
  }
);

/** Register a new player via POST /api/players/register */
export const registerPlayer = createAsyncThunk<
  AuthSuccessData,
  RegisterPayload,
  { rejectValue: string }
>(
  'player/registerPlayer',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<{ success: boolean; data: AuthSuccessData }>(
        `${API_BASE}/players/register`,
        payload
      );
      return data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error || 'Registration failed');
      }
      return rejectWithValue('Registration failed');
    }
  }
);

/** Add earnings for the authenticated player via POST /api/leaderboard/score */
export const addEarnings = createAsyncThunk<
  EarningsResult,
  number,
  { rejectValue: string; state: { player: PlayerState } }
>(
  'player/addEarnings',
  async (earnings, { getState, rejectWithValue }) => {
    const { token, id } = getState().player;
    if (!token || !id) return rejectWithValue('Not authenticated');
    try {
      const { data } = await axios.post<{ success: boolean; data: EarningsResult }>(
        `${API_BASE}/leaderboard/score`,
        { earnings },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error || 'Failed to add earnings');
      }
      return rejectWithValue('Failed to add earnings');
    }
  }
);

/** Demo login — creates a guest session using the seeded demo account */
export const loginDemoPlayer = createAsyncThunk<AuthSuccessData, void, { rejectValue: string }>(
  'player/loginDemoPlayer',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<{ success: boolean; data: AuthSuccessData }>(
        `${API_BASE}/players/login`,
        { email: 'demo@leaderboard.com', password: 'password123' }
      );
      return data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error || 'Demo login failed');
      }
      return rejectWithValue('Demo login failed');
    }
  }
);

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState: PlayerState = {
  isAuthenticated: false,
  id: null,
  username: null,
  email: null,
  avatarUrl: null,
  country: null,
  token: null,
  loading: false,
  error: null,
};

// ─── Helper: apply auth success to state ─────────────────────────────────────
const applyAuthSuccess = (state: PlayerState, data: AuthSuccessData) => {
  state.isAuthenticated = true;
  state.id = data.player.id;
  state.username = data.player.username;
  state.email = data.player.email;
  state.avatarUrl = data.player.avatarUrl ?? null;
  state.country = data.player.country ?? null;
  state.token = data.token;
  state.loading = false;
  state.error = null;
  saveToken(data.token);
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.id = null;
      state.username = null;
      state.email = null;
      state.avatarUrl = null;
      state.country = null;
      state.token = null;
      state.error = null;
      clearToken();
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── loginWithCredentials ──────────────────────────────────────────────────
    builder
      .addCase(loginWithCredentials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, { payload }) => {
        applyAuthSuccess(state, payload);
      })
      .addCase(loginWithCredentials.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload ?? 'Login failed';
      });

    // ── registerPlayer ────────────────────────────────────────────────────────
    builder
      .addCase(registerPlayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerPlayer.fulfilled, (state, { payload }) => {
        applyAuthSuccess(state, payload);
      })
      .addCase(registerPlayer.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload ?? 'Registration failed';
      });

    // ── addEarnings ───────────────────────────────────────────────────────────
    // Score/rank state updates arrive via WebSocket PLAYER_SCORE_UPDATE;
    // we only track loading/error here.
    builder
      .addCase(addEarnings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEarnings.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(addEarnings.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload ?? 'Failed to add earnings';
      });

    // ── loginDemoPlayer ───────────────────────────────────────────────────────
    builder
      .addCase(loginDemoPlayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginDemoPlayer.fulfilled, (state, { payload }) => {
        applyAuthSuccess(state, payload);
      })
      .addCase(loginDemoPlayer.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload ?? 'Demo login failed';
      });
  },
});

export const { logout, setError } = playerSlice.actions;
export default playerSlice.reducer;