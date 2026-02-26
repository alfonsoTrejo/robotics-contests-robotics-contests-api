import { Router } from "express";
import { WinnersController } from "../controllers/winners.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();

// Público - consultar ganadores
router.get("/:id", WinnersController.get);
router.get("/modality/:modalityId", WinnersController.getByModality);
router.get("/contest/:contestId", WinnersController.getByContest);

// ADMIN only - asignar, editar, eliminar ganadores
router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), WinnersController.create);
router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN"]), WinnersController.update);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), WinnersController.remove);

export default router;
