import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import { verifyToken } from "../lib/jwt";

let wss: WebSocketServer | null = null;

const userSockets = new Map<string, Set<WebSocket>>();

export function setupWebSocket(httpServer: Server): void {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    let userId: string | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "auth" && msg.token) {
          const payload = verifyToken(msg.token);
          const newUserId = payload.userId;

          // Remove from old user set before associating with new one
          if (userId && userId !== newUserId) {
            const oldSockets = userSockets.get(userId);
            if (oldSockets) {
              oldSockets.delete(ws);
              if (oldSockets.size === 0) userSockets.delete(userId);
            }
          }

          userId = newUserId;
          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }
          userSockets.get(userId)!.add(ws);
          ws.send(JSON.stringify({ event: "auth-ok", userId }));
        }
      } catch (_) {
        // Invalid token or malformed message — ignore silently
      }
    });

    ws.on("error", () => {});

    ws.on("close", () => {
      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
        }
      }
    });
  });

  console.log("[WS] WebSocket server attached on /ws");
}

export function broadcast(event: string, data?: unknown): void {
  if (!wss) return;
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function sendToUser(userId: string, event: string, data?: unknown): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}
