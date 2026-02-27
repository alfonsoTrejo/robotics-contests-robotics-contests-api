import { Router } from "express";
import { CertificatesController } from "../controllers/certificates.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();

// ADMIN o STUDENT (si es miembro del equipo ganador)
router.get(
  "/winner/:winnerId",
  authMiddleware,
  roleMiddleware(["ADMIN", "STUDENT"]),
  CertificatesController.getWinnerCertificate
);

export default router;
