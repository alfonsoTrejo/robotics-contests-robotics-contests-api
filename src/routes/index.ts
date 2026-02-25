import { Router } from "express";
import contestsRoutes from "./contests.routes";
import type { StatusResponse } from "../types/status.types";

const router = Router();


router.use("/contests", contestsRoutes);

export default router;