"use client";

import { useEffect, useRef } from "react";

type EventCallback = (data: any) => void;

class LiveSyncClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private lastEventTimestamps: Map<string, number> = new Map();
  private isConnecting = false;

  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    if (!this.eventSource && !this.isConnecting && typeof window !== "undefined") {
      this.connect();
    }

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private connect() {
    if (this.eventSource || typeof window === "undefined") return;
    this.isConnecting = true;

    try {
      this.eventSource = new EventSource("/api/events");

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.eventSource.onmessage = (e) => {
        try {
          if (!e.data || e.data.trim() === "" || e.data.startsWith(":")) return;
          const data = JSON.parse(e.data);
          if (!data || !data.type || data.type === "connected") return;

          // Debounce: ignore events for the same type within 2 seconds
          const now = Date.now();
          const last = this.lastEventTimestamps.get(data.type) || 0;
          if (now - last < 2000) return;
          this.lastEventTimestamps.set(data.type, now);

          const callbacks = this.listeners.get(data.type);
          if (callbacks) {
            callbacks.forEach((cb) => {
              try {
                cb(data);
              } catch (err) {
                console.error("LiveSync callback error:", err);
              }
            });
          }
        } catch {
          // ignore malformed JSON or ping
        }
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        this.disconnect();
        // Exponential backoff reconnect: 5s, 10s, max 30s
        const delay = Math.min(30000, 5000 * Math.pow(1.5, this.reconnectAttempts++));
        if (this.listeners.size > 0) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => this.connect(), delay);
        }
      };
    } catch {
      this.isConnecting = false;
    }
  }

  private disconnect() {
    clearTimeout(this.reconnectTimeout);
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
  }
}

export const liveSync = new LiveSyncClient();

export function useLiveEvent(eventType: string, onEvent: (data: any) => void) {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    return liveSync.subscribe(eventType, (data) => {
      cbRef.current(data);
    });
  }, [eventType]);
}
