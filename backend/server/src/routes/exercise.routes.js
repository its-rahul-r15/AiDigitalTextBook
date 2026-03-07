import { Router } from "express";
import * as exerciseController from "../controllers/exercise.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allow } from "../middleware/roleGuard.middleware.js";

const router = Router();

// ── Student routes ────────────────────────────────────────────────────────────
router.get("/generate", protect, exerciseController.generateQuestion);  // AI dummy — ?conceptId=&difficulty=&type=
router.get("/history", protect, exerciseController.getAttemptHistory); // ?conceptId=&cursor=
router.get("/:id", protect, exerciseController.getExerciseById);
router.post("/submit", protect, exerciseController.submitAnswer);
router.post("/hint", protect, exerciseController.getHint);           // AI hint (dummy)

// ── Chapter Quiz routes ──────────────────────────────────────────────────────
router.post("/chapter-quiz/generate", protect, exerciseController.generateChapterQuiz);
router.post("/chapter-quiz/submit", protect, exerciseController.submitChapterQuiz);

// ── Teacher routes ────────────────────────────────────────────────────────────
router.post("/batch-generate", protect, allow("teacher", "admin"), exerciseController.batchGenerateQuestions);

export default router;
