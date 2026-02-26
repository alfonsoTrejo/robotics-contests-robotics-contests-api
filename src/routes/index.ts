import { Router } from "express";
import contestsRoutes from "./contests.routes";
import modalitiesRoutes from "./modalities.routes";
import teamsRoutes from "./teams.routes";
import authRoutes from "./auth.routes";
import winnersRoutes from "./winners.routes";
import devRoutes from "./dev.routes";

const router = Router();


router.use("/contests", contestsRoutes);
router.use("/modalities", modalitiesRoutes);
router.use("/teams", teamsRoutes);
router.use("/auth", authRoutes);
router.use("/winners", winnersRoutes);

// Dev helpers (solo en no-producción)
router.use("/dev", devRoutes);

export default router;