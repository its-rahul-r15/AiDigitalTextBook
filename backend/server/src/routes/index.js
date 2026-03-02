// ─── routes/index.js ─────────────────────────────────────────────────────────
// Central router that mounts all feature routers under /api/v1

import { Router } from "express";

import authRouter from "./auth.routes.js";
import contentRouter from "./content.routes.js";
import tutorRouter from "./tutor.routes.js";
import exerciseRouter from "./exercise.routes.js";
import adaptiveRouter from "./adaptive.routes.js";
import analyticsRouter from "./analytics.routes.js";
import teacherRouter from "./teacher.routes.js";
import notesRouter from "./notes.routes.js";
import gamificationRouter from "./gamification.routes.js";
import syncRouter from "./sync.routes.js";

const router = Router();

router.use("/auth", authRouter);         // /api/v1/auth/*
router.use("/content", contentRouter);      // /api/v1/content/*
router.use("/tutor", tutorRouter);        // /api/v1/tutor/*       ← AI dummy
router.use("/exercises", exerciseRouter);     // /api/v1/exercises/*   ← AI dummy for generation
router.use("/adaptive", adaptiveRouter);     // /api/v1/adaptive/*
router.use("/analytics", analyticsRouter);    // /api/v1/analytics/*   ← AI dummy for weak-area tips
router.use("/teacher", teacherRouter);      // /api/v1/teacher/*
router.use("/notes", notesRouter);        // /api/v1/notes/*       ← AI dummy
router.use("/gamification", gamificationRouter); // /api/v1/gamification/*
router.use("/sync", syncRouter);         // /api/v1/sync/*

export default router;
