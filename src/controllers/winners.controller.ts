import type { Request, Response, NextFunction } from "express";
import { WinnersService } from "../services/winners.service";

const service = new WinnersService();

export class WinnersController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.get(req.params.id as string);
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async getByModality(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getByModalityId(req.params.modalityId as string);
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async getByContest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getByContestId(req.params.contestId as string);
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.create(req.body);
      res.status(201).json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.update(req.params.id as string, req.body);
      res.json({ ok: true, data });
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
