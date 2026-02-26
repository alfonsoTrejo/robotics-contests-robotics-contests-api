import { Router } from "express";
import { ContestsController } from "../controllers/contests.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();

// Público
router.get("/", ContestsController.list);
router.get("/:id", ContestsController.get);

// ADMIN only
router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), ContestsController.create);
router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN"]), ContestsController.update);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), ContestsController.remove);

export default router;