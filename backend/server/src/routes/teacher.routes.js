import { Router } from "express";
import * as teacherController from "../controllers/teacher.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allow } from "../middleware/roleGuard.middleware.js";

const router = Router();

// All routes require teacher or admin role
router.get("/class", protect, allow("teacher", "admin"), teacherController.getClass);
router.post("/class", protect, allow("teacher", "admin"), teacherController.createClass);
router.post("/class/:id/enroll", protect, allow("teacher", "admin"), teacherController.enrollStudents);
router.get("/override", protect, allow("teacher", "admin"), teacherController.getOverrides);
router.post("/override", protect, allow("teacher", "admin"), teacherController.setOverride);
router.delete("/override/:overrideIndex", protect, allow("teacher", "admin"), teacherController.deleteOverride);
router.get("/student/:id", protect, allow("teacher", "admin"), teacherController.getStudentProfile);

export default router;
