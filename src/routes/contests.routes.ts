import { Router } from "express";
import { ContestsController } from "../controllers/contests.controller";

const router = Router();

// Público
router.get("/", ContestsController.list);
router.get("/:id", ContestsController.get);

// Por ahora sin auth (luego metemos RBAC)
router.post("/", ContestsController.create);
router.patch("/:id", ContestsController.update);
router.delete("/:id", ContestsController.remove);

export default router;