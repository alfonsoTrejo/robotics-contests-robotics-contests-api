import type { Request, Response, NextFunction } from "express";
import { ModalitiesService } from "../services/modalities.service";


const service = new ModalitiesService();

export class ModalitiesController {
  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.list();
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

  static async listByContest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.listByContest(req.params.contestId as string);
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