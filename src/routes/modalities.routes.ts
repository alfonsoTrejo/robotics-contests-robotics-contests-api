import { Router } from "express";
import { ModalitiesController } from "../controllers/modalities.controller";

const router = Router();

// público
router.get("/", ModalitiesController.list);
router.get("/:id", ModalitiesController.get);

// útil para frontend: modalidades de un contest
router.get("/by-contest/:contestId", ModalitiesController.listByContest);

// por ahora sin auth (luego RBAC ADMIN)
router.post("/", ModalitiesController.create);
router.patch("/:id", ModalitiesController.update);
router.delete("/:id", ModalitiesController.remove);

export default router;