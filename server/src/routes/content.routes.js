import { Router } from "express";
import * as contentController from "../controllers/content.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allow } from "../middleware/roleGuard.middleware.js";

const router = Router();

// ── Public/Student routes ─────────────────────────────────────────────────────
router.get("/courses", protect, contentController.getCourses);
router.get("/courses/:id", protect, contentController.getCourseById);
router.get("/chapters/:id", protect, contentController.getChapterById);
router.get("/concepts/:id", protect, contentController.getConceptById);
router.get("/search", protect, contentController.searchContent);     // ?q=
router.post("/highlight", protect, contentController.saveHighlight);     // AI dummy

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post("/courses", protect, allow("admin"), contentController.createCourse);
router.put("/courses/:id", protect, allow("admin"), contentController.updateCourse);
router.post("/chapters", protect, allow("admin"), contentController.createChapter);
router.put("/concepts/:id", protect, allow("admin"), contentController.updateConcept);

export default router;
