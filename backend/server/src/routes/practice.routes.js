import { Router } from "express";
import * as practiceController from "../controllers/practice.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allow } from "../middleware/roleGuard.middleware.js";

const router = Router();

// ── Teacher routes ────────────────────────────────────────────────────────────
router.post("/", protect, allow("teacher", "admin"), practiceController.createPracticeSet);
router.get("/my-sets", protect, allow("teacher", "admin"), practiceController.getMyPracticeSets);
router.patch("/:id/toggle", protect, allow("teacher", "admin"), practiceController.togglePracticeSet);
router.delete("/:id", protect, allow("teacher", "admin"), practiceController.deletePracticeSet);
router.get("/:id/analytics", protect, allow("teacher", "admin"), practiceController.getPracticeAnalytics);

// ── Student routes ────────────────────────────────────────────────────────────
router.get("/assigned", protect, practiceController.getAssignedPracticeSets);
router.post("/:id/submit", protect, practiceController.submitPracticeSet);
router.get("/:id/result", protect, practiceController.getPracticeResult);

export default router;
