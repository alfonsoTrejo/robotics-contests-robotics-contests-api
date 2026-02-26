import { Router } from "express";
import { TeamsController } from "../controllers/teams.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();

// Público/ADMIN útil (luego lo restringimos)
router.get("/", TeamsController.list);
router.get("/:id", TeamsController.get);

// Student (requiere login)
router.get("/my", authMiddleware, roleMiddleware(["STUDENT"]), TeamsController.myTeams);

// Crear team (Student)
router.post("/", authMiddleware, roleMiddleware(["STUDENT"]), TeamsController.create);

// borrar (ADMIN)
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), TeamsController.remove);

export default router;