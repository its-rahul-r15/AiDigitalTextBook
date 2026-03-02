import { Router } from "express";
import * as tutorController from "../controllers/tutor.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// All tutor routes are student-only and call aiTutor.service.js (DUMMY AI currently)
router.post("/ask", protect, tutorController.askTutor);           // Main Q&A
router.post("/explain", protect, tutorController.explainConcept);     // visual/story/steps/analogy
router.post("/simplify", protect, tutorController.simplifyExplanation);// Simpler re-explanation
router.post("/translate", protect, tutorController.translateExplanation);// Language translation
router.post("/relevance", protect, tutorController.explainRelevance);   // "Why am I learning this?"

export default router;
