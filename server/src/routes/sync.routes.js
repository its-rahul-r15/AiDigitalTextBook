import { Router } from "express";
import * as syncController from "../controllers/sync.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/push", protect, syncController.pushSync);    // Push offline attempts
router.get("/pull", protect, syncController.pullSync);    // Pull server changes
router.get("/status", protect, syncController.getSyncStatus);

export default router;
