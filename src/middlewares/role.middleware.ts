import type { Request, Response, NextFunction } from "express";

export function roleMiddleware(allowed: Array<"ADMIN" | "STUDENT">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: { message: "Forbidden" } });
    }
    return next();
  };
}