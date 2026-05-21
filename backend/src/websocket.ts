import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { verifyToken } from './services/playerService';
import type { WebSocketMessage } from './types/shared';

interface AuthenticatedWebSocket extends WebSocket {
  playerId?: string;
  isAlive: boolean;
}

let wss: WebSocketServer;
const playerConnections = new Map<string, Set<AuthenticatedWebSocket>>();

export const initWebSocketServer = (httpServer: Server): void => {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    ws.isAlive = true;

    // Try to authenticate via query param token
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (token) {
      try {
        const payload = verifyToken(token);
        ws.playerId = payload.playerId;

        if (!playerConnections.has(payload.playerId)) {
          playerConnections.set(payload.playerId, new Set());
        }
        playerConnections.get(payload.playerId)!.add(ws);
      } catch {
        // Anonymous connection, can still receive broadcasts
      }
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        // Handle ping/pong keep-alive from client
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', payload: { serverTime: new Date().toISOString() } }));
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      if (ws.playerId) {
        const connections = playerConnections.get(ws.playerId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            playerConnections.delete(ws.playerId);
          }
        }
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    // Send initial connection confirmation
    ws.send(
      JSON.stringify({
        type: 'CONNECTED',
        payload: {
          authenticated: !!ws.playerId,
          serverTime: new Date().toISOString(),
        },
      })
    );
  });

  // Heartbeat: ping all clients every 30s, close dead ones
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as AuthenticatedWebSocket;
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('WebSocket server initialized');
};

export const broadcastToAll = (message: WebSocketMessage): void => {
  if (!wss) return;
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

export const broadcastToPlayer = (playerId: string, message: WebSocketMessage): void => {
  const connections = playerConnections.get(playerId);
  if (!connections) return;
  const payload = JSON.stringify(message);
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
};

export const getConnectedCount = (): number => {
  return wss?.clients.size ?? 0;
};
