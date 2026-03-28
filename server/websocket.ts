import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";

let wss: WebSocketServer | null = null;

export function setupWebSocket(httpServer: Server): void {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.on("error", () => {});
    ws.on("close", () => {});
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
