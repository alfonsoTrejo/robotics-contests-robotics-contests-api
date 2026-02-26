import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", AuthController.register); // crea ADMIN local (para bootstrap)
router.post("/login", AuthController.login);       // login ADMIN local
router.post("/google", AuthController.google);     // login STUDENT google

router.get("/me", authMiddleware, AuthController.me);
router.post("/logout", AuthController.logout);

export default router;