import { Router } from "express";
import { ModalitiesController } from "../controllers/modalities.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();

// público
router.get("/", ModalitiesController.list);
router.get("/:id", ModalitiesController.get);

// útil para frontend: modalidades de un contest
router.get("/by-contest/:contestId", ModalitiesController.listByContest);

// ADMIN only
router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), ModalitiesController.create);
router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN"]), ModalitiesController.update);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), ModalitiesController.remove);

export default router;