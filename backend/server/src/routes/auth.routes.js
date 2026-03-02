import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getMe,
    updateMe,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    loginLimiter,
    registerLimiter,
} from "../middleware/rateLimiter.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    registerValidation,
    loginValidation,
    updateProfileValidation,
} from "../validators/auth.validator.js";

const router = Router();


// POST /api/v1/auth/register
router.post(
    "/register",
    registerLimiter,
    registerValidation,
    validate,
    registerUser
);

// POST /api/v1/auth/login
router.post(
    "/login",
    loginLimiter,
    loginValidation,
    validate,
    loginUser
);

// POST /api/v1/auth/refresh
router.post("/refresh", refreshAccessToken);

// ─── Protected Routes ─────────────────────────────────────────────────────────

// POST /api/v1/auth/logout
router.post("/logout", verifyJWT, logoutUser);

// GET  /api/v1/auth/me
router.get("/me", verifyJWT, getMe);

// PATCH /api/v1/auth/me
router.patch("/me", verifyJWT, updateProfileValidation, validate, updateMe);

export default router;
