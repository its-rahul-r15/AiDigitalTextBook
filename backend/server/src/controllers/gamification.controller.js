// ─── gamification.controller.js ──────────────────────────────────────────────
// XP, levels, badges, and streaks — all rule-based, no AI needed.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import User from "../models/User.model.js";
import Badge from "../models/Badge.model.js";
import { calculateLevel } from "../services/gamification.service.js";
import { BADGE_TYPES } from "../utils/constants.util.js";

// ─── @desc   Get the full gamification profile (XP, level, badges, streak)
// ─── @route  GET /api/v1/gamification/profile
// ─── @access Student
export const getGamificationProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("xp currentStreak longestStreak fullName").lean();

    const xp = user?.xp || 0;
    const level = calculateLevel(xp);
    const xpForNextLevel = level * 100;
    const xpProgress = xp % 100; // XP within the current level

    const badges = await Badge.find({ userId: req.user._id }).sort({ earnedAt: -1 }).lean();

    return res.status(200).json(
        new ApiResponse(200, {
            xp,
            level,
            xpProgress,
            xpForNextLevel,
            currentStreak: user?.currentStreak || 0,
            longestStreak: user?.longestStreak || 0,
            totalBadges: badges.length,
            recentBadges: badges.slice(0, 3), // Show latest 3 badges
        }, "Gamification profile fetched")
    );
});

// ─── @desc   List all earned and locked badge definitions for the student
// ─── @route  GET /api/v1/gamification/badges
// ─── @access Student
export const getBadges = asyncHandler(async (req, res) => {
    const earnedBadges = await Badge.find({ userId: req.user._id }).lean();
    const earnedTypes = new Set(earnedBadges.map((b) => b.badgeType));

    // Build a complete list with locked/unlocked status
    const allBadges = Object.entries(BADGE_TYPES).map(([key, type]) => {
        const earned = earnedBadges.find((b) => b.badgeType === type);
        return {
            badgeType: type,
            badgeName: earned?.badgeName || key.replace(/_/g, " "),
            description: earned?.description || `Earn this badge by completing the ${type} challenge.`,
            isEarned: earnedTypes.has(type),
            earnedAt: earned?.earnedAt || null,
        };
    });

    return res.status(200).json(new ApiResponse(200, allBadges, "Badges fetched"));
});

// ─── @desc   Current streak and longest streak data
// ─── @route  GET /api/v1/gamification/streak
// ─── @access Student
export const getStreak = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("currentStreak longestStreak lastLogin").lean();

    return res.status(200).json(
        new ApiResponse(200, {
            currentStreak: user?.currentStreak || 0,
            longestStreak: user?.longestStreak || 0,
            lastLogin: user?.lastLogin,
        }, "Streak data fetched")
    );
});
