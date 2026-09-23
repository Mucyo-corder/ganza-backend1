export interface GanzaEvent {
  type: string;
  payload: unknown;
  timestamp: string;
  deviceId?: string;
  traceId?: string;
}

type Handler = (event: GanzaEvent) => void | Promise<void>;

export class EventBus {
  private handlers: Map<string, Handler[]> = new Map();
  private wildcard: Handler[] = [];
  private history: GanzaEvent[] = [];

  subscribe(type: string, handler: Handler) {
    if (type === '*') {
      this.wildcard.push(handler);
      return;
    }
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  publish(event: GanzaEvent) {
    this.history.push(event);
    if (this.history.length > 500) this.history.shift();
    const handlers = this.handlers.get(event.type) ?? [];
    for (const h of [...handlers, ...this.wildcard]) {
      try {
        const res = h(event);
        if (res instanceof Promise) res.catch(() => {});
      } catch {}
    }
  }

  getHistory(limit = 50): GanzaEvent[] {
    return this.history.slice(-limit);
  }

  clear() {
    this.history = [];
  }
}
