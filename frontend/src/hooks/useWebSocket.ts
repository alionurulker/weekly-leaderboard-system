import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setWsConnected,
  updateFromWebSocket,
  updatePlayerRankFromWs,
  weekReset,
  fetchLeaderboard,
} from '../store/leaderboardSlice';
import type { WebSocketMessage } from '../../../shared/types/index';

const WS_BASE = import.meta.env.VITE_WS_URL || (
  typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    : 'ws://localhost:3001/ws'
);

export const useWebSocket = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.player.token);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 5;

  const cleanup = useCallback(() => {
    if (pingTimer.current) clearInterval(pingTimer.current);
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();

    const url = token ? `${WS_BASE}?token=${encodeURIComponent(token)}` : WS_BASE;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch(setWsConnected(true));
      retryCount.current = 0;

      // Send periodic pings to keep connection alive
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 25_000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WebSocketMessage;

        switch (msg.type) {
          case 'LEADERBOARD_UPDATE': {
            const payload = msg.payload as {
              top100: import('../../../shared/types/index').LeaderboardEntry[];
              prizePool: number;
              totalPlayers: number;
            };
            dispatch(updateFromWebSocket({
              top100: payload.top100,
              prizePool: payload.prizePool,
              totalPlayers: payload.totalPlayers,
            }));
            break;
          }
          case 'PLAYER_SCORE_UPDATE': {
            const payload = msg.payload as { newRank: number; newScore: number; prizePool: number };
            dispatch(updatePlayerRankFromWs(payload));
            break;
          }
          case 'WEEK_RESET': {
            dispatch(weekReset());
            // Re-fetch after reset
            setTimeout(() => dispatch(fetchLeaderboard()), 1000);
            break;
          }
          default:
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      dispatch(setWsConnected(false));
    };

    ws.onclose = () => {
      dispatch(setWsConnected(false));
      if (pingTimer.current) clearInterval(pingTimer.current);

      // Exponential backoff reconnection
      if (retryCount.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30_000);
        retryCount.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };
  }, [token, dispatch, cleanup]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  const sendScore = useCallback((earnings: number) => {
    // Score updates go through REST API, not WebSocket
    void earnings;
  }, []);

  return { sendScore };
};
