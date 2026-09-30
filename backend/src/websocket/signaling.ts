import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface ClientConnection {
  userId: string;
  ws: WebSocket;
}

export class SignalingServer {
  private wss: WebSocketServer;
  private clients = new Map<string, WebSocket>();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.init();
  }

  private init(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      let currentUserId: string | null = null;

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          const { event, payload } = data;

          switch (event) {
            case 'auth:identify': {
              currentUserId = payload.userId;
              if (currentUserId) {
                this.clients.set(currentUserId, ws);
                ws.send(JSON.stringify({ event: 'auth:identified', success: true }));
              }
              break;
            }

            case 'call:invite':
            case 'call:accept':
            case 'call:reject':
            case 'call:signal:offer':
            case 'call:signal:answer':
            case 'call:signal:ice':
            case 'call:end': {
              const targetUserId = payload.targetUserId;
              const targetWs = this.clients.get(targetUserId);
              if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({
                  event,
                  payload: { ...payload, fromUserId: currentUserId },
                }));
              }
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.error('WebSocket message parsing error:', err);
        }
      });

      ws.on('close', () => {
        if (currentUserId) {
          this.clients.delete(currentUserId);
        }
      });
    });
  }

  public getConnectedUserCount(): number {
    return this.clients.size;
  }
}
