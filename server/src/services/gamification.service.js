// ─── gamification.service.js ─────────────────────────────────────────────────
// Handles XP points, level calculation, streak tracking, and badge awarding.
// NO AI NEEDED HERE — all logic is rule-based.

import User from "../models/User.model.js";
import Badge from "../models/Badge.model.js";
import { XP_VALUES, BADGE_TYPES } from "../utils/constants.util.js";
import logger from "../utils/logger.util.js";

/**
 * XP level thresholds. Student levels up every 100 XP.
 * Level 1 = 0–99 XP, Level 2 = 100–199 XP, etc.
 */
export function calculateLevel(xp) {
    return Math.floor(xp / 100) + 1;
}

/**
 * Award XP to a student after a correct answer.
 * Also checks if any badges should be awarded (see checkAndAwardBadges).
 *
 * @param {string} userId
 * @param {{ isCorrect: boolean, score: number, isStreak: boolean }} opts
 */
export async function awardXP(userId, { isCorrect, score, isStreak = false }) {
    if (!isCorrect) return; // No XP for wrong answers

    let xpGained = XP_VALUES.CORRECT_ANSWER;
    if (score === 100) xpGained += XP_VALUES.PERFECT_SCORE; // Bonus for perfect score
    if (isStreak) xpGained += XP_VALUES.STREAK_BONUS;      // Bonus for maintaining streak

    // Add XP to user (User model should have an `xp` field — add if missing)
    await User.findByIdAndUpdate(userId, { $inc: { xp: xpGained } });

    const user = await User.findById(userId).lean();
    await checkAndAwardBadges(userId, user);

    logger.info("XP awarded", { userId, xpGained });
    return xpGained;
}

/**
 * Update the student's daily login streak.
 * - If they logged in yesterday → streak continues (+1)
 * - If they logged in today already → no change
 * - If they missed a day → streak resets to 1
 *
 * @param {string} userId
 */
export async function updateStreak(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    if (lastLogin) lastLogin.setHours(0, 0, 0, 0);

    const dayDiff = lastLogin
        ? Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24))
        : null;

    let streakUpdate = {};
    if (dayDiff === null || dayDiff > 1) {
        // First login ever, or missed a day — reset streak
        streakUpdate = { currentStreak: 1 };
    } else if (dayDiff === 1) {
        // Logged in yesterday — extend streak
        streakUpdate = { $inc: { currentStreak: 1 } };
    }
    // dayDiff === 0 means already logged in today — no change

    if (Object.keys(streakUpdate).length) {
        await User.findByIdAndUpdate(userId, streakUpdate);
        // Check if a streak badge should be awarded
        const updated = await User.findById(userId).lean();
        await checkAndAwardBadges(userId, updated);
    }
}

/**
 * Check all badge conditions and award any badges the student has earned.
 * Add more badge conditions below as needed.
 *
 * @param {string} userId
 * @param {Object} user - the full user document
 */
async function checkAndAwardBadges(userId, user) {
    const existingBadges = await Badge.find({ userId }).lean();
    const earned = new Set(existingBadges.map((b) => b.badgeType));

    const toAward = [];

    // First login badge
    if (!earned.has(BADGE_TYPES.FIRST_LOGIN)) {
        toAward.push({
            userId,
            badgeType: BADGE_TYPES.FIRST_LOGIN,
            badgeName: "First Step",
            description: "Logged in for the first time. Your journey begins!",
        });
    }

    // 7-day streak badge
    if (user.currentStreak >= 7 && !earned.has(BADGE_TYPES.STREAK_7)) {
        toAward.push({
            userId,
            badgeType: BADGE_TYPES.STREAK_7,
            badgeName: "Week Warrior",
            description: "Maintained a 7-day study streak. Keep it up!",
        });
    }

    // 30-day streak badge
    if (user.currentStreak >= 30 && !earned.has(BADGE_TYPES.STREAK_30)) {
        toAward.push({
            userId,
            badgeType: BADGE_TYPES.STREAK_30,
            badgeName: "Monthly Master",
            description: "30 days of consistent learning. Incredible!",
        });
    }

    if (toAward.length) {
        await Badge.insertMany(toAward);
        logger.info("Badges awarded", { userId, badges: toAward.map((b) => b.badgeType) });
    }
}
