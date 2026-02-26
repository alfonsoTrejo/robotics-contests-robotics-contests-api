import { Router } from "express";
import { DevController } from "../controllers/dev.controller";

const router = Router();

// Endpoints de desarrollo para testing (crear usuarios fake)
// Solo se deshabilitan si NODE_ENV === "production"
const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  router.post("/fake-students", DevController.createFakeStudents);
  router.post("/login-fake-student", DevController.loginAsFakeStudent);
  
  console.log("⚠️  Dev endpoints enabled at /api/dev/*");
  console.log("   POST /api/dev/fake-students - Create fake student users");
  console.log("   POST /api/dev/login-fake-student - Login as fake student");
}

export default router;
