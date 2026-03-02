import { body } from "express-validator";

// ─── Register Validation ─────────────────────────────────────────────────────
export const registerValidation = [
    body("fullName")
        .trim()
        .notEmpty().withMessage("Full name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Full name must be 2–100 characters"),

    body("schoolName")
        .trim()
        .notEmpty().withMessage("School name is required")
        .isLength({ min: 2, max: 200 }).withMessage("School name must be 2–200 characters"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least one number")
        .matches(/[!@#$%^&*(),.?\":{}|<>]/).withMessage("Password must contain at least one special character"),

    body("role")
        .optional()
        .isIn(["student", "teacher"]).withMessage("Role must be student or teacher"),

    body("gradeLevel")
        .optional()
        .isInt({ min: 6, max: 12 }).withMessage("Grade level must be between 6 and 12"),

    body("boardName")
        .trim()
        .notEmpty().withMessage("Board name is required")
        .isIn(["CBSE", "ICSE", "STATE", "IB", "OTHER"]).withMessage("Board must be CBSE, ICSE, STATE, IB, or OTHER"),

    body("region")
        .optional()
        .trim()
        .isLength({ min: 2, max: 5 }).withMessage("Region should be a country code like IN, US"),

    body("languagePreference")
        .optional()
        .isIn(["en", "hi"]).withMessage("Language must be en or hi"),
];

// ─── Login Validation ─────────────────────────────────────────────────────────
export const loginValidation = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required"),
];

// ─── Update Profile Validation ────────────────────────────────────────────────
export const updateProfileValidation = [
    body("languagePreference")
        .optional()
        .isIn(["en", "hi"]).withMessage("Language must be en or hi"),

    body("region")
        .optional()
        .trim()
        .isLength({ min: 2, max: 5 }).withMessage("Region should be a country code like IN, US"),
];
