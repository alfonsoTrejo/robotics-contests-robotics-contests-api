import type { Request, Response, NextFunction } from "express";
import { getCookieName, verifyJwt } from "../utils/jwt";

export interface JwtPayload {
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const cookieName = getCookieName();
    const token = req.cookies?.[cookieName];

    if (!token) {
      return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
    }

    const payload = verifyJwt(token) as JwtPayload;
    req.user = payload;

    return next();
  } catch {
    return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
  }
}