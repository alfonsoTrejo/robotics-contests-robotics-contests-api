import { Router } from "express";
import contestsRoutes from "./contests.routes";
import modalitiesRoutes from "./modalities.routes";
import type { StatusResponse } from "../types/status.types";

const router = Router();


router.use("/contests", contestsRoutes);
router.use("/modalities", modalitiesRoutes);

export default router;