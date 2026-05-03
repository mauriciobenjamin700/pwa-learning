import { NextFunction, Request, Response } from "express";
import sseManager from "@/services/sse.service";
import { SSEEvent } from "@/types/sse";
import {
  ERROR_REQUIRED_TYPE,
  SUCCESS_BROADCAST_SENT,
  SUCCESS_EVENT_EMITTED,
} from "@/core/messages";
import { UnprocessableEntityError } from "@/core/errors";

function validate(event: unknown): SSEEvent {
  if (
    !event ||
    typeof event !== "object" ||
    !("type" in event) ||
    typeof (event as SSEEvent).type !== "string" ||
    (event as SSEEvent).type.length === 0
  ) {
    throw new UnprocessableEntityError(ERROR_REQUIRED_TYPE);
  }
  return event as SSEEvent;
}

export default class SSEController {
  static stream(req: Request, res: Response): void {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write(": connected\n\n");
    sseManager.add(req.user_id!, res);
  }

  static emitToUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    try {
      const user_id = String(req.params.user_id ?? "");
      const event = validate(req.body);
      const delivered = sseManager.emit(user_id, event);
      res.json({
        status_code: 200,
        detail: SUCCESS_EVENT_EMITTED,
        delivered,
      });
    } catch (e) {
      next(e);
    }
  }

  static broadcast(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    try {
      const event = validate(req.body);
      const delivered = sseManager.broadcast(event);
      res.json({
        status_code: 200,
        detail: SUCCESS_BROADCAST_SENT,
        delivered,
      });
    } catch (e) {
      next(e);
    }
  }
}
