import type { Request, Response, NextFunction } from "express";
import { TeamsService } from "../services/teams.service";

const service = new TeamsService();

export class TeamsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { contestId, modalityId } = req.query as { contestId?: string; modalityId?: string };
      const data = await service.list({ contestId, modalityId });
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.get(req.params.id as string);
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async myTeams(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId ) {
        return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
      }
      const data = await service.myTeams(req.user.userId as string);
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async findStudentByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
      }

      const email = String(req.query.email ?? "");
      const data = await service.findStudentByEmail(email, req.user.userId as string);

      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
      }
      const data = await service.create({
        ...req.body,
        requesterUserId: req.user.userId,
      });
      res.status(201).json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.remove(req.params.id as string);
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }
}