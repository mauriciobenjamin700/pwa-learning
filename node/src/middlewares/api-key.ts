import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@/core/errors";
import { ERROR_INVALID_API_KEY } from "@/core/messages";
import settings from "@/core/settings";

export default function apiKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const key = req.header("x-api-key");
  if (!key || key !== settings.WEBPUSH_API_KEY) {
    return next(new UnauthorizedError(ERROR_INVALID_API_KEY));
  }
  next();
}
