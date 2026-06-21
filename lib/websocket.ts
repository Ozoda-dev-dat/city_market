import { getApiUrl } from "@/lib/query-client";

type EventHandler = (data?: unknown) => void;

class WsManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldConnect = false;
  private authToken: string | null = null;

  private getWsUrl(): string {
    const apiUrl = getApiUrl().replace(/\/$/, "");
    return apiUrl.replace(/^http/, "ws") + "/ws";
  }

  /** Call after login with the JWT so the server can bind this socket to the user. */
  authenticate(token: string): void {
    this.authToken = token;
    this._sendAuth();
  }

  /** Remove auth binding on logout — notifies server to stop targeting this socket. */
  clearAuth(): void {
    this.authToken = null;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "deauth" }));
    }
  }

  connect(): void {
    this.shouldConnect = true;
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }
    this._open();
  }

  disconnect(): void {
    this.shouldConnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  private _sendAuth(): void {
    if (this.authToken && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "auth", token: this.authToken }));
    }
  }

  private _open(): void {
    try {
      this.ws = new WebSocket(this.getWsUrl());

      this.ws.onopen = () => {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        console.log("[WS] Connected");
        // Immediately authenticate if we have a token
        this._sendAuth();
      };

      this.ws.onmessage = (event) => {
        try {
          const { event: evtName, data } = JSON.parse(event.data as string);
          const handlers = this.handlers.get(evtName);
          handlers?.forEach((h) => h(data));
        } catch {}
      };

      this.ws.onclose = () => {
        console.log("[WS] Disconnected");
        if (this.shouldConnect) {
          this.reconnectTimer = setTimeout(() => this._open(), 3000);
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      if (this.shouldConnect) {
        this.reconnectTimer = setTimeout(() => this._open(), 3000);
      }
    }
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }
}

export const wsManager = new WsManager();
