import rateLimit from "express-rate-limit";

const createLimiter = (windowMs, max, message) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message,
        },
        skipSuccessfulRequests: false,
    });


export const loginLimiter = createLimiter(
    15 * 60 * 1000,
    10,
    "Too many login attempts. Please try again after 15 minutes."
);

// Registration: 5 attempts per hour per IP
export const registerLimiter = createLimiter(
    60 * 60 * 1000,
    5,
    "Too many registration attempts. Please try again after 1 hour."
);

// Global: 200 requests per 15 minutes
export const globalLimiter = createLimiter(
    15 * 60 * 1000,
    200,
    "Too many requests from this IP. Please try again after 15 minutes."
);
