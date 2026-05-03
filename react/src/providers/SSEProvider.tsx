import { useEffect, useRef } from "react";
import { env } from "@/core/env";
import RequestHandler from "@/core/requests";
import { useTokenStore } from "@/store/useTokenStore";
import { useSSEStore } from "@/store/useSSEStore";

const RECONNECT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 60_000;

interface ServerEvent {
  type: string;
  payload: unknown;
  message_id?: string;
}

export default function SSEProvider({ children }: { children: React.ReactNode }) {
  const token = useTokenStore((s) => s.token);
  const addMessage = useSSEStore((s) => s.addMessage);
  const abortRef = useRef<AbortController | null>(null);
  const lastSeenRef = useRef<number>(Date.now());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) {
      abortRef.current?.abort();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      return;
    }

    let cancelled = false;

    const scheduleReconnect = (): void => {
      if (reconnectTimerRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!cancelled) connect();
      }, RECONNECT_INTERVAL_MS);
    };

    const connect = async (): Promise<void> => {
      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const stream = await RequestHandler.getStream(
          `${env.API_URL}/sse/stream`,
          token,
          { signal: abortRef.current.signal },
        );
        lastSeenRef.current = Date.now();

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) throw new Error("Stream encerrada");

          lastSeenRef.current = Date.now();
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const raw of lines) {
            const line = raw.trim();
            if (!line || line.startsWith(":")) continue;

            let dataLine = line;
            while (dataLine.startsWith("data:")) {
              dataLine = dataLine.replace(/^data:\s*/, "").trim();
            }

            try {
              const json = JSON.parse(dataLine) as ServerEvent;
              addMessage({
                message_id: json.message_id ?? crypto.randomUUID(),
                type: json.type,
                payload: json.payload,
                receivedAt: Date.now(),
              });
            } catch (err) {
              if (env.DEV_MODE) console.warn("SSE inválido:", dataLine, err);
            }
          }
        }
      } catch {
        if (abortRef.current?.signal.aborted) return;
        if (!cancelled) scheduleReconnect();
      }
    };

    const heartbeat = setInterval(() => {
      if (Date.now() - lastSeenRef.current > HEARTBEAT_TIMEOUT_MS) {
        abortRef.current?.abort();
      }
    }, 5_000);

    connect();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      clearInterval(heartbeat);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [token, addMessage]);

  return <>{children}</>;
}
