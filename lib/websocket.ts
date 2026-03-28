import { getApiUrl } from "@/lib/query-client";

type EventHandler = (data?: unknown) => void;

class WsManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldConnect = false;

  private getWsUrl(): string {
    const apiUrl = getApiUrl().replace(/\/$/, "");
    return apiUrl.replace(/^http/, "ws") + "/ws";
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

  private _open(): void {
    try {
      this.ws = new WebSocket(this.getWsUrl());

      this.ws.onopen = () => {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        console.log("[WS] Connected");
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
