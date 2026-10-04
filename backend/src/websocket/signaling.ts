import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UserSessionPayload } from '../common/types';

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

      // Check optional query token in handshake: /ws?token=...
      try {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const queryToken = url.searchParams.get('token');
        if (queryToken) {
          const decoded = jwt.verify(queryToken, config.jwtAccessSecret) as UserSessionPayload;
          currentUserId = decoded.userId;
          this.clients.set(currentUserId, ws);
          ws.send(JSON.stringify({ event: 'auth:identified', success: true, userId: currentUserId }));
        }
      } catch {
        // Query token invalid or not present; wait for auth:identify event
      }

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          const { event, payload } = data;

          switch (event) {
            case 'auth:identify': {
              const token = payload?.token;
              if (!token) {
                ws.send(JSON.stringify({ event: 'auth:error', error: 'Authentication token required' }));
                break;
              }

              try {
                const decoded = jwt.verify(token, config.jwtAccessSecret) as UserSessionPayload;
                if (payload.userId && payload.userId !== decoded.userId) {
                  ws.send(JSON.stringify({ event: 'auth:error', error: 'User ID does not match token' }));
                  break;
                }
                currentUserId = decoded.userId;
                this.clients.set(currentUserId, ws);
                ws.send(JSON.stringify({ event: 'auth:identified', success: true, userId: currentUserId }));
              } catch {
                ws.send(JSON.stringify({ event: 'auth:error', error: 'Invalid or expired authentication token' }));
              }
              break;
            }

            case 'auth:logout': {
              if (currentUserId) {
                this.clients.delete(currentUserId);
                currentUserId = null;
              }
              ws.send(JSON.stringify({ event: 'auth:logged_out', success: true }));
              break;
            }

            case 'call:invite':
            case 'call:accept':
            case 'call:reject':
            case 'call:signal:offer':
            case 'call:signal:answer':
            case 'call:signal:ice':
            case 'call:end': {
              if (!currentUserId) {
                ws.send(JSON.stringify({ event: 'error', error: 'Authentication required for signaling' }));
                break;
              }

              const targetUserId = payload?.targetUserId;
              if (!targetUserId) {
                ws.send(JSON.stringify({ event: 'error', error: 'targetUserId is required' }));
                break;
              }

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
        if (currentUserId && this.clients.get(currentUserId) === ws) {
          this.clients.delete(currentUserId);
        }
      });
    });
  }

  public getConnectedUserCount(): number {
    return this.clients.size;
  }
}

