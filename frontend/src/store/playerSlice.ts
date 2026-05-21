import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import type { PlayerState } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface LoginCredentials { email: string; password: string; }
interface RegisterCredentials { username: string; email: string; password: string; country?: string; }

export const loginPlayer = createAsyncThunk(
  'player/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/players/login`, credentials);
      return res.data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error || 'Login failed');
      }
      return rejectWithValue('Network error');
    }
  }
);

export const loginDemoPlayer = createAsyncThunk(
  'player/loginDemo',
  async (_, { dispatch }) => {
    return dispatch(loginPlayer({
      email: 'demo@leaderboard.com',
      password: 'password123',
    }));
  }
);

export const registerPlayer = createAsyncThunk(
  'player/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/players/register`, credentials);
      return res.data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error || 'Registration failed');
      }
      return rejectWithValue('Network error');
    }
  }
);

export const addEarnings = createAsyncThunk(
  'player/addEarnings',
  async (earnings: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { player: PlayerState };
      const res = await axios.post(
        `${API_BASE}/leaderboard/score`,
        { earnings },
        { headers: { Authorization: `Bearer ${state.player.token}` } }
      );
      return res.data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error || 'Failed to update score');
      }
      return rejectWithValue('Network error');
    }
  }
);

// Persist token in localStorage
const STORAGE_KEY = 'leaderboard_auth';
const loadPersistedState = (): Partial<PlayerState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const persisted = loadPersistedState();

const initialState: PlayerState = {
  id: persisted.id || null,
  username: persisted.username || null,
  email: persisted.email || null,
  avatarUrl: persisted.avatarUrl || null,
  country: persisted.country || null,
  token: persisted.token || null,
  totalEarnings: persisted.totalEarnings || 0,
  isAuthenticated: !!(persisted.token && persisted.id),
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    logout: (state) => {
      state.id = null;
      state.username = null;
      state.email = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(STORAGE_KEY);
    },
    setDemoPlayer: (state) => {
      // Set a demo mode without real auth
      state.id = 'demo-player-00000000-0000-0000-0000-000000000001';
      state.username = 'YouAreHere';
      state.country = 'TR';
      state.isAuthenticated = true;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    const handleAuthSuccess = (state: PlayerState, payload: {
      token: string;
      player: { id: string; username: string; email: string; avatarUrl?: string; country?: string; totalEarnings: number };
    }) => {
      state.id = payload.player.id;
      state.username = payload.player.username;
      state.email = payload.player.email;
      state.avatarUrl = payload.player.avatarUrl || null;
      state.country = payload.player.country || null;
      state.token = payload.token;
      state.totalEarnings = payload.player.totalEarnings;
      state.isAuthenticated = true;

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: state.id,
        username: state.username,
        email: state.email,
        avatarUrl: state.avatarUrl,
        country: state.country,
        token: state.token,
        totalEarnings: state.totalEarnings,
      }));
    };

    builder
      .addCase(loginPlayer.fulfilled, (state, action) => {
        handleAuthSuccess(state, action.payload);
      })
      .addCase(registerPlayer.fulfilled, (state, action) => {
        handleAuthSuccess(state, action.payload);
      })
      .addCase(addEarnings.fulfilled, (state, action) => {
        state.totalEarnings += action.meta.arg;
      });
  },
});

export const { logout, setDemoPlayer } = playerSlice.actions;
export default playerSlice.reducer;
