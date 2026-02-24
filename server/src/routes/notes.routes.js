import { Router } from "express";
import * as notesController from "../controllers/notes.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, notesController.getNotes);           // ?conceptId=&cursor=
router.post("/summarize", protect, notesController.summarizeHighlight); // AI dummy
router.post("/flashcards", protect, notesController.generateFlashcards); // AI dummy
router.delete("/:id", protect, notesController.deleteNote);

export default router;
