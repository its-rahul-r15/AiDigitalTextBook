import { Router } from "express";
import * as contentController from "../controllers/content.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allow } from "../middleware/roleGuard.middleware.js";

const router = Router();

// ── Public/Student routes ─────────────────────────────────────────────────────
router.get("/courses", protect, contentController.getCourses);
router.get("/courses/:id", protect, contentController.getCourseById);
router.get("/courses/:courseId/chapters", protect, contentController.getChaptersByCourse);
router.get("/chapters/:id", protect, contentController.getChapterById);
router.get("/concepts/:id", protect, contentController.getConceptById);
router.get("/search", protect, contentController.searchContent);     // ?q=
router.post("/highlight", protect, contentController.saveHighlight);     // AI dummy
router.get("/notes", protect, contentController.getUserNotes);
router.delete("/notes/:id", protect, contentController.deleteNote);
router.get("/progress", protect, contentController.getProgress);
router.post("/progress", protect, contentController.updateProgress);
router.post("/progress/study-time", protect, contentController.updateStudyTime);

// ── Admin/Teacher routes ─────────────────────────────────────────────────────────
router.post("/courses", protect, allow("admin", "teacher"), contentController.createCourse);
router.put("/courses/:id", protect, allow("admin", "teacher"), contentController.updateCourse);
router.post("/chapters", protect, allow("admin", "teacher"), contentController.createChapter);
router.put("/concepts/:id", protect, allow("admin"), contentController.updateConcept);

export default router;
