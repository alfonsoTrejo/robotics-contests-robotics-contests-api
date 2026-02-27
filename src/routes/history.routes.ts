import { Router } from "express";
import { HistoryController } from "../controllers/history.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();

router.get("/me", authMiddleware, roleMiddleware(["STUDENT"]), HistoryController.myHistory);

export default router;
