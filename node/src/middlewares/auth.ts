import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@/core/errors";
import { ERROR_USER_NOT_AUTHENTICATED } from "@/core/messages";

declare global {
  namespace Express {
    interface Request {
      user_id?: string;
    }
  }
}

export default function auth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.header("Authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return next(new UnauthorizedError(ERROR_USER_NOT_AUTHENTICATED));
  }
  // TODO produção: const payload = jwt.verify(token, JWT_SECRET); req.user_id = payload.sub;
  req.user_id = header.slice(7).trim();
  next();
}
