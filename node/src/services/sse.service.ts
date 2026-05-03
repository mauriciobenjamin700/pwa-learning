import { Response } from "express";
import { randomUUID } from "node:crypto";
import { SSEEvent } from "@/types/sse";

const HEARTBEAT_INTERVAL_MS = 25_000;

function serialize(event: SSEEvent): string {
  const payload = { ...event, message_id: event.message_id ?? randomUUID() };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

class SSEManager {
  private clients = new Map<string, Set<Response>>();

  add(user_id: string, res: Response): void {
    const set = this.clients.get(user_id) ?? new Set<Response>();
    set.add(res);
    this.clients.set(user_id, set);

    const heartbeat = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        clearInterval(heartbeat);
        this.remove(user_id, res);
      }
    }, HEARTBEAT_INTERVAL_MS);

    res.on("close", () => {
      clearInterval(heartbeat);
      this.remove(user_id, res);
    });
  }

  private remove(user_id: string, res: Response): void {
    const set = this.clients.get(user_id);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) this.clients.delete(user_id);
  }

  emit(user_id: string, event: SSEEvent): number {
    const set = this.clients.get(user_id);
    if (!set) return 0;
    const data = serialize(event);
    let delivered = 0;
    for (const res of set) {
      try {
        res.write(data);
        delivered++;
      } catch {
        this.remove(user_id, res);
      }
    }
    return delivered;
  }

  broadcast(event: SSEEvent): number {
    const data = serialize(event);
    let delivered = 0;
    for (const set of this.clients.values()) {
      for (const res of set) {
        try {
          res.write(data);
          delivered++;
        } catch {
          // close handler limpa
        }
      }
    }
    return delivered;
  }

  countConnections(): number {
    let total = 0;
    for (const set of this.clients.values()) total += set.size;
    return total;
  }
}

const sseManager = new SSEManager();
export default sseManager;
