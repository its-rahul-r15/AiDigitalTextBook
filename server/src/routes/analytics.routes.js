import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allow } from "../middleware/roleGuard.middleware.js";

const router = Router();

// ── Student analytics ─────────────────────────────────────────────────────────
router.get("/progress", protect, analyticsController.getProgress);
router.get("/skills", protect, analyticsController.getSkills);
router.get("/heatmap", protect, analyticsController.getHeatmap);
router.get("/weak-areas", protect, analyticsController.getWeakAreas);  // AI tips (dummy)
router.get("/report/:month", protect, analyticsController.getMonthlyReport);
router.post("/log", protect, analyticsController.logStudyEvent);

// ── Teacher analytics ─────────────────────────────────────────────────────────
router.get("/class", protect, allow("teacher", "admin"), analyticsController.getClassAnalytics);

export default router;
