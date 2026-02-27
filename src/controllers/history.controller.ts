import type { Request, Response, NextFunction } from "express";
import { HistoryService } from "../services/history.service";

const service = new HistoryService();

export class HistoryController {
  static async myHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
      }
      const data = await service.myHistory(req.user.userId as string);
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }
}
