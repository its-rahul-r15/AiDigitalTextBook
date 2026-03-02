import { Router } from "express";
import * as gamificationController from "../controllers/gamification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/profile", protect, gamificationController.getGamificationProfile);
router.get("/badges", protect, gamificationController.getBadges);
router.get("/streak", protect, gamificationController.getStreak);

export default router;
