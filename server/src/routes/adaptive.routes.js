import { Router } from "express";
import * as adaptiveController from "../controllers/adaptive.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/state", protect, adaptiveController.getAdaptiveState);
router.get("/next-concept", protect, adaptiveController.getNextConcept);        // AI dummy recommendation
router.get("/difficulty-history", protect, adaptiveController.getDifficultyHistory);
// Internal route — called by Bull job, not by the frontend
router.post("/update", protect, adaptiveController.triggerAdaptiveUpdate);

export default router;
