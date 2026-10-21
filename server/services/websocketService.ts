import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export type RealtimeEventType =
  | 'CENTRE_CREATED'
  | 'CENTRE_UPDATED'
  | 'CENTRE_DELETED'
  | 'CENTRE_REVIEWED'
  | 'REQUEST_CREATED'
  | 'REQUEST_UPDATED'
  | 'REQUEST_DELETED'
  | 'ACTIVITY_CREATED'
  | 'INVENTORY_UPDATED'
  | 'DB_SYNCED';

export interface RealtimeMessage {
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
}

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export const initWebSocketServer = (server: HttpServer): WebSocketServer => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    clients.add(ws);

    // Send initial greeting / connection confirmation
    try {
      ws.send(
        JSON.stringify({
          type: 'CONNECTED',
          message: 'EcoLoop Realtime WebSocket Active (MongoDB Powered)',
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      // Ignore
    }

    ws.on('message', (message: string) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch (e) {
        // Ignore
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  return wss;
};

export const broadcastRealtimeEvent = (type: RealtimeEventType, payload: any) => {
  if (!wss || clients.size === 0) return;

  const message: RealtimeMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  const serialized = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(serialized);
      } catch (err) {
        clients.delete(client);
      }
    }
  });
};

export const getConnectedClientsCount = (): number => {
  return clients.size;
};
