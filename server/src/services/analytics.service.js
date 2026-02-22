// ─── analytics.service.js ────────────────────────────────────────────────────
// Computes learning analytics from raw AttemptLog data.
// NO AI NEEDED HERE — all aggregation is pure MongoDB queries.
//
// These functions power the student progress dashboard (/api/v1/analytics/*).

import mongoose from "mongoose";
import AttemptLog from "../models/AttemptLog.model.js";
import SkillProfile from "../models/SkillProfile.model.js";

/**
 * Get a student's full progress summary.
 * Returns: total attempts, accuracy %, total time, skill mastery map.
 *
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getProgressSummary(userId) {
    const uid = new mongoose.Types.ObjectId(userId);

    const [stats] = await AttemptLog.aggregate([
        { $match: { userId: uid } },
        {
            $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                correctAttempts: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                totalTimeSecs: { $sum: "$timeTaken" },
                avgScore: { $avg: "$score" },
            },
        },
    ]);

    const skillProfile = await SkillProfile.findOne({ userId }).lean();

    return {
        totalAttempts: stats?.totalAttempts || 0,
        accuracy: stats
            ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
            : 0,
        totalTimeMinutes: Math.round((stats?.totalTimeSecs || 0) / 60),
        avgScore: Math.round(stats?.avgScore || 0),
        overallMastery: Math.round((skillProfile?.overallMastery || 0) * 100),
        currentDifficulty: skillProfile?.currentDifficulty || 3,
    };
}

/**
 * Get activity data for the last 365 days (for the heatmap on dashboard).
 * Returns an array of { date: "YYYY-MM-DD", count: number }.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getHeatmapData(userId) {
    const uid = new mongoose.Types.ObjectId(userId);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const data = await AttemptLog.aggregate([
        { $match: { userId: uid, createdAt: { $gte: oneYearAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return data.map((d) => ({ date: d._id, count: d.count }));
}

/**
 * Identify weak skill areas (mastery score below 0.4).
 * TO ADD AI LATER: Pass weakSkills to GPT-4o with "suggest improvement tips for: {weakSkills}" prompt.
 *
 * @param {string} userId
 * @returns {Promise<Array>} array of { skill, masteryScore, trend }
 */
export async function getWeakAreas(userId) {
    const profile = await SkillProfile.findOne({ userId }).lean();
    if (!profile) return [];

    const weak = [];
    for (const [skill, data] of Object.entries(profile.skills || {})) {
        if (data.masteryScore < 0.4) {
            weak.push({ skill, masteryScore: Math.round(data.masteryScore * 100), trend: data.trend });
        }
    }
    // Sort weakest first
    return weak.sort((a, b) => a.masteryScore - b.masteryScore);
}
