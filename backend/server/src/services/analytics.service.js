// ─── analytics.service.js ────────────────────────────────────────────────────
// Computes learning analytics from raw AttemptLog, SkillProfile, and UserProgress.
// All aggregation is pure MongoDB — no AI needed here.
//
// These functions power the student analytics dashboard (/api/v1/analytics/*).

import mongoose from "mongoose";
import AttemptLog from "../models/AttemptLog.model.js";
import SkillProfile from "../models/SkillProfile.model.js";
import UserProgress from "../models/UserProgress.model.js";

/**
 * Get a student's full progress summary.
 * Returns: total attempts, accuracy %, total time, skill mastery, study time.
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
                hintsUsed: { $sum: "$hintsUsed" },
            },
        },
    ]);

    // Day-by-day streak calculation (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await AttemptLog.aggregate([
        { $match: { userId: uid, createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: -1 } },
    ]);

    // Calculate streak
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const activityDates = new Set(dailyActivity.map((d) => d._id));
    let checkDate = new Date();
    for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (activityDates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    const skillProfile = await SkillProfile.findOne({ userId: uid }).lean();
    const userProgress = await UserProgress.findOne({ userId: uid }).lean();

    // Subject performance breakdown by conceptId (last 50 attempts)
    const recentAttempts = await AttemptLog.find({ userId: uid })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    const recentAccuracy = recentAttempts.length
        ? Math.round(
            (recentAttempts.filter((a) => a.isCorrect).length /
                recentAttempts.length) *
            100
        )
        : 0;

    return {
        totalAttempts: stats?.totalAttempts || 0,
        correctAttempts: stats?.correctAttempts || 0,
        accuracy: stats
            ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
            : 0,
        recentAccuracy,
        totalTimeMinutes: Math.round((stats?.totalTimeSecs || 0) / 60),
        avgScore: Math.round(stats?.avgScore || 0),
        hintsUsed: stats?.hintsUsed || 0,
        overallMastery: Math.round((skillProfile?.overallMastery || 0) * 100),
        currentDifficulty: skillProfile?.currentDifficulty || 3,
        streak,
        // From UserProgress (study time tracking)
        studyTimeMinutes: userProgress?.studyTimeMinutes || 0,
        weeklyGoalMinutes: userProgress?.weeklyGoalMinutes || 960,
        completedChapters: userProgress?.completedChapters?.length || 0,
    };
}

/**
 * Get a student's skill mastery levels as an array.
 * Returns: array of { skill, masteryScore, attempts, trend, lastPracticed }
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getSkillMastery(userId) {
    const profile = await SkillProfile.findOne({ userId }).lean();
    if (!profile || !profile.skills) return [];

    const skills = [];
    for (const [skill, data] of Object.entries(profile.skills)) {
        skills.push({
            name: skill,
            level: Math.round((data.masteryScore || 0) * 100),
            masteryScore: data.masteryScore || 0,
            attempts: data.attempts || 0,
            trend: data.trend || "stable",
            lastPracticed: data.lastPracticed || null,
        });
    }
    return skills.sort((a, b) => b.level - a.level);
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
                correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return data.map((d) => ({
        date: d._id,
        count: d.count,
        accuracy: d.count > 0 ? Math.round((d.correct / d.count) * 100) : 0,
    }));
}

/**
 * Identify weak skill areas (mastery score below 0.4).
 * TO ADD AI LATER: Pass weakSkills to GPT-4o with a prompt for personalised tips.
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
            weak.push({
                skill,
                masteryScore: Math.round(data.masteryScore * 100),
                trend: data.trend,
                attempts: data.attempts || 0,
            });
        }
    }
    return weak.sort((a, b) => a.masteryScore - b.masteryScore);
}

/**
 * Get daily performance breakdown for a given period (for the trend chart).
 * Returns: array of { date, attempts, accuracy, avgScore }
 *
 * @param {string} userId
 * @param {number} days  - number of days to look back (default 30)
 */
export async function getDailyPerformance(userId, days = 30) {
    const uid = new mongoose.Types.ObjectId(userId);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const data = await AttemptLog.aggregate([
        { $match: { userId: uid, createdAt: { $gte: since } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                attempts: { $sum: 1 },
                correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                avgScore: { $avg: "$score" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return data.map((d) => ({
        date: d._id,
        attempts: d.attempts,
        accuracy: d.attempts > 0 ? Math.round((d.correct / d.attempts) * 100) : 0,
        avgScore: Math.round(d.avgScore || 0),
    }));
}
