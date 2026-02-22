// ─── jwt.util.js ─────────────────────────────────────────────────────────────
// Centralised JWT sign / verify helpers.
// All token logic lives here so we change one place if we switch to RS256 later.
//
// Access Token  → short-lived (15m), sent in Authorization header
// Refresh Token → long-lived (7d), stored in httpOnly cookie + Redis/DB

import jwt from "jsonwebtoken";
import { ApiError } from "./apiError.js";

/**
 * Sign a new access token for a user.
 * @param {{ id, role, email }} payload
 * @returns {string} signed JWT
 */
export function signAccessToken(payload) {
    return jwt.sign(
        { _id: payload.id, role: payload.role, email: payload.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
    );
}

/**
 * Sign a new refresh token for a user.
 * @param {{ id }} payload
 * @returns {string} signed JWT
 */
export function signRefreshToken(payload) {
    return jwt.sign(
        { _id: payload.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );
}

/**
 * Verify and decode an access token.
 * Throws ApiError 401 if invalid or expired.
 * @param {string} token
 * @returns decoded payload
 */
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, "Invalid or expired access token");
    }
}

/**
 * Verify and decode a refresh token.
 * Throws ApiError 401 if invalid or expired.
 * @param {string} token
 * @returns decoded payload
 */
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
}
