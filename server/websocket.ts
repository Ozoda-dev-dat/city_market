import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";

let wss: WebSocketServer | null = null;

const userSockets = new Map<string, Set<WebSocket>>();

export function setupWebSocket(httpServer: Server): void {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    let userId: string | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "auth" && msg.userId) {
          userId = msg.userId;
          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }
          userSockets.get(userId)!.add(ws);
        }
      } catch (_) {}
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
