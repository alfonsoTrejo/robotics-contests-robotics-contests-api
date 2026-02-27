import type { Request, Response, NextFunction } from "express";
import { CertificatesService } from "../services/certificates.service";

const service = new CertificatesService();

export class CertificatesController {
  static async getWinnerCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, filename, winner } = await service.generateWinnerCertificate(
        req.params.winnerId as string
      );

      if (req.user?.role === "STUDENT") {
        const memberIds = winner.team?.members?.map((m: any) => m.userId) ?? [];
        if (!req.user.userId || !memberIds.includes(req.user.userId)) {
          return res.status(403).json({ ok: false, error: { message: "Forbidden" } });
        }
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (e) {
      next(e);
    }
  }
}
